
import {test} from "node:test";import assert from "node:assert/strict";
import {analytics} from "../artifacts/marketplace/src/modules/seller-platform/seller-analytics-model";
import type{SellerOrder}from"../artifacts/marketplace/src/modules/seller-platform/operations-ui";
const make=(createdAt:string,totalCents:number,status="completed"):SellerOrder=>({id:createdAt,status,createdAt,buyer:"Test buyer",province:"QC",demo:true,totalCents,merchandiseCents:totalCents-100,shippingCents:100,refundedCents:0,messageCount:0,lastMessage:null,messageAt:null,lines:[{name:{en:"Test card",fr:"Carte test"},quantity:2,unitCents:(totalCents-100)/2,totalCents:totalCents-100,variantId:"test",condition:"NM",imageUrl:null}]});
test("Analytics reconciles integer cents, UTC period boundaries, refunds and cancellations",()=>{
 const now=Date.parse("2026-09-23T18:00:00Z");
 const orders=[make("2026-09-23T10:00:00Z",501),{...make("2026-09-17T00:00:00Z",1200),refundedCents:300},make("2026-09-16T23:59:59Z",400),make("2026-09-23T11:00:00Z",999,"cancelled"),make("2026-09-24T00:00:00Z",500)];
 const r=analytics(orders,7,now);
 assert.equal(r.total,1701);assert.equal(r.previousTotal,400);assert.equal(r.refunds,300);assert.equal(r.units,4);assert.equal(r.products[0].cents,1501);assert.deepEqual(r.provinces,[["QC",2]]);
 assert.equal(Math.round(r.series.reduce((n,d)=>n+d.value,0)*100),r.total);assert.equal(r.series.reduce((n,d)=>n+d.orders,0),2);
 assert.equal(r.series[0].day,"2026-09-17");assert.equal(r.series[6].day,"2026-09-23");
});
test("Empty analytics produces zero values without invented growth or products",()=>{const r=analytics([],30);assert.equal(r.total,0);assert.equal(r.products.length,0);assert.equal(r.previousTotal,0);assert.equal(r.series.length,30)});
