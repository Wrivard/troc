import test from 'node:test';
import assert from 'node:assert/strict';
import {catalogBrowseHref} from '../lib/catalog/src/index';
import {publicPage} from '../artifacts/api-server/src/modules/catalog/service';
import {DemoCatalogRepository} from '../artifacts/api-server/src/modules/catalog/repository';
import {publicDemoCatalog} from '../artifacts/api-server/src/modules/catalog/public-demo';
test('legacy catalogue URLs preserve refinements and locale, override stale category and discard cursor',()=>{
 assert.equal(catalogBrowseHref('/games/pokemon',new URLSearchParams('lang=fr&set=old&max=99&cursor=old')), '/search?lang=fr&max=99&game=pokemon');
 assert.equal(catalogBrowseHref('/sets/pokemon-151-en-5af93beb',new URLSearchParams('lang=en&game=wrong&sort=price')), '/search?lang=en&sort=price&set=pokemon-151-en-5af93beb');
 assert.equal(catalogBrowseHref('/product/card',new URLSearchParams('variantId=abc')), '/product/card?variantId=abc');
});
test('canonical game/set search returns the same scope as legacy catalogues and combines refinements',async()=>{
 const data=publicDemoCatalog(),repo=new DemoCatalogRepository(data);
 for(const [kind,entities]of [['games',data.games],['sets',data.sets]] as const){for(const entity of entities.slice(0,3)){
 const params=new URLSearchParams('lang=fr&limit=48');const old=await publicPage('/'+kind+'/'+entity.slug,params,repo);
 const url=new URL(catalogBrowseHref('/'+kind+'/'+entity.slug,params),'http://local');const page=await publicPage(url.pathname,url.searchParams,repo);
 assert.equal(page.kind,'search');assert.deepEqual(page.results.map(r=>r.product.id),old.results.map(r=>r.product.id));
 assert.ok(page.results.every(r=>kind==='games'?r.product.gameId===entity.id:r.product.setId===entity.id));
 url.searchParams.set('max','99');const cheap=await publicPage('/search',url.searchParams,repo);assert.ok(cheap.results.every(r=>r.lowestCents!==null&&r.lowestCents<=99));
 }}
});
import {createRequire} from 'node:module';
const express = createRequire(new URL('../artifacts/api-server/package.json', import.meta.url))('express');
import {once} from 'node:events';
import publicRouter from '../artifacts/api-server/src/routes/public-site';
import {presentationGroups} from '../artifacts/marketplace/src/modules/global-search/suggestions-client';
test('production legacy HTML routes redirect before rendering; game/set suggestions link directly to Search',async()=>{
 const app=express();app.use(publicRouter);const server=app.listen(0,'127.0.0.1');await once(server,'listening');
 try{const addr=server.address();assert.ok(addr&&typeof addr!=='string');for(const path of ['/games/pokemon','/sets/pokemon-151-en-5af93beb']){const r=await fetch(`http://127.0.0.1:${addr.port}${path}?lang=fr&max=99`,{redirect:'manual'});assert.equal(r.status,308);assert.ok(r.headers.get('location')?.startsWith('/search?'));assert.ok(r.headers.get('location')?.includes('lang=fr'));}}
 finally{server.closeAllConnections();await new Promise<void>((resolve)=>server.close(()=>resolve()));}
 const groups=presentationGroups({query:'poke',locale:'fr',groups:[{kind:'games',results:[{id:'1',slug:'pokemon',name:{en:'Pokemon',fr:'Pokemon'},demo:true}]},{kind:'sets',results:[{id:'2',slug:'pokemon-151',name:{en:'151',fr:'151'},demo:true}]}]},'');
 assert.equal(groups[0].results[0].href,'/search?lang=fr&game=pokemon');assert.equal(groups[1].results[0].href,'/search?lang=fr&set=pokemon-151');
});
