import { randomUUID, createHash } from 'node:crypto';
import { readFile, writeFile, mkdir } from 'node:fs/promises';
import sharp from 'sharp';
import { cached } from './providers.mjs';
import { sampleProducts, sampleSets } from '../../artifacts/api-server/src/modules/catalog/sample/data';
const root = new URL('../../', import.meta.url);
const dir = new URL('artifacts/api-server/src/modules/catalog/sample/', root);
const art = new URL('artifacts/marketplace/public/catalog-art/', root);
const registryFile = new URL('identities.json', dir);
const identities = JSON.parse(await readFile(registryFile, 'utf8'));
const provenance = JSON.parse(await readFile(new URL('provenance.json', dir), 'utf8'));
if (provenance.expansions?.some((entry: any) => entry.added === 1000 && entry.provider === 'scryfall')) {
 console.log('Authorized 1,000-printing expansion already complete; preserving catalogue.');
 process.exit(0);
}
const before = sampleProducts.map(p => p.id);
const id = (key: string): string => identities[key] ?? (identities[key] = randomUUID());
const slug = (s: string) => s.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0,70);
const capturedAt = new Date().toISOString();
const existing = new Set(provenance.records.filter((r: any) => r.provider === 'scryfall').map((r: any) => r.externalId));
const target = 1000;
let added = 0, pageCount = 0;
await mkdir(art, { recursive: true });
async function persist() {
 await writeFile(registryFile, JSON.stringify(identities, null, 2));
 await writeFile(new URL('data.ts', dir), '// Generated real provider records for local development only. Offers are fictional.\nimport type { Product, SetRelease } from "@workspace/catalog";\nexport const sampleProducts: Product[] = ' + JSON.stringify(sampleProducts) + ';\nexport const sampleSets: SetRelease[] = ' + JSON.stringify(sampleSets) + ';\n');
 await writeFile(new URL('provenance.json', dir), JSON.stringify(provenance, null, 2));
}
let next: string | null = 'https://api.scryfall.com/cards/search?unique=prints&order=set&q=' + encodeURIComponent('game:paper lang:en -is:digital');
while (next && added < target && pageCount < 12) {
 const page = JSON.parse((await cached(next)).toString()); pageCount++;
 if (!Array.isArray(page.data)) throw new Error('invalid_provider_page');
 for (const card of page.data) {
  if (added >= target) break;
  if (existing.has(card.id) || card.lang !== 'en' || !card.games.includes('paper')) continue;
  const faces = card.image_uris ? [{image_uris:card.image_uris}] : card.card_faces?.filter((f:any)=>f.image_uris);
  if (!faces?.length || !card.finishes?.length) continue;
  const key = 'scryfall:' + card.id + ':' + card.lang;
  const productId = id(key + ':product'), setId = id('scryfall:set:' + card.set + ':' + card.lang);
  const images: any[] = [];
  for (const [position, face] of faces.entries()) {
   const sourceUrl = face.image_uris.normal;
   const original = await cached(sourceUrl);
   const sources: any[] = [];
   let dimensions: any;
   for (const width of [245,600]) {
    const {data,info} = await sharp(original).resize({width,withoutEnlargement:true}).webp({quality:88}).toBuffer({resolveWithObject:true});
    const url = '/catalog-art/' + createHash('sha256').update(data).digest('hex').slice(0,20) + '-' + info.width + '.webp';
    await writeFile(new URL(url.slice('/catalog-art/'.length), art), data);
    provenance.assets.push({url, sourceUrl, width:info.width,height:info.height,bytes:data.length,capturedAt});
    sources.push({url,width:info.width}); dimensions=info;
   }
   images.push({id:id(key+':image:'+position),side:position?'back':'front',url:sources[1].url,sources,width:dimensions.width,height:dimensions.height,provenance:{provider:'scryfall',externalId:card.id,sourceUrl,license:'User-approved local development load test only; publisher rights retained',capturedAt}});
  }
  if (!sampleSets.some(s=>s.id===setId)) sampleSets.push({id:setId,gameId:'00000000-0000-4000-8001-000000000001',slug:'magic-'+slug(card.set_name)+'-'+card.lang+'-'+setId.slice(0,8),name:{en:card.set_name,fr:card.set_name},releasedOn:card.released_at});
  const variants = card.finishes.map((finish:string)=>({id:id(key+':variant:'+finish),printingId:id(key+':printing'),language:card.lang,key:finish,attributes:{finish},number:card.collector_number,rarity:card.rarity,artist:card.artist??'',images}));
  sampleProducts.push({id:productId,slug:'magic-'+slug(card.name)+'-'+productId.slice(0,8),name:{en:card.name,fr:card.name},gameId:'00000000-0000-4000-8001-000000000001',setId,type:'raw_single',variants,aliases:[card.name,card.set_name,card.collector_number],imageUrl:null,images,demo:true});
  for(const variant of variants){
   provenance.mappings.push({provider:'scryfall',externalId:card.id,language:card.lang,variant:variant.key,productId,printingId:variant.printingId,variantId:variant.id});
   provenance.records.push({provider:'scryfall',externalId:card.id,language:card.lang,sourceUrl:card.uri,productId,setId,printingId:variant.printingId,variantId:variant.id,capturedAt,demo:true});
  }
  existing.add(card.id); added++;
  if (added % 50 === 0) {await persist(); console.log(JSON.stringify({added,products:sampleProducts.length,pageCount}));}
 }
 next = page.has_more ? page.next_page : null;
}
provenance.expansions ??= [];
provenance.expansions.push({capturedAt,added,provider:'scryfall',approval:'User September 24: load more real cards for local catalogue performance testing',scope:'local-development-only'});
await persist();
const evidence = {added,products:sampleProducts.length,sets:sampleSets.length,variants:sampleProducts.reduce((n,p)=>n+p.variants.length,0),preservedIds:before.every(id=>sampleProducts.some(p=>p.id===id)),uniqueIds:new Set(sampleProducts.map(p=>p.id)).size===sampleProducts.length,artworkComplete:sampleProducts.every(p=>!!p.images?.length),pageCount,capturedAt};
await writeFile(new URL('docs/evidence/performance/real-catalog-expansion.json',root),JSON.stringify(evidence,null,2));
console.log(JSON.stringify(evidence));
