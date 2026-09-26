import { createHash, randomUUID } from "node:crypto";
import type { Principal } from "../auth/permissions";
import type { TransactionStore } from "../commerce/checkout";
import type { Sql } from "../commerce/data";
import { InventoryService, uuid } from "../inventory/service";
import { DomainError } from "../shared/domain";
import { imageLimits, prepareImage } from "./prepare-image";
export interface PhotoQuarantineProvider {
  // Must be immutable, private, idempotent for identical key+digest; no public URL.
  putPrivate(key: string, bytes: Buffer, sha256: string, signal?: AbortSignal): Promise<void>;
  readPrivate(key: string, expiresInSeconds: number): Promise<{url:string;expiresAt:string}>;
  deletePrivate(key: string): Promise<void>; // idempotent, including absent objects
}
export interface PhotoScanner { scan(bytes: Buffer, signal?: AbortSignal): Promise<"clean" | "rejected"> }
type Upload = {id:string;object_sha256:string|null;actor_id:string;listing_id:string;listing_version:number;input_sha256:string;content_type:string;state:"pending"|"ready"|"rejected"|"attached"|"expired"|"removed";removed_version:number|null;removal_from_version:number|null;attached_version:number|null;expired:boolean};
const hash=(bytes:Buffer)=>createHash("sha256").update(bytes).digest("hex");
/** Server-only staging. Ready means scanned private bytes, never permission to publish. */
export class PhotoQuarantineService {
  private inventory:InventoryService;
  constructor(private db:Sql,private store:TransactionStore,private storage:PhotoQuarantineProvider,private scanner:PhotoScanner){this.inventory=new InventoryService(db,store);}
  async stage(p:Principal,seller:string,listing:string,version:number,requestKey:string,input:Buffer,mime:string,signal?:AbortSignal){
    signal?.throwIfAborted();
    seller=uuid(seller);listing=uuid(listing);requestKey=uuid(requestKey);
    if(!Number.isSafeInteger(version)||version<1)throw new DomainError("invalid_inventory");
    if(!input.length||input.length>imageLimits.bytes)throw new DomainError("image_size_invalid",422);
    if(!["image/jpeg","image/png","image/webp"].includes(mime))throw new DomainError("image_type_unsupported",422);
    const bytes=Buffer.from(input),digest=hash(bytes);
    const reserve=async(tx:Sql,create:boolean)=>{
      signal?.throwIfAborted();
      await this.inventory.access(tx,p,seller,true);
      const current=(await tx.query<{inventory_version:number}>("SELECT inventory_version FROM troc.listings WHERE id=$1 AND seller_id=$2 FOR UPDATE",[listing,seller])).rows[0];
      if(!current)throw new DomainError("not_found",404);
      let record=(await tx.query<Upload>("SELECT *,expires_at<=clock_timestamp() AS expired FROM troc.listing_photo_uploads WHERE seller_id=$1 AND request_key=$2 FOR UPDATE",[seller,requestKey])).rows[0];
      if(record){
        if(record.actor_id!==p.userId||record.listing_id!==listing||record.listing_version!==version||record.input_sha256!==digest||record.content_type!==mime)throw new DomainError("upload_request_conflict",409);
        if(record.expired)throw new DomainError("upload_expired",409);
      }
      if(current.inventory_version!==version)throw new DomainError("inventory_changed",409);
      if(!record){
        if(!create)throw new DomainError("not_found",404);
        // Technical staging budget, including rejected attempts until expiry.
        // Serialized by seller lock; retries of an existing request consume no slot.
        const usage=(await tx.query<{seller_count:number;listing_count:number}>("SELECT count(*)::integer AS seller_count,count(*) FILTER(WHERE listing_id=$2)::integer AS listing_count FROM troc.listing_photo_uploads WHERE seller_id=$1 AND expires_at>clock_timestamp()",[seller,listing])).rows[0];
        if(usage.seller_count>=120||usage.listing_count>=12)throw new DomainError("image_staging_limit",429);

        record=(await tx.query<Upload>("INSERT INTO troc.listing_photo_uploads(id,seller_id,listing_id,actor_id,request_key,listing_version,input_sha256,content_type) VALUES($1,$2,$3,$4,$5,$6,$7,$8) RETURNING *,false AS expired",[randomUUID(),seller,listing,p.userId,requestKey,version,digest,mime])).rows[0];
      }
      return record;
    };
    const upload=await this.store.transaction(tx=>reserve(tx,true));
    if(upload.state!=="pending")return {id:upload.id,state:upload.state};
    signal?.throwIfAborted();
    const prepared=await prepareImage(bytes,mime);
    signal?.throwIfAborted();
    // Persist the intended immutable key before any provider I/O so failures
    // remain discoverable by expiry cleanup, even if the provider times out.
    await this.store.transaction(async tx=>{
      const latest=await reserve(tx,false);
      if(latest.object_sha256 && latest.object_sha256!==prepared.sha256)throw new DomainError("upload_rendition_conflict",409);
      await tx.query("UPDATE troc.listing_photo_uploads SET object_sha256=$2 WHERE id=$1",[upload.id,prepared.sha256]);
    });
    const verdict=await this.scanner.scan(Buffer.from(prepared.bytes),signal);
    signal?.throwIfAborted();
    if(verdict!=="clean"&&verdict!=="rejected")throw new DomainError("image_scan_unavailable",503);
    if(verdict==="clean")await this.storage.putPrivate("listing-quarantine/"+upload.id+"/"+prepared.sha256+".webp",prepared.bytes,prepared.sha256,signal);
    signal?.throwIfAborted();
    // No external I/O inside database locks. Recheck authority and listing revision
    // after scanning/storage; a late revocation cannot mark the record ready.
    return this.store.transaction(async tx=>{
      const latest=await reserve(tx,false);
      if(latest.state!=="pending")return {id:latest.id,state:latest.state};
      const state=verdict==="clean"?"ready":"rejected";
      await tx.query("UPDATE troc.listing_photo_uploads SET state=$2,output_sha256=$3 WHERE id=$1",[upload.id,state,verdict==="clean"?prepared.sha256:null]);
      return {id:upload.id,state};
    });
  }
  /** Explicit private attachment; deliberately does not satisfy public photo policy. */
  async attach(p:Principal,seller:string,listing:string,uploadId:string,version:number){
    seller=uuid(seller);listing=uuid(listing);uploadId=uuid(uploadId);
    if(!Number.isSafeInteger(version)||version<1)throw new DomainError("invalid_inventory");
    return this.store.transaction(async tx=>{
      await this.inventory.access(tx,p,seller,true);
      const current=(await tx.query<{inventory_version:number}>("SELECT inventory_version FROM troc.listings WHERE id=$1 AND seller_id=$2 FOR UPDATE",[listing,seller])).rows[0];
      const upload=(await tx.query<Upload>("SELECT *,expires_at<=clock_timestamp() AS expired FROM troc.listing_photo_uploads WHERE id=$1 AND seller_id=$2 AND listing_id=$3 FOR UPDATE",[uploadId,seller,listing])).rows[0];
      if(!current||!upload)throw new DomainError("not_found",404);
      if(upload.actor_id!==p.userId)throw new DomainError("forbidden",403);
      if(upload.listing_version!==version)throw new DomainError("upload_request_conflict",409);
      if(upload.state==='removed')throw new DomainError("image_removed",409);
      if(upload.state==='attached')return {id:upload.id,version:upload.attached_version};
      if(upload.expired||upload.state==='expired')throw new DomainError("upload_expired",409);
      if(upload.state!=='ready')throw new DomainError("image_not_ready",409);
      if(current.inventory_version!==version)throw new DomainError("inventory_changed",409);
      if((await tx.query("SELECT 1 FROM troc.inventory_reservations WHERE listing_id=$1 AND state='reserved' AND expires_at>now() LIMIT 1",[listing])).rows.length)throw new DomainError("inventory_reserved",409);
      const count=(await tx.query<{n:number}>("SELECT count(*)::integer AS n FROM troc.listing_photo_uploads WHERE listing_id=$1 AND state='attached'",[listing])).rows[0].n;
      if(count>=12)throw new DomainError("image_attachment_limit",409);
      const saved=(await tx.query<{inventory_version:number}>("UPDATE troc.listings SET updated_at=now() WHERE id=$1 RETURNING inventory_version",[listing])).rows[0];
      await tx.query("UPDATE troc.listing_photo_uploads SET state='attached',attached_version=$2 WHERE id=$1",[upload.id,saved.inventory_version]);
      await tx.query("INSERT INTO troc.audit_events(actor_id,action,entity_type,entity_id) VALUES($1,'inventory.photo_attached','listing',$2)",[p.userId,listing]);
      return {id:upload.id,version:saved.inventory_version};
    });
  }
  async remove(p:Principal,seller:string,listing:string,uploadId:string,version:number){
    seller=uuid(seller);listing=uuid(listing);uploadId=uuid(uploadId);
    if(!Number.isSafeInteger(version)||version<1)throw new DomainError("invalid_inventory");
    return this.store.transaction(async tx=>{
      await this.inventory.access(tx,p,seller,true);
      const current=(await tx.query<{inventory_version:number}>("SELECT inventory_version FROM troc.listings WHERE id=$1 AND seller_id=$2 FOR UPDATE",[listing,seller])).rows[0];
      const upload=(await tx.query<Upload>("SELECT * FROM troc.listing_photo_uploads WHERE id=$1 AND seller_id=$2 AND listing_id=$3 FOR UPDATE",[uploadId,seller,listing])).rows[0];
      if(!current||!upload)throw new DomainError("not_found",404);
      if(upload.state==='removed'){
        if(upload.removal_from_version!==version)throw new DomainError("upload_request_conflict",409);
        return {id:upload.id,version:upload.removed_version};
      }
      if(upload.state!=='attached')throw new DomainError("image_not_attached",409);
      if(current.inventory_version!==version)throw new DomainError("inventory_changed",409);
      if((await tx.query("SELECT 1 FROM troc.inventory_reservations WHERE listing_id=$1 AND state='reserved' AND expires_at>now() LIMIT 1",[listing])).rows.length)throw new DomainError("inventory_reserved",409);
      const saved=(await tx.query<{inventory_version:number}>("UPDATE troc.listings SET updated_at=now() WHERE id=$1 RETURNING inventory_version",[listing])).rows[0];
      await tx.query("UPDATE troc.listing_photo_uploads SET state='removed',removed_version=$2,removal_from_version=$3 WHERE id=$1",[upload.id,saved.inventory_version,version]);
      await tx.query("INSERT INTO troc.audit_events(actor_id,action,entity_type,entity_id) VALUES($1,'inventory.photo_removed','listing',$2)",[p.userId,listing]);
      return {id:upload.id,version:saved.inventory_version};
    });
  }
  async readAttached(p:Principal,seller:string,uploadId:string){
    await this.inventory.access(this.db,p,uuid(seller));
    const row=(await this.db.query<{id:string;output_sha256:string}>("SELECT u.id,u.output_sha256 FROM troc.listing_photo_uploads u JOIN troc.listings l ON l.id=u.listing_id AND l.seller_id=u.seller_id WHERE u.id=$1 AND u.seller_id=$2 AND u.state='attached'",[uuid(uploadId),seller])).rows[0];
    if(!row)throw new DomainError("not_found",404);
    const started=Date.now();
    const signed=await this.storage.readPrivate("listing-quarantine/"+row.id+"/"+row.output_sha256+".webp",60).catch(()=>{throw new DomainError("image_read_unavailable",503);});
    // Providers are configured server-side, but malformed/long-lived credentials
    // must never escape through this boundary or an exception containing a URL.
    try{
      const url=new URL(signed.url),expires=Date.parse(signed.expiresAt);
      if(url.protocol!=="https:"||url.username||url.password||url.hash||!Number.isFinite(expires)||expires<=Date.now()||expires>started+300000)throw new Error("invalid");
    }catch{throw new DomainError("image_read_unavailable",503);}
    // Signing can await external I/O: recheck revocation/removal before returning.
    await this.inventory.access(this.db,p,seller);
    if(!(await this.db.query("SELECT id FROM troc.listing_photo_uploads WHERE id=$1 AND seller_id=$2 AND state='attached'",[row.id,seller])).rows.length)throw new DomainError("not_found",404);
    return signed;
  }
  /** Internal worker only. Restart pagination from null each sweep; retain records
   * so an in-flight late provider write is removed by a subsequent sweep. */
  async cleanupExpired(after: string|null = null, limit = 50) {
    if(after!==null)after=uuid(after);
    if(!Number.isSafeInteger(limit)||limit<1||limit>100)throw new DomainError("invalid_cleanup_limit");
    const rows=await this.store.transaction(async tx=>{
      const selected=(await tx.query<{id:string;object_sha256:string}>(
        "SELECT id,object_sha256 FROM troc.listing_photo_uploads WHERE state<>'attached' AND (state='removed' OR expires_at<=clock_timestamp()) AND object_sha256 IS NOT NULL AND ($1::uuid IS NULL OR id>$1) ORDER BY id LIMIT $2 FOR UPDATE SKIP LOCKED",[after,limit+1],
      )).rows;
      for(const row of selected.slice(0,limit))await tx.query("UPDATE troc.listing_photo_uploads SET state=CASE WHEN state='removed' THEN 'removed' ELSE 'expired' END WHERE id=$1",[row.id]);
      return selected;
    });
    const attempted=rows.slice(0,limit),failed:string[]=[];
    for(const row of attempted){
      try{await this.storage.deletePrivate("listing-quarantine/"+row.id+"/"+row.object_sha256+".webp");}
      catch{failed.push(row.id);}
    }
    return {attempted:attempted.length,failed,next:rows.length>limit?attempted.at(-1)!.id:null};
  }

}
