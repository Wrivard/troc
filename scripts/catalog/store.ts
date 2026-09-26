import {assertIdentityUnchanged,assertPublishedIdentities} from "./identity-integrity";
import { physicalCatalogueRecord } from "./catalog-scope";
import { assertSources, type SourcePolicy } from "./source-policy";
import { DatabaseSync } from 'node:sqlite';
import { createHash } from 'node:crypto';
import { mkdirSync, readFileSync, writeFileSync, renameSync, existsSync } from 'node:fs';
import { resolve } from 'node:path';
import { setTimeout as delay } from 'node:timers/promises';
export const directory=resolve('catalog-data');
mkdirSync(directory,{recursive:true});mkdirSync(resolve(directory,'raw'),{recursive:true});
export const db=new DatabaseSync(resolve(directory,'acquisition.sqlite'));
db.exec(`PRAGMA journal_mode=WAL; PRAGMA busy_timeout=10000;
CREATE TABLE IF NOT EXISTS records(source_key TEXT PRIMARY KEY,provider TEXT NOT NULL,external_id TEXT NOT NULL,game TEXT NOT NULL,product_id TEXT UNIQUE NOT NULL,payload TEXT NOT NULL,source_url TEXT NOT NULL,raw_hash TEXT NOT NULL,captured_at TEXT NOT NULL);
CREATE TABLE IF NOT EXISTS assets(source_url TEXT PRIMARY KEY,state TEXT NOT NULL DEFAULT 'pending',payload TEXT,error TEXT,attempts INTEGER NOT NULL DEFAULT 0);
CREATE TABLE IF NOT EXISTS batches(name TEXT PRIMARY KEY,payload TEXT NOT NULL);
CREATE TABLE IF NOT EXISTS responses(url TEXT PRIMARY KEY,sha256 TEXT NOT NULL,captured_at TEXT NOT NULL,bytes INTEGER NOT NULL);
CREATE TABLE IF NOT EXISTS quarantined(source_key TEXT PRIMARY KEY,reason TEXT NOT NULL,payload TEXT NOT NULL);`);
export const hash=(v:string|Buffer)=>createHash('sha256').update(v).digest('hex');
export function stableId(key:string){const h=hash('troc-canonical-v1:'+key);return `${h.slice(0,8)}-${h.slice(8,12)}-5${h.slice(13,16)}-8${h.slice(17,20)}-${h.slice(20,32)}`;}
export const gameIds:Record<string,string>={pokemon:'00000000-0000-4000-8001-000000000000',magic:'00000000-0000-4000-8001-000000000001','yu-gi-oh':'00000000-0000-4000-8001-000000000002','one-piece':'00000000-0000-4000-8001-000000000003'};
export const count=(game:string)=>Number(db.prepare('SELECT count(*) AS n FROM records WHERE game=?').get(game)!.n);
const hosts=new Set(['api.scryfall.com','cards.scryfall.io','db.ygoprodeck.com','images.ygoprodeck.com','raw.githubusercontent.com','images.pokemontcg.io','optcgapi.com','www.optcgapi.com','assets.tcgdex.net','api.tcgdex.net']);
let last=0;
export async function download(url:string,maxBytes=60_000_000):Promise<Buffer>{
 const parsed=new URL(url);if(parsed.protocol!=='https:'||!hosts.has(parsed.hostname)||parsed.username||parsed.password)throw Error('unapproved_source_host:'+parsed.hostname);
 const known=db.prepare('SELECT sha256 FROM responses WHERE url=?').get(url);
 if(known && existsSync(resolve(directory,'raw',String(known.sha256))))return readFileSync(resolve(directory,'raw',String(known.sha256)));
 for(let attempt=0;attempt<3;attempt++){
  const spacing=["cards.scryfall.io","assets.tcgdex.net"].includes(parsed.hostname)?100:200;const start=Math.max(Date.now(),last+spacing);last=start;await delay(start-Date.now());
  const response=await fetch(url,{headers:{'User-Agent':'TROC-CatalogAcquisition/1.0 (cached development catalogue)','Accept':'application/json,image/*'},signal:AbortSignal.timeout(30000),redirect:'error'});
  if((response.status===429||response.status>=500)&&attempt<2){const retry=Number(response.headers.get('retry-after'));await delay(Math.min(60000,Number.isFinite(retry)&&retry>0?retry*1000:1000*2**attempt));continue;}
  if(!response.ok)throw Error('source_http_'+response.status+':'+url);
  const chunks:Buffer[]=[];let bytes=0;
  for await(const chunk of response.body!){bytes+=chunk.length;if(bytes>maxBytes)throw Error('source_too_large');chunks.push(Buffer.from(chunk));}
  const body=Buffer.concat(chunks),digest=hash(body),path=resolve(directory,'raw',digest);
  if(!existsSync(path)){writeFileSync(path+'.tmp',body);renameSync(path+'.tmp',path);}
  db.prepare('INSERT OR REPLACE INTO responses VALUES(?,?,?,?)').run(url,digest,new Date().toISOString(),bytes);return body;
 }
 throw Error('source_retry_exhausted');
}
export async function json(url:string){const raw=await download(url);return {data:JSON.parse(raw.toString()),digest:hash(raw),url};}
export function put(envelope:any){
 const key=envelope.sourceKey;
 const existing=db.prepare('SELECT product_id,payload FROM records WHERE source_key=?').get(key);
 if(existing)assertIdentityUnchanged(JSON.parse(String(existing.payload)),envelope);
 if(existing&&existing.product_id!==envelope.product.id)throw Error('canonical_identity_conflict:'+key);
 db.prepare('INSERT INTO records VALUES(?,?,?,?,?,?,?,?,?) ON CONFLICT(source_key) DO UPDATE SET payload=excluded.payload,source_url=excluded.source_url,raw_hash=excluded.raw_hash,captured_at=excluded.captured_at').run(key,envelope.provider,envelope.externalId,envelope.game,envelope.product.id,JSON.stringify(envelope),envelope.sourceUrl,envelope.rawHash,envelope.capturedAt);
 for(const asset of envelope.artwork??[])db.prepare("INSERT OR IGNORE INTO assets(source_url,state) VALUES(?,'pending')").run(asset.url);
}
export function publish(options: { providers?: string[]; includeImages?: boolean } = {}){
 const allRecords=db.prepare('SELECT payload FROM records ORDER BY product_id').all().map(r=>JSON.parse(String(r.payload))).filter(r=>!options.providers || options.providers.includes(r.provider));
 const records=allRecords.filter(physicalCatalogueRecord);const excluded=allRecords.filter(r=>!physicalCatalogueRecord(r)).map(r=>({productId:r.product.id,provider:r.provider,reason:'digital-only'}));
 const policy=JSON.parse(readFileSync(resolve(directory,'source-policy.json'),'utf8')) as SourcePolicy;
 assertSources(records,policy,'local',false);
 const assets=new Map(db.prepare("SELECT a.source_url,a.payload,r.captured_at FROM assets a LEFT JOIN responses r ON r.url=COALESCE(json_extract(a.payload,'$.acquiredFrom'),a.source_url) WHERE a.state='ready'").all().map(r=>[String(r.source_url),{...JSON.parse(String(r.payload)),capturedAt:r.captured_at}]));
 for(const record of records){
  if(!record.product.images?.length){record.product.images=(record.artwork??[]).flatMap((a:any,index:number)=>{const image=assets.get(a.url);return image?[{...image,id:stableId(record.sourceKey+':image:'+index),side:a.side,position:index,provenance:{provider:record.provider,externalId:record.externalId,sourceUrl:image.acquiredFrom??a.url,license:'Publisher rights retained; locally acquired catalogue; production rights review pending',capturedAt:image.capturedAt??record.capturedAt}}]:[]});for(const v of record.product.variants)v.images=record.product.images;}
 }
 for(const record of records)if(!options.includeImages){record.product.images=[];record.product.imageUrl=null;for(const variant of record.product.variants)variant.images=[];record.artwork=[];}
 assertSources(records,policy,'local',options.includeImages===true);
 assertPublishedIdentities(records);
 const content=records.map(r=>JSON.stringify(r)).join('\n')+'\n';const revision=hash(content);const target=resolve(directory,'releases',revision);mkdirSync(target,{recursive:true});writeFileSync(resolve(target,'records.jsonl'),content);
 const exclusions=JSON.stringify(excluded);writeFileSync(resolve(target,'excluded-records.json'),exclusions);
 const manifest={version:1,revision,excludedProducts:excluded.length,exclusionsHash:hash(exclusions),createdAt:new Date().toISOString(),products:records.length,counts:Object.fromEntries(Object.keys(gameIds).map(g=>[g,records.filter(r=>r.game===g).length])),artworkReady:records.filter(r=>r.product.images?.length).length,rawResponses:db.prepare('SELECT count(*) AS n FROM responses').get()!.n,identityPolicy:'provider external identity + language; explicit preserved initial IDs; never match by card name',listingsIncluded:false,productionRightsApproved:false};
 const notices=records.some(r=>r.provider==='tcgdex')?readFileSync(resolve(directory,'TCGDEX-LICENSE.txt'),'utf8'):'';
 if(notices)writeFileSync(resolve(target,'THIRD-PARTY-NOTICES.txt'),notices);
 writeFileSync(resolve(target,'source-policy.json'),JSON.stringify(policy,null,2));
 writeFileSync(resolve(target,'manifest.json'),JSON.stringify(manifest,null,2));writeFileSync(resolve(directory,'current.json.tmp'),JSON.stringify(manifest,null,2));renameSync(resolve(directory,'current.json.tmp'),resolve(directory,'current.json'));console.log(JSON.stringify(manifest));return manifest;
}
