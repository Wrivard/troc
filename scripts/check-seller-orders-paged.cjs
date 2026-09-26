const {chromium,expect}=require('@playwright/test'),fs=require('fs');
(async()=>{const b=await chromium.launch({channel:'chrome'}),out=[];
try{for(const[lang,width]of[['en',1440],['fr',390]]){
const c=await b.newContext({viewport:{width,height:950},acceptDownloads:true});
await c.request.post('http://127.0.0.1:4313/api/dev/session',{headers:{Origin:'http://127.0.0.1:4313'},data:{role:'seller'}});
const p=await c.newPage();let template,summaryFail=true,listFail=true,listRequests=[],legacy=0,summaryRequests=0,releaseSlow;
await p.route('**/api/seller/platform/*/operations',r=>{legacy++;return r.continue()});
await p.route('**/api/seller/platform/*/order-list?*',async r=>{
const u=new URL(r.request().url()),q=u.searchParams.get('q')||'',cursor=Number(u.searchParams.get('cursor')||0);
listRequests.push(u.search);if(q==='slow')await new Promise(resolve=>releaseSlow=resolve);
if(!template){const response=await c.request.get(u.origin+u.pathname.replace('/order-list','/operations'));template=await response.json();}
if(q==='fail'&&listFail)return r.fulfill({status:503,json:{code:'unavailable'}});
const total=q==='empty'?0:209;
const orders=Array.from({length:Math.min(8,Math.max(0,total-cursor))},(_,i)=>({...template.orders[0],id:'00000000-0000-4000-8000-'+String(cursor+i).padStart(12,'0'),buyer:q+' Cursor buyer '+(cursor+i)}));
return r.fulfill({json:{sellerId:template.sellerId,canReply:template.canReply,orders,asOf:'2026-09-24T00:00:00.000Z',nextCursor:cursor+8<total?String(cursor+8):null}});
});
await p.route('**/api/seller/platform/*/order-summary?*',async r=>{
summaryRequests++;if(summaryFail)return r.fulfill({status:503,json:{code:'unavailable'}});
const q=new URL(r.request().url()).searchParams.get('q'),count=q==='empty'?0:209;
return r.fulfill({json:{sellerId:template.sellerId,asOf:'2026-09-24T00:00:00.000Z',priorities:{awaiting_shipment:209},tabs:{all:count,awaiting_shipment:count},matchedCount:count,matchedTotalCents:count*100,containsDemo:true}});
});
await p.goto('http://127.0.0.1:4313/seller/orders?lang='+lang);
await expect(p.locator('.ops-table tbody tr')).toHaveCount(8);
await expect(p.getByRole('button',{name:lang==='fr'?'Réessayer les totaux':'Retry totals',exact:true})).toBeVisible();
await expect(p.locator('.ops-result')).not.toContainText('209');
summaryFail=false;
await p.getByRole('button',{name:lang==='fr'?'Réessayer les totaux':'Retry totals',exact:true}).click();
await expect(p.locator('.ops-result')).toContainText('209');
const next=p.getByRole('button',{name:lang==='fr'?'Suivant':'Next',exact:true});
await next.click();await expect(p.locator('.ops-table tbody tr').first()).toContainText('Cursor buyer 8');
await p.getByRole('button',{name:lang==='fr'?'Précédent':'Previous',exact:true}).click();
await expect(p.locator('.ops-table tbody tr').first()).toContainText('Cursor buyer 0');
expect(summaryRequests).toBe(2);const download=p.waitForEvent('download');
await p.getByRole('button',{name:lang==='fr'?'Exporter cette page (8)':'Export this page (8)',exact:true}).click();
const file=await download;const stream=await file.createReadStream();let csv='';for await(const chunk of stream)csv+=chunk.toString();
expect(csv.trim().split('\r\n')).toHaveLength(9);
const search=p.locator('.ops-search input');await search.fill('fail');
await expect(p.getByRole('button',{name:lang==='fr'?'Réessayer les commandes':'Retry orders',exact:true})).toBeVisible();
await expect(p.locator('.ops-table tbody tr')).toHaveCount(0);
await expect(p.getByRole('button',{name:lang==='fr'?'Exporter cette page (0)':'Export this page (0)',exact:true})).toBeDisabled();
listFail=false;await p.getByRole('button',{name:lang==='fr'?'Réessayer les commandes':'Retry orders',exact:true}).click();
await expect(p.locator('.ops-table tbody tr')).toHaveCount(8);
await search.fill('empty');await expect(p.locator('.ops-empty')).toContainText(lang==='fr'?'Aucune commande correspondante':'No matching orders');
await search.fill('');await expect(p.locator('.ops-table tbody tr')).toHaveCount(8);
await search.fill('slow');await expect.poll(()=>typeof releaseSlow).toBe('function');await search.fill('fast');await expect(p.locator('.ops-table tbody tr').first()).toContainText('fast Cursor buyer');const late=p.waitForResponse(r=>r.url().includes('/order-list?')&&new URL(r.url()).searchParams.get('q')==='slow');releaseSlow();await late;await expect(p.locator('.ops-table tbody tr').first()).toContainText('fast Cursor buyer');await search.fill('');await expect(p.locator('.ops-table tbody tr')).toHaveCount(8);expect(legacy).toBe(0);expect(await p.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);
fs.mkdirSync('docs/evidence/seller-orders-paged',{recursive:true});await p.screenshot({path:'docs/evidence/seller-orders-paged/'+lang+'.jpg',type:'jpeg',quality:80});
out.push({lang,width,staleResponseIgnored:true,summaryIndependent:true,countsBeyond200:true,nextPrevious:true,pageExport:true,listRetry:true,emptyDistinct:true,noLegacyRead:true,requests:listRequests.length});await c.close();
}fs.writeFileSync('docs/evidence/seller-orders-paged/check.json',JSON.stringify(out,null,2));console.log(out);
}finally{await b.close()}})().catch(e=>{console.error(e.message);process.exitCode=1});


