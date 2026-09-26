import type {PGlite} from '@electric-sql/pglite';
import {createHash} from 'node:crypto';
import {retainedRecords} from './promote-local';
import {sampleProducts} from '../../artifacts/api-server/src/modules/catalog/sample/data';
import {demoCatalog} from '../../artifacts/api-server/src/modules/catalog/demo';
/** Listings only: never alters canonical records, market history, accounts or real stock. */
export async function seedRetainedListingFixtures(db:PGlite){
 if(process.env.TROC_LOCAL_ACCOUNTS!=='true'||process.env.NODE_ENV!=='development')throw Error('local_listings_only');
 const key='retained-catalogue-listings-v1';
 const previous=await db.query('SELECT id FROM troc.demo_batches WHERE seed_key=$1',[key]);if(previous.rows.length)return {skipped:true};
 const originals=new Set(sampleProducts.flatMap(p=>p.variants.map(v=>v.id)));
 const variants=retainedRecords().records.flatMap((r:any)=>r.product.variants).filter((v:any)=>v.key!=='unspecified'&&!originals.has(v.id));
 const sellers=demoCatalog().sellers;
 const id=(value:string)=>{const h=createHash('sha256').update('troc-local-listing:'+value).digest('hex');return `${h.slice(0,8)}-${h.slice(8,12)}-4${h.slice(13,16)}-8${h.slice(17,20)}-${h.slice(20,32)}`;};
 let count=0;
 await db.transaction(async tx=>{
  const batch=(await tx.query<{id:string}>('INSERT INTO troc.demo_batches(seed_key) VALUES($1) RETURNING id',[key])).rows[0].id;
  const rows=variants.flatMap((v:any,index:number)=>sellers.map((s,offset)=>({id:id(v.id+s.id),seller_id:s.id,variant_id:v.id,condition:offset===1?'LP':'NM',unit_price_cents:25+(index%1500)*5+offset*10,quantity:1+(index%40),demo_batch_id:batch})));
  for(let i=0;i<rows.length;i+=500){await tx.query(`INSERT INTO troc.listings(id,seller_id,variant_id,condition,unit_price_cents,quantity,demo_batch_id,status) SELECT id,seller_id,variant_id,condition,unit_price_cents,quantity,demo_batch_id,'active' FROM jsonb_to_recordset($1::jsonb) x(id uuid,seller_id uuid,variant_id uuid,condition text,unit_price_cents integer,quantity integer,demo_batch_id uuid) ON CONFLICT(id) DO NOTHING`,[JSON.stringify(rows.slice(i,i+500))]);count+=Math.min(500,rows.length-i);}
 });
 await db.exec('ANALYZE troc.listings');return {skipped:false,listings:count};
}
