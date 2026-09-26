import assert from 'node:assert/strict';
import {writeFile} from 'node:fs/promises';
import {publicDemoCatalog} from '../artifacts/api-server/src/modules/catalog/public-demo';
import {searchSnapshot,filtersFrom} from '../artifacts/api-server/src/modules/catalog/search';
import {searchSnapshot as baseline} from './performance/reference-search';
const data=publicDemoCatalog();
const results=[];
for(const query of ['', 'q=dragon','sort=price','game=magic','condition=LP&min=100&max=9000','language=ja','rarity=rare&variant=foil','seller=cartes-du-nord','set='+data.sets[0].slug,'q=zzzznomatch']){
 const f=filtersFrom(new URLSearchParams(query));
 const a=performance.now(),expected=baseline(data,f),oldMs=performance.now()-a;
 const b=performance.now(),actual=searchSnapshot(data,f),newMs=performance.now()-b;
 assert.deepEqual(actual,expected);
 if(actual.nextCursor) assert.deepEqual(searchSnapshot(data,{...f,cursor:actual.nextCursor}),baseline(data,{...f,cursor:actual.nextCursor}));
 results.push({query,oldMs:Math.round(oldMs),newMs:Math.round(newMs),sameResults:true});
}
// Request-local indexes must see stock changes immediately.
const first=data.offers[0];first.quantity=0;assert.deepEqual(searchSnapshot(data,filtersFrom(new URLSearchParams())),baseline(data,filtersFrom(new URLSearchParams())));
const output={products:data.products.length,offers:data.offers.length,results,stockMutationVisible:true};
await writeFile('docs/evidence/performance/real-catalog-search-parity.json',JSON.stringify(output,null,2));console.log(output);
