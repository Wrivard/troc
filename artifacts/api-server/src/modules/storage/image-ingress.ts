import { addAbortSignal, type Readable } from "node:stream";
import { DomainError } from "../shared/domain";
import { readImageBytes } from "./read-image-bytes";
/** Shared process instance; caller authenticates owner before calling. No waiting queue.
 * Holds admission through downstream work, even when a provider ignores cancellation. */
export class ImageIngress {
  private active=0;
  private owners=new Map<string,number>();
  constructor(private maximum=4,private perOwner=2,private deadlineMs=30000){
    if(![maximum,perOwner,deadlineMs].every(n=>Number.isSafeInteger(n)&&n>0))throw new Error("invalid_image_ingress_limits");
  }
  async run<T>(owner:string,stream:Readable,consume:(bytes:Buffer,signal:AbortSignal)=>Promise<T>,signal?:AbortSignal):Promise<T>{
    if(!owner||signal?.aborted){stream.destroy();throw new DomainError("image_upload_aborted",400);}
    if(this.active>=this.maximum||(this.owners.get(owner)??0)>=this.perOwner){stream.destroy();throw new DomainError("image_upload_busy",503);}
    this.active++;this.owners.set(owner,(this.owners.get(owner)??0)+1);
    const controller=new AbortController();
    const abort=()=>controller.abort(new DomainError("image_upload_aborted",400));
    signal?.addEventListener("abort",abort,{once:true});
    const timer=setTimeout(()=>controller.abort(new DomainError("image_upload_timeout",408)),this.deadlineMs);
    addAbortSignal(controller.signal,stream);
    try{
      const bytes=await readImageBytes(stream);
      if(controller.signal.aborted)throw controller.signal.reason;
      const result=await consume(bytes,controller.signal);
      if(controller.signal.aborted)throw controller.signal.reason;
      return result;
    }catch(error){
      stream.destroy();
      if(controller.signal.aborted)throw controller.signal.reason;
      throw error;
    }finally{
      clearTimeout(timer);signal?.removeEventListener("abort",abort);
      this.active--;const remaining=(this.owners.get(owner)??1)-1;
      if(remaining)this.owners.set(owner,remaining);else this.owners.delete(owner);
    }
  }
}
export const imageIngress=new ImageIngress();
