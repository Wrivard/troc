import assert from 'node:assert/strict';
import {readFileSync,writeFileSync} from 'node:fs';
const before=JSON.parse(readFileSync('catalog-data/current.json','utf8'));let networkCalls=0;
const originalFetch=globalThis.fetch;
globalThis.fetch=(async()=>{networkCalls++;throw Error('network_used_during_replay');}) as typeof fetch;
try{await import('./catalog/acquire-artwork');}finally{globalThis.fetch=originalFetch;}
const after=JSON.parse(readFileSync('catalog-data/current.json','utf8'));assert.equal(networkCalls,0);assert.equal(after.revision,before.revision);assert.equal(after.artworkReady,before.artworkReady);
const evidence={revision:after.revision,networkCalls,sameSnapshot:true,illustrated:after.artworkReady};writeFileSync('docs/evidence/catalog-scale/artwork-replay.json',JSON.stringify(evidence,null,2));console.log(evidence);
