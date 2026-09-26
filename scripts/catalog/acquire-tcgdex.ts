import { readFileSync,writeFileSync } from 'node:fs';
import { dirname,basename } from 'node:path';
import { literalFields } from './literal-fields';
import { db,put,stableId,hash,gameIds,publish } from './store';
const source=JSON.parse(readFileSync('catalog-data/raw/tcgdex-source.json','utf8')) as Record<string,string>;
const {revision}=JSON.parse(readFileSync('catalog-data/tcgdex-revision.json','utf8'));
const existing=new Set(db.prepare("SELECT source_key FROM records WHERE provider='tcgdex'").all().map(r=>String(r.source_key)));
const before=[...existing];const capturedAt=new Date().toISOString();let added=0,skipped=0;
const initialCount=Number(db.prepare("SELECT count(*) AS n FROM records WHERE provider='tcgdex' AND source_url NOT LIKE '%TCG%20Pocket/%'").get()!.n);const count=()=>initialCount+added;
const slug=(s:string)=>s.normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase().replace(/[^a-z0-9]+/g,'-').replace(/^-|-$/g,'').slice(0,70);
const parsedSets=new Map<string,any>();
db.exec('BEGIN');
for(const [path,text] of Object.entries(source).sort(([a],[b])=>a.localeCompare(b))){
 if(count()>=12000)break;
 if(path.includes('/Pokémon TCG Pocket/'))continue;
 if(!path.startsWith('data/')||path.split('/').length!==4||!path.endsWith('.ts'))continue;
 const setPath=dirname(path).replaceAll('\\','/')+'.ts';if(!source[setPath])continue;
 let set=parsedSets.get(setPath);if(!set){set=literalFields(source[setPath]);parsedSets.set(setPath,set);}
 const card=literalFields(text) as any;
 if(!set.id||!set.name?.en||!card.name?.en){skipped++;continue;}
 const number=String(card.localId??basename(path,'.ts'));const externalId=set.id+'-'+number,key='tcgdex:'+externalId+':en';if(existing.has(key))continue;
 // Never use provider IDs as a database primary key; preserve them in source mappings.
 const productId=stableId(key+':product'),setId=stableId('tcgdex:set:'+set.id+':en');
 const product={id:productId,slug:'pokemon-'+slug(card.name.en)+'-'+productId.slice(0,8),name:{en:card.name.en,fr:card.name.fr??card.name.en},gameId:gameIds.pokemon,setId,type:'raw_single',variants:[{id:stableId(key+':variant:unspecified'),printingId:stableId(key+':printing'),language:'en',key:'unspecified',attributes:{finishResolution:'not-yet-resolved'},number,rarity:typeof card.rarity==='string'?card.rarity:'',artist:typeof card.illustrator==='string'?card.illustrator:'',images:[]}],aliases:[card.name.en,set.name.en,number],imageUrl:null,images:[],demo:false};
 put({sourceKey:key,provider:'tcgdex',externalId,game:'pokemon',product,set:{id:setId,gameId:gameIds.pokemon,slug:'pokemon-'+slug(set.name.en)+'-en-'+setId.slice(0,8),name:{en:set.name.en,fr:set.name.fr??set.name.en},releasedOn:set.releaseDate??null},sourceUrl:'https://github.com/tcgdex/cards-database/blob/'+revision+'/'+path.split('/').map(encodeURIComponent).join('/'),rawHash:hash(text),capturedAt,artwork:[],identityOrigin:'canonical-v1',sourceRevision:revision,metadataLicense:'MIT',attribution:'Copyright (c) 2021 TCGdex'});
 existing.add(key);added++;if(added%500===0)console.log({added,total:count()});
}
db.exec('COMMIT');
const magicReady=!!db.prepare("SELECT name FROM batches WHERE name='magic-8000-v1'").get();
const manifest=publish({providers:magicReady?['tcgdex','scryfall']:['tcgdex'],includeImages:false});
const result={...manifest,added,skipped,existingSourceIdentitiesPreserved:before.every(key=>!!db.prepare('SELECT product_id FROM records WHERE source_key=?').get(key)),sourceRevision:revision,unknownFinishesNotInvented:true};
writeFileSync('docs/evidence/catalog-scale/tcgdex-metadata-import.json',JSON.stringify(result,null,2));console.log(result);db.close();
