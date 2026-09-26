import {physicalCatalogueRecord} from "../scripts/catalog/catalog-scope";
import {test} from 'node:test';
import assert from 'node:assert/strict';
import {literalFields} from '../scripts/catalog/literal-fields';
import {assertSources,type SourcePolicy} from '../scripts/catalog/source-policy';
const policy:SourcePolicy={sources:{tcgdex:{metadata:{local:true,production:false,evidence:['MIT']},artwork:{local:false,production:false}}}};
test('metadata permission never grants production or artwork permission',()=>{
 const records=[{provider:'tcgdex',product:{images:[{url:'art'}]}}];
 assert.doesNotThrow(()=>assertSources(records,policy,'local',false));
 assert.throws(()=>assertSources(records,policy,'local',true),/artwork_source_unapproved/);
 assert.throws(()=>assertSources(records,policy,'production',false),/metadata_source_unapproved/);
});
test('unknown sources and evidence-free approvals fail closed',()=>{
 assert.throws(()=>assertSources([{provider:'unknown',product:{}}],policy,'local',false),/metadata_source_unapproved/);
 const missing=structuredClone(policy);missing.sources.tcgdex.metadata.evidence=[];
 assert.throws(()=>assertSources([{provider:'tcgdex',product:{}}],missing,'local',false),/metadata_source_unapproved/);
});
test('provider TypeScript is parsed as literal data; expressions are not executed',()=>{
 const data=literalFields(`import x from 'never-execute'; const card={ name:{en:'Pikachu',fr:'Pikachu'}, localId:'025', get injected(){throw Error('executed')}, effect:(()=>{throw Error('executed')})(), ...globalThis, __proto__:{polluted:true}, variants:{normal:true}, category:Unknown.Value };export default card;`);
 assert.deepEqual(data,{name:{en:'Pikachu',fr:'Pikachu'},localId:'025',variants:{normal:true}});
 assert.equal(Object.getPrototypeOf(data),Object.prototype);
});

test('artwork approval requires its own evidence, independently of metadata',()=>{
 const local=structuredClone(policy);local.sources.tcgdex.artwork.local=true;
 const records=[{provider:'tcgdex',product:{images:[{}]}}];
 assert.throws(()=>assertSources(records,local,'local',true),/artwork_source_unapproved/);
 local.sources.tcgdex.artwork.evidence=['local image-use guidance'];
 assert.doesNotThrow(()=>assertSources(records,local,'local',true));
 assert.throws(()=>assertSources(records,local,'production',true),/metadata_source_unapproved/);
});

test('digital-only Pocket records never enter the physical catalogue',()=>{
 assert.equal(physicalCatalogueRecord({provider:'tcgdex',sourceUrl:'https://github.com/data/Pok%C3%A9mon%20TCG%20Pocket/Set/1.ts'}),false);
 assert.equal(physicalCatalogueRecord({provider:'tcgdex',sourceUrl:'https://github.com/data/Base/Base%20Set/1.ts'}),true);
});
