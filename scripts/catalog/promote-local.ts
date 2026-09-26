import {assertPublishedIdentities} from "./identity-integrity";
import { invalidateCatalogReferences } from "../../artifacts/api-server/src/modules/catalog/reference-cache";
import { physicalCatalogueRecord } from "./catalog-scope";
import {readFileSync} from 'node:fs';
import {resolve} from 'node:path';
import {createHash} from 'node:crypto';
import type {PGlite} from '@electric-sql/pglite';
import {assertSources,type SourcePolicy} from './source-policy';
import {demoCatalog} from '../../artifacts/api-server/src/modules/catalog/demo';
import {sampleProducts,sampleSets} from '../../artifacts/api-server/src/modules/catalog/sample/data';
export function retainedRecords(){
 const root=resolve('catalog-data'),manifest=JSON.parse(readFileSync(resolve(root,'current.json'),'utf8'));
 if(!/^[a-f0-9]{64}$/.test(manifest.revision))throw Error('invalid_catalogue_revision');
 const raw=readFileSync(resolve(root,'releases',manifest.revision,'records.jsonl'));
 if(createHash('sha256').update(raw).digest('hex')!==manifest.revision)throw Error('catalogue_checksum_mismatch');
 const records=raw.toString().trim().split('\n').map(row=>JSON.parse(row));
 if(records.length!==manifest.products)throw Error('catalogue_count_mismatch');
 const policy=JSON.parse(readFileSync(resolve(root,'source-policy.json'),'utf8')) as SourcePolicy;
 if(!records.every(physicalCatalogueRecord))throw Error('non_physical_catalogue_record');
 const rawExcluded=manifest.exclusionsHash?readFileSync(resolve(root,'releases',manifest.revision,'excluded-records.json')):Buffer.from('[]');
 if(manifest.exclusionsHash&&createHash('sha256').update(rawExcluded).digest('hex')!==manifest.exclusionsHash)throw Error('catalogue_exclusions_checksum');
 const excluded=JSON.parse(rawExcluded.toString());const includedIds=new Set(records.map((r:any)=>r.product.id));
 if(!Array.isArray(excluded)||excluded.some((r:any)=>r.provider!=='tcgdex'||r.reason!=='digital-only'||!/^[a-f0-9-]{36}$/.test(r.productId)||includedIds.has(r.productId)))throw Error('invalid_catalogue_exclusions');
 assertSources(records,policy,'local',false);assertPublishedIdentities(records);return {manifest,records,excluded};
}
/** Operator-only local promotion into the existing PostgreSQL schema. No network or artwork approval. */
export async function promoteRetainedCatalog(db:PGlite){
 if(process.env.TROC_LOCAL_ACCOUNTS!=='true'||process.env.NODE_ENV!=='development')throw Error('local_catalogue_promotion_only');
 const {manifest,records,excluded}=retainedRecords();
 await db.exec('CREATE TABLE IF NOT EXISTS public.local_catalogue_revisions(revision text PRIMARY KEY,products integer NOT NULL,completed_at timestamptz NOT NULL DEFAULT now())');
 if((await db.query('SELECT revision FROM public.local_catalogue_revisions WHERE revision=$1',[manifest.revision])).rows.length)return {revision:manifest.revision,skipped:true,products:manifest.products};
 const byId=new Map(records.map((r:any)=>[r.product.id,r]));
 // Existing locally approved samples survive independently of new source/artwork approvals.
 for(const p of sampleProducts)if(!byId.has(p.id))byId.set(p.id,{product:p,set:sampleSets.find(s=>s.id===p.setId),provider:null});
 const all=[...byId.values()] as any[];
 const unique=(rows:any[],key:(r:any)=>string)=>[...new Map(rows.map(r=>[key(r),r])).values()];
 await db.transaction(async tx=>{
  const excludedIds=excluded.map((r:any)=>r.productId);
  if(excludedIds.length){
   const inUse=await tx.query('SELECT 1 FROM troc.listings l JOIN troc.variants v ON v.id=l.variant_id JOIN troc.printings p ON p.id=v.printing_id WHERE p.product_id=ANY($1::uuid[]) LIMIT 1',[excludedIds]);
   if(inUse.rows.length)throw Error('excluded_catalogue_has_listings');
   await tx.query("DELETE FROM troc.catalog_documents d WHERE d.product_id=ANY($1::uuid[]) AND EXISTS(SELECT 1 FROM troc.catalog_source_entities e WHERE e.product_id=d.product_id AND e.provider='tcgdex' AND e.kind='product')",[excludedIds]);
  }
  async function bulk(table:string,shape:string,rows:any[],conflict='ON CONFLICT DO NOTHING'){
   const names=shape.split(',').map(c=>c.trim().split(' ')[0]).join(',');
   for(let i=0;i<rows.length;i+=400)await tx.query(`INSERT INTO troc.${table}(${names}) SELECT ${names} FROM jsonb_to_recordset($1::jsonb) AS x(${shape}) ${conflict}`,[JSON.stringify(rows.slice(i,i+400))]);
  }
  await bulk('games','id uuid,slug text,name_en text,name_fr text',demoCatalog().games.map(g=>({id:g.id,slug:g.slug,name_en:g.name.en,name_fr:g.name.fr})));
  await bulk('set_releases','id uuid,game_id uuid,slug text,name_en text,name_fr text,released_on date',unique(all.map(r=>({id:r.set.id,game_id:r.set.gameId,slug:r.set.slug,name_en:r.set.name.en,name_fr:r.set.name.fr,released_on:r.set.releasedOn})),r=>r.id));
  await bulk('catalog_products','id uuid,game_id uuid,set_id uuid,slug text,name_en text,name_fr text,product_type text',all.map(({product:p})=>({id:p.id,game_id:p.gameId,set_id:p.setId,slug:p.slug,name_en:p.name.en,name_fr:p.name.fr,product_type:p.type})));
  const variants=all.flatMap(({product:p})=>p.variants.map((v:any)=>({...v,productId:p.id})));
  await bulk('printings','id uuid,product_id uuid,language text,printing_key text,collector_number text,rarity text,artist text',unique(variants.map(v=>({id:v.printingId,product_id:v.productId,language:v.language,printing_key:v.printingId,collector_number:v.number,rarity:v.rarity,artist:v.artist})),r=>r.id));
  await bulk('variants','id uuid,printing_id uuid,variant_key text,attributes jsonb',variants.map(v=>({id:v.id,printing_id:v.printingId,variant_key:v.key,attributes:v.attributes})));
  await bulk('catalog_aliases','product_id uuid,locale text,alias text',unique(all.flatMap(({product:p})=>p.aliases.map((alias:string)=>({product_id:p.id,locale:'en',alias}))),r=>r.product_id+':'+r.alias));
  for(const provider of ['tcgdex','scryfall'])await tx.query(`INSERT INTO troc.catalog_providers(id,license,catalog_approved,approval_evidence,approved_at,demo) VALUES($1,$2,true,$3,now(),false) ON CONFLICT(id) DO NOTHING`,[provider,provider==='tcgdex'?'MIT metadata only':'Scryfall application-use terms; metadata only','LOCAL development only; catalog-data/source-policy.json; no production or artwork approval']);
  const entities:any[]=[],mappings:any[]=[];
  for(const r of records){const p=r.product;const productKey=r.game+'/'+r.set.slug+'/'+r.externalId;
   entities.push({provider:r.provider,kind:'game',external_key:r.game,game_id:p.gameId},{provider:r.provider,kind:'set',external_key:r.game+'/'+r.set.slug,set_id:p.setId},{provider:r.provider,kind:'product',external_key:productKey,product_id:p.id});
   for(const v of p.variants){entities.push({provider:r.provider,kind:'printing',external_key:productKey+'/'+v.language+'/'+v.printingId,printing_id:v.printingId});mappings.push({provider:r.provider,external_id:r.externalId+':'+v.language+':'+v.key,variant_id:v.id});}
  }
  // Conflicting mappings are rejected, never silently reassigned to another canonical identity.
  for(let i=0;i<mappings.length;i+=400){const conflicting=await tx.query(`SELECT 1 FROM jsonb_to_recordset($1::jsonb) x(provider text,external_id text,variant_id uuid) JOIN troc.external_catalog_mappings m USING(provider,external_id) WHERE m.variant_id<>x.variant_id LIMIT 1`,[JSON.stringify(mappings.slice(i,i+400))]);if(conflicting.rows.length)throw Error('external_identity_conflict');}
  const entityRows=unique(entities,r=>r.provider+':'+r.kind+':'+r.external_key);
  for(let i=0;i<entityRows.length;i+=400){const clash=await tx.query(`SELECT 1 FROM jsonb_to_recordset($1::jsonb) x(provider text,kind text,external_key text,game_id uuid,set_id uuid,product_id uuid,printing_id uuid) JOIN troc.catalog_source_entities e USING(provider,kind,external_key) WHERE COALESCE(e.game_id,e.set_id,e.product_id,e.printing_id)<>COALESCE(x.game_id,x.set_id,x.product_id,x.printing_id) LIMIT 1`,[JSON.stringify(entityRows.slice(i,i+400))]);if(clash.rows.length)throw Error('source_entity_conflict');}
  await bulk('catalog_source_entities','provider text,kind text,external_key text,game_id uuid,set_id uuid,product_id uuid,printing_id uuid',unique(entities,r=>r.provider+':'+r.kind+':'+r.external_key));
  await bulk('external_catalog_mappings','provider text,external_id text,variant_id uuid',mappings);
  await bulk('catalog_documents','product_id uuid,search_text text,document jsonb',all.map(r=>({product_id:r.product.id,search_text:[r.product.name.en,r.product.name.fr,r.set.name.en,r.set.name.fr,...r.product.aliases,...r.product.variants.flatMap((v:any)=>[v.number,v.artist,v.rarity])].join(' ').normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase(),document:{...r.product,demo:false,images:[],imageUrl:null,variants:r.product.variants.map((v:any)=>({...v,images:[]}))}})),'ON CONFLICT(product_id) DO UPDATE SET search_text=excluded.search_text,document=excluded.document,updated_at=now()');
  await tx.query('INSERT INTO public.local_catalogue_revisions(revision,products) VALUES($1,$2)',[manifest.revision,all.length]);
 });
 invalidateCatalogReferences();
 await db.exec('ANALYZE troc.catalog_products; ANALYZE troc.catalog_documents; ANALYZE troc.printings; ANALYZE troc.variants;');
 return {revision:manifest.revision,skipped:false,products:all.length};
}
