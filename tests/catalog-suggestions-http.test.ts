import test from "node:test";
import assert from "node:assert/strict";
import express from "express";
import {once} from "node:events";
test("suggestion HTTP route uses canonical demo results, validates queries and disables caching",async()=>{
 const saved=process.env.CATALOG_MODE;process.env.CATALOG_MODE="demo";
 const {default:router}=await import("../artifacts/api-server/src/routes/catalog");
 const app=express();app.use("/api",router);const server=app.listen(0,"127.0.0.1");
 try{await once(server,"listening");const address=server.address();assert.ok(address&&typeof address!=="string");const base="http://127.0.0.1:"+address.port+"/api/catalog/suggest";
 for(const lang of ["en","fr"]){const response=await fetch(base+"?q=pokemon&lang="+lang);assert.equal(response.status,200);assert.equal(response.headers.get("cache-control"),"no-store");const body=await response.json();assert.equal(body.locale,lang);assert.ok(body.groups.length>0);assert.ok(body.groups.every((g:{results:unknown[]})=>g.results.length<=4));}
 for(const query of ["?q=x&lang=de","?q="+ "x".repeat(101),"?q=a&q=b","?lang=en"]){const response=await fetch(base+query);assert.equal(response.status,400);assert.equal(response.headers.get("cache-control"),"no-store");}
 }finally{server.closeAllConnections();await new Promise<void>(resolve=>server.close(()=>resolve()));if(saved===undefined)delete process.env.CATALOG_MODE;else process.env.CATALOG_MODE=saved;}
});
