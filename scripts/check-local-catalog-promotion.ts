import {seedRetainedListingFixtures} from './catalog/seed-local-listings';
import {demoCatalog} from '../artifacts/api-server/src/modules/catalog/demo';
import {PGlite} from '@electric-sql/pglite';
import {pg_trgm} from '@electric-sql/pglite/contrib/pg_trgm';
import {readFile,readdir,writeFile} from 'node:fs/promises';
import assert from 'node:assert/strict';
import {promoteRetainedCatalog,retainedRecords} from './catalog/promote-local';
import {PostgresCatalogRepository} from '../artifacts/api-server/src/modules/catalog/repository';
import {filtersFrom} from '../artifacts/api-server/src/modules/catalog/search';
process.env.NODE_ENV='development';process.env.TROC_LOCAL_ACCOUNTS='true';
const db=new PGlite({extensions:{pg_trgm}});
try{
 for(const f of (await readdir('lib/db/migrations')).filter(f=>f.endsWith('.sql')).sort())await db.exec(await readFile('lib/db/migrations/'+f,'utf8'));
 const t=performance.now();const first=await promoteRetainedCatalog(db);const importMs=Math.round(performance.now()-t);assert.equal(first.products,20059);
 for(const seller of demoCatalog().sellers)await db.query("INSERT INTO troc.seller_accounts(id,slug,display_name,seller_type,status) VALUES($1,$2,$3,'individual','active')",[seller.id,seller.slug,seller.name]);
 const listingBatch=await seedRetainedListingFixtures(db);assert.ok(listingBatch.listings!>20000);
 const listing=(await db.query<{id:string}>('SELECT id FROM troc.listings LIMIT 1')).rows[0];await db.query('UPDATE troc.listings SET quantity=2 WHERE id=$1',[listing.id]);
 assert.equal((await seedRetainedListingFixtures(db)).skipped,true);assert.equal((await db.query('SELECT quantity FROM troc.listings WHERE id=$1',[listing.id])).rows[0].quantity,2);
 const second=await promoteRetainedCatalog(db);assert.equal(second.skipped,true);
 const excluded=retainedRecords().excluded[0];const reference=retainedRecords().records[0].product;
 if(excluded){
  await db.query("INSERT INTO troc.catalog_products(id,game_id,set_id,slug,name_en,name_fr,product_type) VALUES($1,$2,$3,'excluded-digital-fixture','Digital fixture','Digital fixture','raw_single')",[excluded.productId,reference.gameId,reference.setId]);
  await db.query("INSERT INTO troc.catalog_source_entities(provider,kind,external_key,product_id) VALUES('tcgdex','product','excluded-digital-fixture',$1)",[excluded.productId]);
  await db.query("INSERT INTO troc.catalog_documents(product_id,search_text,document) VALUES($1,'digital','{}')",[excluded.productId]);
  await db.exec('DELETE FROM public.local_catalogue_revisions');await promoteRetainedCatalog(db);
  assert.equal((await db.query('SELECT count(*)::int n FROM troc.catalog_documents WHERE product_id=$1',[excluded.productId])).rows[0].n,0);
  assert.equal((await db.query('SELECT count(*)::int n FROM troc.catalog_products WHERE id=$1',[excluded.productId])).rows[0].n,1);

 }
 const repo=new PostgresCatalogRepository(db),measurements=[];
 for(const limit of [12,24,48,100,248]){const result=await repo.search(filtersFrom(new URLSearchParams({limit:String(limit)})));assert.equal(result.items.length,limit);assert.equal(new Set(result.items.map(r=>r.product.id)).size,limit);}
 assert.throws(()=>filtersFrom(new URLSearchParams({limit:'249'})),/invalid_search/);
 for(const params of [{},{game:'pokemon'},{game:'magic'},{q:'Pikachu'},{q:'Lightning Bolt'},{sort:'price'}]){const start=performance.now();const result=await repo.search(filtersFrom(new URLSearchParams(params)));measurements.push({params,ms:Math.round(performance.now()-start),results:result.items.length});assert.ok(result.items.length>0);}
 const parity=[];
 for(const q of ['Pikachu','Lightning Bolt','dragon','Pikchu','100','no-such-record-zzzz']){
  let cursor='';
  for(let page=0;page<3;page++){
   const filters=filtersFrom(new URLSearchParams({q,cursor}));
   const start=performance.now(),actual=await repo.search(filters),fastMs=Math.round(performance.now()-start);
   const before=performance.now(),expected=await (repo as any).searchPage(filters,false),originalMs=Math.round(performance.now()-before);
   assert.deepEqual(actual,expected);parity.push({q,page,fastMs,originalMs,same:true});if(!actual.nextCursor)break;cursor=actual.nextCursor;
  }
 }
 const records=retainedRecords().records;const a=records[0],b=records[1];
 assert.equal((await db.query('SELECT count(*)::int AS n FROM troc.catalog_documents')).rows[0].n,20059);
 await db.query('DELETE FROM public.local_catalogue_revisions');
 await db.query('UPDATE troc.external_catalog_mappings SET variant_id=$1 WHERE provider=$2 AND external_id=$3',[b.product.variants[0].id,a.provider,a.externalId+':'+a.product.variants[0].language+':'+a.product.variants[0].key]);
 await assert.rejects(()=>promoteRetainedCatalog(db),/external_identity_conflict/);
 assert.equal((await db.query('SELECT count(*)::int AS n FROM public.local_catalogue_revisions')).rows[0].n,0);
 if(excluded){
  await db.query("INSERT INTO troc.printings(id,product_id,language,printing_key) VALUES('99999999-0000-4000-8000-000000000001',$1,'en','excluded')",[excluded.productId]);
  await db.exec("INSERT INTO troc.variants(id,printing_id,variant_key,attributes) VALUES('99999999-0000-4000-8000-000000000002','99999999-0000-4000-8000-000000000001','unspecified','{}')");
  const guarded=(await db.query<{id:string}>("INSERT INTO troc.listings(seller_id,variant_id,condition,unit_price_cents,quantity,status) SELECT id,'99999999-0000-4000-8000-000000000002','NM',100,1,'active' FROM troc.seller_accounts LIMIT 1 RETURNING id")).rows[0];
  await db.exec('DELETE FROM public.local_catalogue_revisions');await assert.rejects(()=>promoteRetainedCatalog(db),/excluded_catalogue_has_listings/);

 }
 const evidence={...first,listingBatch,digitalExclusionPreservesIds:true,exclusionRejectsListedCards:true,listingReplayPreservesStock:true,importMs,replaySkipped:true,conflictRejected:true,failedRevisionNotAccepted:true,measurements,parity};await writeFile('docs/evidence/catalog-scale/postgres-promotion.json',JSON.stringify(evidence,null,2));console.log(evidence);
}catch(error){console.error(error instanceof Error?error.message:String(error));process.exitCode=1;}finally{await db.close();}
