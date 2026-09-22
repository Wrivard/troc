import { randomUUID,createHash } from 'node:crypto';
import { mkdir,readFile,writeFile } from 'node:fs/promises';
import sharp from 'sharp';
import { cached,TcgdexDemoProvider,ScryfallDemoProvider,YgoprodeckDemoProvider } from './providers.mjs';
const root=new URL('../../',import.meta.url);
const output=new URL('artifacts/marketplace/public/catalog-art/',root);
const dataDir=new URL('artifacts/api-server/src/modules/catalog/sample/',root);
await mkdir(output,{recursive:true});await mkdir(dataDir,{recursive:true});
const registryFile=new URL('identities.json',dataDir);
let identities={};try{identities=JSON.parse(await readFile(registryFile,'utf8'));}catch(e){if(e.code!=='ENOENT')throw e;}
const id=key=>identities[key]??(identities[key]=randomUUID());
const capturedAt=new Date().toISOString();
const products=[],sets=[],assets=[],mappings=[],records=[];
const slug=value=>value.normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase().replace(/[^a-z0-9]+/g,'-').replace(/^-|-$/g,'').slice(0,70)||'card';
class LocalDemoAssetProvider {
  async store(sourceUrl,width){
    const original=await cached(sourceUrl);
    const image=sharp(original).resize({width,withoutEnlargement:true,fit:'inside'});
    const {data,info}=await image.webp({quality:88}).toBuffer({resolveWithObject:true});
    const digest=createHash('sha256').update(data).digest('hex').slice(0,20);
    const url=`/catalog-art/${digest}-${info.width}.webp`;
    await writeFile(new URL(url.slice('/catalog-art/'.length),output),data);
    assets.push({url,sourceUrl,width:info.width,height:info.height,bytes:data.length,capturedAt});
    return {url,width:info.width,height:info.height};
  }
}
const storage=new LocalDemoAssetProvider();
for(const provider of [new TcgdexDemoProvider(),new ScryfallDemoProvider(),new YgoprodeckDemoProvider()]) {
  const sample=await provider.records();
  if(sample.length<40||sample.length>75)throw new Error(`sample_bounds:${provider.id}:${sample.length}`);
  console.log(provider.id+': '+sample.length+' selected products');
  const gameId=`00000000-0000-4000-8001-${String(['pokemon','magic','yu-gi-oh'].indexOf(provider.game)).padStart(12,'0')}`;
  for(const card of sample) {
    const key=provider.id+':'+card.externalId+':'+card.language;
    const productId=id(key+':product'),setKey=provider.id+':set:'+card.setId+':'+card.language,setId=id(setKey);
    if(!sets.some(s=>s.id===setId))sets.push({id:setId,gameId,slug:provider.game+'-'+slug(card.setName)+'-'+card.language+'-'+setId.slice(0,8),name:{en:card.setName,fr:card.setName},releasedOn:card.releasedOn});
    const images=[];
    for(const [position,image] of card.images.entries()) {
      const high=await storage.store(image.high,600),low=await storage.store(image.low??image.high,245);
      images.push({id:id(key+':image:'+position),side:image.side,url:high.url,sources:[{url:low.url,width:low.width},{url:high.url,width:high.width}],width:high.width,height:high.height,provenance:{provider:provider.id,externalId:card.externalId,sourceUrl:image.high,license:'User-approved bounded demo/development sample only; publisher rights retained',capturedAt}});
    }
    const variantKeys=card.variants.length?card.variants:['standard'];
    const variants=variantKeys.map(keyName=>({id:id(key+':variant:'+keyName),printingId:id(key+':printing'),language:card.language,key:keyName,attributes:{finish:keyName,...(card.artworkScope?{artworkScope:card.artworkScope}:{})},number:card.number,rarity:card.rarity,artist:card.artist,images}));
    products.push({id:productId,slug:provider.game+'-'+slug(card.name)+'-'+productId.slice(0,8),name:{en:card.name,fr:card.name},gameId,setId,type:'raw_single',variants,aliases:[card.name,card.setName,card.number],imageUrl:null,images,demo:true});
    for(const variant of variants) {
      mappings.push({provider:provider.id,externalId:card.externalId,language:card.language,variant:variant.key,productId,printingId:variant.printingId,variantId:variant.id});
      records.push({provider:provider.id,externalId:card.externalId,language:card.language,sourceUrl:card.sourceUrl,productId,setId,printingId:variant.printingId,variantId:variant.id,capturedAt,demo:true});
    }
    // Persist identities during acquisition so retries never regenerate canonical IDs.
    await writeFile(registryFile,JSON.stringify(identities,null,2));
  }
}
await writeFile(new URL('data.ts',dataDir),'// Generated bounded demo catalog; never a production import.\nimport type { Product, SetRelease } from "@workspace/catalog";\nexport const sampleProducts: Product[] = '+JSON.stringify(products,null,2)+';\nexport const sampleSets: SetRelease[] = '+JSON.stringify(sets,null,2)+';\n');
await writeFile(new URL('provenance.json',dataDir),JSON.stringify({batchId:id('batch:approved-demo-2026-09-22'),scope:'bounded-demo-only',capturedAt,approval:'User attachment 106718b8-c4a0-4d99-bff8-4df3c8a3c394',records,mappings,assets},null,2));
await writeFile(registryFile,JSON.stringify(identities,null,2));
console.log(JSON.stringify({products:products.length,sets:sets.length,renditions:assets.length,bytes:assets.reduce((n,a)=>n+a.bytes,0)}));
