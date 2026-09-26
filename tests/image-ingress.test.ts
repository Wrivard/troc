import test from "node:test";
import assert from "node:assert/strict";
import { Readable } from "node:stream";
import { ImageIngress } from "../artifacts/api-server/src/modules/storage/image-ingress";
const stalled=()=>new Readable({read(){}});
test("admission caps owner and process work without queue and abort releases slots",async()=>{
  const ingress=new ImageIngress(2,1,1000),a=new AbortController(),b=new AbortController();
  const first=ingress.run("a",stalled(),async()=>1,a.signal),second=ingress.run("b",stalled(),async()=>2,b.signal);
  const all=Promise.allSettled([first,second]);
  const rejected=stalled();await assert.rejects(()=>ingress.run("a",rejected,async()=>0),/image_upload_busy/);assert.equal(rejected.destroyed,true);
  await assert.rejects(()=>ingress.run("c",stalled(),async()=>0),/image_upload_busy/);
  a.abort();b.abort();assert.ok((await all).every(r=>r.status==="rejected"));
  assert.equal(await ingress.run("a",Readable.from([Buffer.from([1])]),async bytes=>bytes.length),1);
});
test("stalled input times out and is destroyed without reaching consumer",async()=>{
  const ingress=new ImageIngress(1,1,20),stream=stalled();let called=false;
  await assert.rejects(()=>ingress.run("a",stream,async()=>{called=true;}),/image_upload_timeout/);
  assert.equal(stream.destroyed,true);assert.equal(called,false);
});
test("downstream work retains its slot until settled even after cancellation",async()=>{
  const ingress=new ImageIngress(1,1,1000),abort=new AbortController();
  let finish!:()=>void,started!:()=>void;
  const began=new Promise<void>(resolve=>{started=resolve;});
  const job=ingress.run("a",Readable.from([Buffer.from([1])]),async(_bytes,signal)=>{started();await new Promise<void>(resolve=>{finish=resolve;});assert.equal(signal.aborted,true);return 1;},abort.signal);
  const rejected=assert.rejects(()=>job,/image_upload_aborted/);
  await began;abort.abort();await assert.rejects(()=>ingress.run("b",stalled(),async()=>0),/image_upload_busy/);
  finish();await rejected;
  assert.equal(await ingress.run("b",Readable.from([Buffer.from([2])]),async()=>2),2);
});
test("transport and consumer errors free admission without masking failures",async()=>{
  const ingress=new ImageIngress(1,1,1000);
  const broken=new Readable({read(){this.destroy(new Error("transport failed"));}});
  await assert.rejects(()=>ingress.run("a",broken,async()=>0),/transport failed/);
  await assert.rejects(()=>ingress.run("a",Readable.from([Buffer.from([1])]),async()=>{throw new Error("scanner failed");}),/scanner failed/);
  const abort=new AbortController();abort.abort();await assert.rejects(()=>ingress.run("a",stalled(),async()=>0,abort.signal),/image_upload_aborted/);
});
