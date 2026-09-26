import { readFileSync,writeFileSync } from 'node:fs';
import { db,stableId,publish } from './store';
import { sampleSets } from '../../artifacts/api-server/src/modules/catalog/sample/data';
const identities=JSON.parse(readFileSync('artifacts/api-server/src/modules/catalog/sample/identities.json','utf8'));
const aliases=new Map<string,any>();
for(const [key,id] of Object.entries(identities)){if(key.includes(':set:')&&key.endsWith(':en')){const existing=sampleSets.find(s=>s.id===id);if(existing)aliases.set(stableId(key),existing);}}
let corrected=0;db.exec('BEGIN');try{for(const row of db.prepare('SELECT source_key,payload FROM records').all()){const r=JSON.parse(String(row.payload));const canonical=aliases.get(r.set.id);if(canonical){r.set=canonical;r.product.setId=canonical.id;db.prepare('UPDATE records SET payload=? WHERE source_key=?').run(JSON.stringify(r),String(row.source_key));corrected++;}}db.exec('COMMIT');}catch(e){db.exec('ROLLBACK');throw e;}
const manifest=publish({providers:['tcgdex','scryfall'],includeImages:false});writeFileSync('docs/evidence/catalog-scale/retained-catalogue.json',JSON.stringify({...manifest,legacySetReferencesReused:corrected},null,2));db.close();
