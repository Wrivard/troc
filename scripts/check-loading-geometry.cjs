const {chromium,expect}=require('@playwright/test');const fs=require('fs');
(async()=>{const b=await chromium.launch({channel:'chrome'});const evidence=[];try{
 const data=await (await fetch('http://127.0.0.1:5313/api/catalog/page?path=/search&lang=en&limit=12')).json();
 for(const width of [1440,900,390])for(const view of ['large','compact','list'])for(const kind of ['search','product']){
  if(kind==='product'&&view!=='large')continue;
  const c=await b.newContext({viewport:{width,height:950}});await c.addInitScript(v=>localStorage.setItem('troc.catalog.view',v),view);const p=await c.newPage();let release;const gate=new Promise(r=>release=r);
  await p.route('**/api/catalog/page?**',async route=>{await gate;await route.continue()});
  await p.goto('http://127.0.0.1:4313/'+(kind==='search'?'search':'product/'+data.results[0].product.slug)+'?lang=en&limit=12');
  const selector=kind==='search'?'.troc-browse-loading .troc-market-card':'.troc-product-loading .troc-product-sticky';
  await p.locator(selector).first().waitFor();const before=await p.locator(selector).first().boundingBox();await p.screenshot({path:`docs/evidence/performance/loading-${kind}-${width}-${view}.png`});
  release();await expect(p.locator('[aria-busy]').first()).toHaveAttribute('aria-busy','false');
  const after=await p.locator(kind==='search'?'.troc-market-card':'.troc-product-sticky').first().boundingBox();
  await p.screenshot({path:`docs/evidence/performance/loaded-${kind}-${width}-${view}.png`});
  for(const key of ['x','y','width'])expect(Math.abs(after[key]-before[key])).toBeLessThan(1);
  expect(Math.abs(after.height-before.height)).toBeLessThanOrEqual(1.1);
  evidence.push({kind,width,view,before,after,deltaX:after.x-before.x,deltaY:after.y-before.y,deltaWidth:after.width-before.width});
  await c.close();
 }
 fs.writeFileSync('docs/evidence/performance/loading-geometry.json',JSON.stringify(evidence,null,2));console.log(evidence);
}finally{await b.close()}})().catch(e=>{console.error(e);process.exitCode=1});
