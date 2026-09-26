import {readFileSync,writeFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
import assert from 'node:assert/strict';
import {validateImport} from '../artifacts/api-server/src/modules/catalog/importer';
import {sampleProducts} from '../artifacts/api-server/src/modules/catalog/sample/data';
const manifest=JSON.parse(readFileSync('catalog-data/current.json','utf8'));
assert.match(manifest.revision,/^[a-f0-9]{64}$/);
const raw=readFileSync('catalog-data/releases/'+manifest.revision+'/records.jsonl');assert.equal(createHash('sha256').update(raw).digest('hex'),manifest.revision);
const records=raw.toString().trim().split('\n').map(s=>JSON.parse(s));assert.equal(records.length,manifest.products);assert.equal(manifest.counts.pokemon,12000);if(manifest.counts.magic)assert.equal(manifest.counts.magic,8000);
const ids=new Set(),keys=new Set();let variants=0;
for(const r of records){assert.ok(['tcgdex','scryfall'].includes(r.provider));assert.ok(!ids.has(r.product.id));assert.ok(!keys.has(r.sourceKey));ids.add(r.product.id);keys.add(r.sourceKey);assert.equal(r.product.setId,r.set.id);
 for(const v of r.product.variants){validateImport({externalId:r.externalId+':'+v.language+':'+v.key,game:{key:r.game,name:{en:r.game,fr:r.game}},set:{key:r.set.slug,name:r.set.name,releasedOn:r.set.releasedOn},product:{key:r.externalId,name:r.product.name,type:r.product.type,aliases:r.product.aliases},printing:{key:v.language,language:v.language,number:v.number,rarity:v.rarity,artist:v.artist},variant:{key:v.key,attributes:v.attributes},image:null,images:[]});variants++;}}
const sources=new Set(records.map(r=>r.provider));const originals=sampleProducts.filter(p=>sources.has(p.images?.[0]?.provenance.provider));for(const p of originals){const r=records.find(r=>r.product.id===p.id);assert.ok(r);assert.deepEqual(r.product.variants.map((v:any)=>v.id),p.variants.map(v=>v.id));}
const evidence={revision:manifest.revision,products:records.length,validatedVariants:variants,preservedInitialProductAndVariantIds:originals.length,uniqueIdentities:true,hashVerified:true,metadataOnly:manifest.artworkReady===0,existingImportSchemaValid:true};
writeFileSync('docs/evidence/catalog-scale/tcgdex-release-validation.json',JSON.stringify(evidence,null,2));console.log(evidence);
