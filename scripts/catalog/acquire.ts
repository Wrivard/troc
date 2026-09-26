import { sampleProducts,sampleSets } from '../../artifacts/api-server/src/modules/catalog/sample/data';
import { readFileSync } from 'node:fs';
import { db,json,put,count,stableId,gameIds,hash,publish } from './store';
const policy=JSON.parse(readFileSync('catalog-data/source-policy.json','utf8'));
const selected=process.argv.find(a=>a.startsWith('--game='))?.slice(7);
if(selected!=='magic')throw Error('Use the reviewed game-specific acquisition path; unresolved sources remain staged.');
if(!policy.sources.scryfall.metadata?.local||!policy.sources.scryfall.metadata.evidence?.length)throw Error('metadata_source_unapproved:scryfall');
const targets:Record<string,number>={pokemon:5000,magic:8000,'yu-gi-oh':5000,'one-piece':2000};
const capturedAt=new Date().toISOString();
const initialIds=JSON.parse(readFileSync('artifacts/api-server/src/modules/catalog/sample/identities.json','utf8')); 
const slug=(s:string)=>s.normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase().replace(/[^a-z0-9]+/g,'-').replace(/^-|-$/g,'').slice(0,70)||'card';
const sampleProvenance=JSON.parse(readFileSync('artifacts/api-server/src/modules/catalog/sample/provenance.json','utf8'));
if(!db.prepare("SELECT name FROM batches WHERE name='initial-identities-v1'").get()){
 db.exec('BEGIN');try{for(const product of sampleProducts){const image=product.images![0],provider=image.provenance.provider,externalId=image.provenance.externalId,language=product.variants[0].language;const game=Object.entries(gameIds).find(([,id])=>id===product.gameId)![0];const original=sampleProvenance.records.find((r:any)=>r.productId===product.id);put({sourceKey:provider+':'+externalId+':'+language,provider,externalId,game,product,set:sampleSets.find(s=>s.id===product.setId),sourceUrl:original.sourceUrl,rawHash:hash(JSON.stringify(product)),capturedAt:image.provenance.capturedAt,artwork:[],identityOrigin:'preserved-initial-catalogue'});}db.prepare('INSERT INTO batches VALUES(?,?)').run('initial-identities-v1',JSON.stringify({count:sampleProducts.length,capturedAt}));db.exec('COMMIT');}catch(e){db.exec('ROLLBACK');throw e;}
}
function add(provider:string,game:string,card:any,source:any){
 const sourceKey=provider+':'+card.externalId+':en';if(db.prepare('SELECT source_key FROM records WHERE source_key=?').get(sourceKey))return;
 if(count(game)>=targets[game])return;
 const productId=stableId(sourceKey+':product'),setId=initialIds[provider+':set:'+card.setId+':en']??stableId(provider+':set:'+card.setId+':en');
 const set={id:setId,gameId:gameIds[game],slug:game+'-'+slug(card.setName)+'-en-'+setId.slice(0,8),name:{en:card.setName,fr:card.setName},releasedOn:card.releasedOn??null};
 const variants=card.variants.map((v:any)=>({id:stableId(sourceKey+':variant:'+v.key),printingId:stableId(sourceKey+':printing'),language:'en',key:v.key,attributes:v.attributes??{},number:card.number,rarity:card.rarity??'',artist:card.artist??'',images:[]}));
 const product={id:productId,slug:game+'-'+slug(card.name)+'-'+productId.slice(0,8),name:{en:card.name,fr:card.name},gameId:gameIds[game],setId,type:'raw_single',variants,aliases:[card.name,card.setName,card.number],imageUrl:null,images:[],demo:false};
 put({sourceKey,provider,externalId:card.externalId,game,product,set,sourceUrl:card.sourceUrl??source.url,rawHash:source.digest,capturedAt,artwork:card.artwork,identityOrigin:'canonical-v1'});
}
// Pinned bulk revision; refreshes are explicit new batches, never silent upstream replacements.
const pokemonRevision='39a26a144c8b6ef6c2fb17b2c29d0bb7121e3a11';
if(selected==='pokemon' && count('pokemon')<targets.pokemon){
 const sets=await json(`https://raw.githubusercontent.com/PokemonTCG/pokemon-tcg-data/${pokemonRevision}/sets/en.json`);
 for(const set of sets.data){if(count('pokemon')>=targets.pokemon)break;
  // Existing TCGdex samples are SV3 /151. This bounded historical slice is disjoint.
  if(set.releaseDate>='2015/01/01')continue;
  const source=await json(`https://raw.githubusercontent.com/PokemonTCG/pokemon-tcg-data/${pokemonRevision}/cards/en/${set.id}.json`);
  db.exec('BEGIN');try{for(const c of source.data){if(!c.images?.large)continue;add('pokemontcg-data','pokemon',{externalId:c.id,name:c.name,setId:set.id,setName:set.name,number:c.number,rarity:c.rarity,artist:c.artist,releasedOn:set.releaseDate.replaceAll('/','-'),variants:[{key:'unspecified',attributes:{finishResolution:'not-provided-by-source'}}],artwork:[{side:'front',url:c.images.large}]},source);}db.exec('COMMIT');}catch(e){db.exec('ROLLBACK');throw e;}
  console.log('pokemon '+count('pokemon'));
 }
}
if(selected==='one-piece' && count('one-piece')<targets['one-piece']){
 const source=await json('https://optcgapi.com/api/allSetCards/');
 db.exec('BEGIN');try{for(const c of source.data){if(!c.card_image_id||!c.card_image||!c.set_id)continue;add('optcgapi','one-piece',{externalId:c.set_id+':'+c.card_image_id,name:c.card_name,setId:c.set_id,setName:c.set_name,number:c.card_set_id,rarity:c.rarity,variants:[{key:c.card_image_id,attributes:{artworkIdentity:c.card_image_id}}],artwork:[{side:'front',url:c.card_image}]},source);}db.exec('COMMIT');}catch(e){db.exec('ROLLBACK');throw e;}
 console.log('one-piece '+count('one-piece'));
}
if(selected==='yu-gi-oh' && count('yu-gi-oh')<targets['yu-gi-oh']){
 const source=await json('https://db.ygoprodeck.com/api/v7/cardinfo.php');
 const originals=new Set(sampleProducts.filter(p=>p.gameId===gameIds['yu-gi-oh']).map(p=>p.images![0].provenance.externalId+':'+p.variants[0].number+':'+p.variants[0].rarity));
 db.exec('BEGIN');try{for(const c of source.data.data){const set=c.card_sets?.find((s:any)=>s.set_code.includes('EN'));if(!set||!c.card_images?.length)continue;
  if(originals.has(c.id+':'+set.set_code+':'+set.set_rarity))continue;
  add('ygoprodeck','yu-gi-oh',{externalId:c.id+':'+set.set_code+':'+set.set_rarity,name:c.name,setId:set.set_name,setName:set.set_name,number:set.set_code,rarity:set.set_rarity,sourceUrl:c.ygoprodeck_url,variants:[{key:'standard',attributes:{artworkScope:'card-reference',sourceCardId:String(c.id)}}],artwork:[{side:'front',url:c.card_images[0].image_url}]},source);
 }db.exec('COMMIT');}catch(e){db.exec('ROLLBACK');throw e;}
 console.log('yu-gi-oh '+count('yu-gi-oh'));
}
if(selected==='magic' && count('magic')<targets.magic){
 let next:string|null='https://api.scryfall.com/cards/search?unique=prints&order=set&q='+encodeURIComponent('game:paper lang:en -is:digital');let pages=0;
 while(next&&count('magic')<targets.magic&&pages<70){const source=await json(next);db.exec('BEGIN');try{for(const c of source.data.data){const faces=c.image_uris?[{image_uris:c.image_uris}]:c.card_faces?.filter((f:any)=>f.image_uris);if(c.lang!=='en'||!c.games.includes('paper')||!faces?.length)continue;add('scryfall','magic',{externalId:c.id,name:c.name,setId:c.set,setName:c.set_name,number:c.collector_number,rarity:c.rarity,artist:c.artist,releasedOn:c.released_at,sourceUrl:c.uri,variants:c.finishes.map((key:string)=>({key,attributes:{finish:key}})),artwork:faces.map((f:any,i:number)=>({side:i?'back':'front',url:f.image_uris.normal}))},source);}db.exec('COMMIT');}catch(e){db.exec('ROLLBACK');throw e;}next=source.data.has_more?source.data.next_page:null;pages++;console.log('magic '+count('magic'));}
}
for(const [game,target] of Object.entries(targets))if(game===selected&&count(game)!==target)throw Error('incomplete_provider:'+game+':'+count(game));
db.prepare('INSERT OR REPLACE INTO batches VALUES(?,?)').run('magic-8000-v1',JSON.stringify({targets,capturedAt,pokemonRevision}));publish({providers:['tcgdex','scryfall'],includeImages:false});db.close();
