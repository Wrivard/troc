import {PGlite} from "@electric-sql/pglite";
import {pg_trgm} from "@electric-sql/pglite/contrib/pg_trgm";
import {readFile,readdir,mkdir,writeFile} from "node:fs/promises";
import {performance} from "node:perf_hooks";
import {PostgresCatalogRepository} from "../artifacts/api-server/src/modules/catalog/repository";
import {filtersFrom} from "../artifacts/api-server/src/modules/catalog/search";
import assert from "node:assert/strict";
const db=new PGlite({extensions:{pg_trgm}});
try{
 for(const f of (await readdir("lib/db/migrations")).filter(f=>f.endsWith(".sql")).sort())await db.exec(await readFile("lib/db/migrations/"+f,"utf8"));
 await db.exec(`
 CREATE TEMP TABLE bench_keys AS SELECT n,gen_random_uuid() product,gen_random_uuid() printing,gen_random_uuid() variant FROM generate_series(1,50000) n;
 INSERT INTO troc.games(id,slug,name_en,name_fr) VALUES('00000000-0000-4000-8000-000000000101','synthetic','Synthetic','Fictif');
 INSERT INTO troc.set_releases(id,game_id,slug,name_en,name_fr,released_on) VALUES('00000000-0000-4000-8000-000000000102','00000000-0000-4000-8000-000000000101','synthetic-set','Synthetic set','Série fictive','2026-01-01');
 INSERT INTO troc.seller_accounts(id,slug,display_name,seller_type,status) SELECT ('00000000-0000-4000-8000-'||lpad(n::text,12,'0'))::uuid,'synthetic-seller-'||n,'Fictional seller '||n,'individual','active' FROM generate_series(1,5) n;
 INSERT INTO troc.catalog_products(id,game_id,set_id,slug,name_en,name_fr,product_type)
 SELECT product,'00000000-0000-4000-8000-000000000101','00000000-0000-4000-8000-000000000102','synthetic-card-'||n,'Northern Card '||lpad(n::text,5,'0'),'Carte Boréale '||lpad(n::text,5,'0'),'raw_single' FROM bench_keys;
 INSERT INTO troc.printings(id,product_id,language,collector_number,rarity,printing_key) SELECT printing,product,'en',lpad(n::text,5,'0')||'/10000','common','standard' FROM bench_keys;
 INSERT INTO troc.variants(id,printing_id,variant_key) SELECT variant,printing,'normal' FROM bench_keys;
 INSERT INTO troc.catalog_documents(product_id,search_text,document)
 SELECT k.product,p.name_en||' '||p.name_fr||' '||lpad(k.n::text,5,'0')||'/10000'||CASE WHEN k.n=9999 THEN ' maple aurora オーロラ' ELSE '' END,jsonb_build_object('id',p.id,'slug',p.slug,'name',jsonb_build_object('en',p.name_en,'fr',p.name_fr),'gameId',p.game_id,'setId',p.set_id,'type','raw_single','variants',jsonb_build_array(jsonb_build_object('id',k.variant,'language','en','key','normal','number',lpad(k.n::text,5,'0')||'/10000')),'aliases','[]'::jsonb)
 FROM bench_keys k JOIN troc.catalog_products p ON p.id=k.product;
 INSERT INTO troc.listings(seller_id,variant_id,condition,unit_price_cents,quantity,status)
 SELECT s.id,k.variant,'NM',100+(k.n%1000),5,'active' FROM bench_keys k CROSS JOIN troc.seller_accounts s;
 ANALYZE;
 `);
 const repo=new PostgresCatalogRepository(db);
 const results=[];
 for(const q of ["","Northern Card 09999","09999/10000","maple aurora","Carte Boréale 09999","オーロラ","no-such-product-zzzz"]){
   const durations:number[]=[];let found:string[]=[];
   for(let i=0;i<3;i++){const start=performance.now();const page=await repo.search(filtersFrom(new URLSearchParams({q,limit:"12"})));durations.push(performance.now()-start);found=page.items.map(r=>r.product.slug);}
   durations.sort((a,b)=>a-b);results.push({query:q,medianMs:Math.round(durations[1]),maxMs:Math.round(durations[2]),sample:found.slice(0,3),targetInFirstPage:found.includes("synthetic-card-9999")});
 }
 for(const params of [{sort:"price"},{condition:"NM",max:"300"},{game:"synthetic",set:"synthetic-set"}]) {
   const durations:number[]=[];
   for(let i=0;i<3;i++){const start=performance.now();await repo.search(filtersFrom(new URLSearchParams({...params,limit:"12"})));durations.push(performance.now()-start);}
   durations.sort((a,b)=>a-b);results.push({query:JSON.stringify(params),medianMs:Math.round(durations[1]),maxMs:Math.round(durations[2]),sample:[],targetInFirstPage:false});
 }
 const filtered=await repo.search(filtersFrom(new URLSearchParams({q:"09999/10000",seller:"synthetic-seller-1",max:"100"})));
 assert.equal(filtered.items.length,0);
 await mkdir("docs/evidence/search",{recursive:true});
 const report={observedAt:new Date().toISOString(),engine:"PGlite embedded PostgreSQL; NOT hosted load/concurrency evidence",products:50000,offers:250000,iterations:3,results};
 await writeFile("docs/evidence/performance/catalog-50k-after.json",JSON.stringify(report,null,2));
 console.log(JSON.stringify(report));
}finally{await db.close();}
