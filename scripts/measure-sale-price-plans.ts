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
 CREATE TEMP TABLE bench_keys AS SELECT n,gen_random_uuid() product,gen_random_uuid() printing,gen_random_uuid() variant FROM generate_series(1,10000) n;
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

 await db.exec(`UPDATE troc.listings SET sale_cents=greatest(1,unit_price_cents/2) WHERE unit_price_cents%3=0;
 INSERT INTO troc.listings(seller_id,variant_id,condition,unit_price_cents,sale_cents,quantity,status)
 SELECT '00000000-0000-4000-8000-000000000001',k.variant,'NM',100+x.n,CASE WHEN x.n%3=0 THEN 50+x.n/2 ELSE NULL END,5,'active' FROM bench_keys k CROSS JOIN generate_series(1,10000) x(n) WHERE k.n=1; ANALYZE;`);
 const repo=new PostgresCatalogRepository(db), product=await repo.product("synthetic-card-1");assert.ok(product);
 const results:unknown[]=[],baseline=new Map<string,string>();
 for(const indexed of [false,true]) {
  if(indexed)await db.exec("CREATE INDEX candidate_effective_price ON troc.listings(variant_id,(COALESCE(sale_cents,unit_price_cents)),id) WHERE status='active' AND quantity>0; ANALYZE troc.listings;");
  for(const query of ["sort=price&limit=12","condition=NM&max=300&limit=12","q=00001/10000&max=100&limit=12"]) {
   const times:number[]=[];for(let i=0;i<3;i++){const start=performance.now(),page=await repo.search(filtersFrom(new URLSearchParams(query)));times.push(performance.now()-start);const identity=JSON.stringify(page.items.map(r=>[r.product.id,r.lowestCents,r.quantity]));if(!indexed)baseline.set(query,identity);else assert.equal(identity,baseline.get(query));}
   results.push({indexed,query,times});
  }
  for(const sort of ["price_asc","price_desc"] as const){
   const times:number[]=[];for(let i=0;i<3;i++){const start=performance.now(),page=await repo.detail(product,product.variants[0].id,{filters:filtersFrom(new URLSearchParams()),sort,page:1,limit:20,grade:null});times.push(performance.now()-start);const identity=JSON.stringify(page.offers.map(o=>[o.id,o.cents]));if(!indexed)baseline.set(sort,identity);else assert.equal(identity,baseline.get(sort));}
   const plan=await db.query("EXPLAIN (ANALYZE,BUFFERS,FORMAT JSON) SELECT id,COALESCE(sale_cents,unit_price_cents) FROM troc.listings WHERE variant_id=$1 AND status='active' AND quantity>0 ORDER BY COALESCE(sale_cents,unit_price_cents) "+(sort==='price_asc'?'ASC':'DESC')+",id LIMIT 21",[product.variants[0].id]);
   results.push({indexed,sort,times,plan:plan.rows});
  }
 }
 await mkdir("docs/evidence/sale-price-parity",{recursive:true});await writeFile("docs/evidence/sale-price-parity/plans.json",JSON.stringify({engine:"Disposable PGlite; synthetic SQL fixtures only, no preview writes or native concurrency certification",products:10000,offers:60000,results},null,2));console.log("Sale-price plans and identical-result checks saved to docs/evidence/sale-price-parity/plans.json");
}finally{await db.close();}
