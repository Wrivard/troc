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
 CREATE TEMP TABLE bench_keys AS SELECT n,gen_random_uuid() product,gen_random_uuid() printing,gen_random_uuid() variant FROM generate_series(1,60) n;
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

 await db.exec("UPDATE troc.seller_accounts SET status='suspended' WHERE slug='synthetic-seller-2'; UPDATE troc.listings SET quantity=0 WHERE unit_price_cents%3=0; UPDATE troc.listings SET status='paused' WHERE unit_price_cents%7=0;");
 const cases=[{}, {condition:'NM'}, {condition:'LP'}, {seller:'synthetic-seller-1'}, {seller:'synthetic-seller-2'}, {min:'110',max:'140'}, {max:'105'}, {language:'ja'}, {variant:'normal'}, {rarity:'common'}];
 const results=[];
 for(const extra of cases){
   let cursor='';const seen=new Set<string>();let pages=0;
   do {
     const params=new URLSearchParams({...extra,sort:'price',limit:'7',cursor});
     const optimized=await repo.search(filtersFrom(params));
     // All fixtures share this game. Specifying it selects the unchanged selective plan.
     params.set('game','synthetic');
     const original=await repo.search(filtersFrom(params));
     assert.deepEqual(optimized,original);
     for(const row of optimized.items){assert.ok(!seen.has(row.product.id));seen.add(row.product.id);}
     cursor=optimized.nextCursor||'';pages++;assert.ok(pages<20);
   }while(cursor);
   results.push({filters:extra,pages,products:seen.size});
 }
 await mkdir('docs/evidence/performance',{recursive:true});
 await writeFile('docs/evidence/performance/price-plan-parity.json',JSON.stringify({sameOfferAndCursorParity:true,cases:results},null,2));
 console.log(JSON.stringify(results));
}finally{await db.close();}
