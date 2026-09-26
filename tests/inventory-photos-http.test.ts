import test from "node:test";
import assert from "node:assert/strict";
import { once } from "node:events";
import express from "express";
import { inventoryPhotosRouter } from "../artifacts/api-server/src/routes/inventory-photos";
import { DomainError } from "../artifacts/api-server/src/modules/shared/domain";
import type { Principal } from "../artifacts/api-server/src/modules/auth/permissions";
const seller="00000000-0000-4000-8000-000000000010",listing="00000000-0000-4000-8000-000000000011",upload="00000000-0000-4000-8000-000000000012";
test("photo HTTP adapter authenticates and gates raw staging and revision commands",async()=>{
  const app=express(),calls:string[]=[];let allowed=true;
  const principal=async(req:express.Request):Promise<Principal>=>{if(req.get("x-test-auth")!=="yes")throw new DomainError("unauthorized",401);return {userId:upload,roles:[],memberships:[]};};
  const access=async()=>{if(!allowed)throw new DomainError("forbidden",403);calls.push("access");};
  const photos={stage:async(_p:Principal,s:string,l:string,v:number,key:string,bytes:Buffer,mime:string,signal?:AbortSignal)=>{assert.equal(s,seller);assert.equal(l,listing);assert.equal(v,1);assert.equal(key,upload);assert.equal(mime,"image/png");assert.equal(bytes.toString(),"test bytes");assert.equal(signal?.aborted,false);calls.push("stage");return {id:upload,state:"ready"};},attach:async()=>{calls.push("attach");return {id:upload,version:2};},remove:async()=>{calls.push("remove");return {id:upload,version:3};},readAttached:async()=>({url:"https://unused.example",expiresAt:""})};
  const options={appOrigin:"http://site.test",principal,access,photos};
  app.use("/api",inventoryPhotosRouter(options));app.use("/disabled",inventoryPhotosRouter({...options,photos:null}));
  const server=app.listen(0,"127.0.0.1");await once(server,"listening");const address=server.address();assert.ok(address&&typeof address!=="string");
  const base="http://127.0.0.1:"+address.port,path="/inventory/"+seller+"/listings/"+listing+"/photos",headers={origin:"http://site.test","x-test-auth":"yes","x-listing-version":"1","idempotency-key":upload,"content-type":"image/png"};
  const post=(prefix="/api",extra:Record<string,string>={},suffix="")=>fetch(base+prefix+path+suffix,{method:"POST",headers:{...headers,...extra},body:suffix?undefined:"test bytes"});
  try{
    assert.equal((await post("/api",{origin:"http://evil.test"})).status,403);
    assert.equal((await post("/api",{"x-test-auth":"no"})).status,401);
    const missing=await post("/disabled");assert.equal(missing.status,503);assert.equal(missing.headers.get("cache-control"),"no-store");assert.equal((await missing.json()).code,"image_storage_unavailable");
    allowed=false;assert.equal((await post()).status,403);allowed=true;
    assert.equal((await post("/api",{"content-type":"application/json"})).status,415);
    assert.equal((await post("/api",{"content-encoding":"gzip"})).status,415);
    assert.equal((await post("/api",{"x-listing-version":"1e2"})).status,400);
    calls.length=0;const staged=await post();assert.equal(staged.status,201);assert.equal(staged.headers.get("cache-control"),"no-store");assert.deepEqual(calls,["access","stage"]);
    assert.equal((await post("/api",{},"/"+upload+"/attach")).status,200);
    assert.equal((await post("/api",{},"/"+upload+"/remove")).status,200);
  }finally{server.closeAllConnections();await new Promise<void>(resolve=>server.close(()=>resolve()));}
});
