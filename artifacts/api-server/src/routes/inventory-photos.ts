import { Router, type Request, type Response, type NextFunction } from "express";
import type { Principal } from "../modules/auth/permissions";
import type { PhotoQuarantineService } from "../modules/storage/photo-quarantine";
import { ImageIngress, imageIngress } from "../modules/storage/image-ingress";
import { imageLimits } from "../modules/storage/prepare-image";
import { uuid } from "../modules/inventory/service";
import { DomainError } from "../modules/shared/domain";
import { requestRateLimit } from "../modules/security/rate-limit";
// Explicit factory, not mounted until schema and real providers are configured.
export function inventoryPhotosRouter(options:{
  appOrigin:string;
  principal:(req:Request,res:Response)=>Promise<Principal>;
  access:(p:Principal,seller:string,listing:string)=>Promise<void>;
  photos:Pick<PhotoQuarantineService,"stage"|"attach"|"remove"|"readAttached">|null;
  ingress?:ImageIngress;
}){
  const router=Router(),origin=new URL(options.appOrigin).origin;
  router.use("/inventory/:seller/listings/:listing/photos",(_req,res,next)=>{res.setHeader("Cache-Control","no-store");next();});
  router.use("/inventory/:seller/listings/:listing/photos",requestRateLimit({namespace:"inventory-photos",windowMs:60000,limit:30}));
  const base="/inventory/:seller/listings/:listing/photos";
  const version=(req:Request)=>{const raw=req.get("x-listing-version")??"";if(!/^[1-9][0-9]{0,9}$/.test(raw)||!Number.isSafeInteger(Number(raw)))throw new DomainError("invalid_inventory");return Number(raw);};
  const context=async(req:Request,res:Response)=>{
    if(req.method!=="GET"&&(req.get("origin")!==origin||req.get("sec-fetch-site")==="cross-site"))throw new DomainError("forbidden",403);
    const p=await options.principal(req,res);
    if(!options.photos)throw new DomainError("image_storage_unavailable",503);
    const seller=uuid(req.params.seller),listing=uuid(req.params.listing);
    await options.access(p,seller,listing);
    return {p,seller,listing,photos:options.photos};
  };
  router.post(base,async(req,res)=>{
    const {p,seller,listing,photos}=await context(req,res),revision=version(req),key=uuid(req.get("idempotency-key"));
    const mime=req.get("content-type")??"";
    if(!["image/jpeg","image/png","image/webp"].includes(mime))throw new DomainError("image_type_unsupported",415);
    if(req.get("content-encoding")&&req.get("content-encoding")!=="identity")throw new DomainError("image_encoding_unsupported",415);
    const length=req.get("content-length");
    if(length&&(!/^[0-9]+$/.test(length)||Number(length)>imageLimits.bytes))throw new DomainError("image_size_invalid",413);
    const abort=new AbortController(),onClose=()=>{if(!res.writableEnded)abort.abort();};
    res.on("close",onClose);
    try{const result=await (options.ingress??imageIngress).run(seller,req,(bytes,signal)=>photos.stage(p,seller,listing,revision,key,bytes,mime,signal),abort.signal);res.status(201).json(result);}
    finally{res.off("close",onClose);}
  });
  router.post(base+"/:upload/attach",async(req,res)=>{const c=await context(req,res);res.json(await c.photos.attach(c.p,c.seller,c.listing,uuid(req.params.upload),version(req)));});
  router.post(base+"/:upload/remove",async(req,res)=>{const c=await context(req,res);res.json(await c.photos.remove(c.p,c.seller,c.listing,uuid(req.params.upload),version(req)));});
  router.use((error:unknown,_req:Request,res:Response,_next:NextFunction)=>{if(res.destroyed)return;res.status(error instanceof DomainError?error.status:503).json({code:error instanceof DomainError?error.code:"image_service_unavailable"});});
  return router;
}
