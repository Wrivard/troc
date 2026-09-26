const {chromium,expect}=require('@playwright/test'),fs=require('fs');
(async()=>{const browser=await chromium.launch({channel:'chrome'}),checks=[];try{for(const [lang,width]of [['en',1440],['fr',390]]){
 const context=await browser.newContext({viewport:{width,height:950},acceptDownloads:true});const origin='http://127.0.0.1:4313';await context.request.post(origin+'/api/dev/session',{headers:{Origin:origin},data:{role:'seller'}});
 const page=await context.newPage();let legacy=0,summaryReads=0,failProducts=true,slowResolve;const scopes=[];
 await page.route('**/api/seller/platform/*/operations',r=>{legacy++;return r.continue()});
 await page.route('**/api/seller/platform/*/analytics-*',async r=>{
 const u=new URL(r.request().url()),q=u.searchParams,period=q.get('period'),dataset=q.get('dataset');scopes.push(q.get('asOf'));
 if(u.pathname.endsWith('analytics-breakdown'))return r.fulfill({json:{provinces:[{province:'QC',count:240}],provincesTruncated:false,datasets:{sample:true,live:true}}});
 if(u.pathname.endsWith('analytics-summary')){summaryReads++;if(period==='7')await new Promise(resolve=>slowResolve=resolve);return r.fulfill({json:{orderCount:Number(period)*10,totalCents:Number(period)*10000,previousTotalCents:10000,refundCents:100,refundOrderCount:1,units:600,series:[{day:'2026-09-24',totalCents:300000,orders:300,previousTotalCents:10000,previousOrders:10}]}})}
 if(failProducts)return r.fulfill({status:503,json:{code:'unavailable'}});
 const offset=Number(q.get('cursor')||0);return r.fulfill({json:{products:Array.from({length:offset?12:25},(_,i)=>({variantId:String(offset+i),name:{en:dataset+' Product '+(offset+i),fr:dataset+' Produit '+(offset+i)},quantity:2,cents:1000,imageUrl:null})),nextCursor:offset?null:'25'}});
 });
 await page.goto(origin+'/seller/analytics?lang='+lang);
 await expect(page.locator('.ops-metrics section').nth(1).locator('strong')).toHaveText('300');
 const panel=page.locator('.ops-top-products');await expect(panel.getByRole('button',{name:lang==='fr'?'Réessayer':'Retry',exact:true})).toBeVisible();failProducts=false;await panel.getByRole('button').click();await expect(panel.locator('tbody tr')).toHaveCount(25);
 const reads=summaryReads;await panel.getByRole('button',{name:lang==='fr'?'Suivant':'Next',exact:true}).click();await expect(panel.locator('tbody tr')).toHaveCount(12);await expect(panel.locator('tbody tr').first().locator('td').first()).toHaveText('26');expect(summaryReads).toBe(reads);
 await page.locator('.ops-analytics-toolbar').first().getByRole('combobox').first().click();await page.getByRole('option',{name:lang==='fr'?'7 derniers jours':'Last 7 days',exact:true}).click();await expect.poll(()=>typeof slowResolve).toBe('function');
 await page.locator('.ops-analytics-toolbar').first().getByRole('combobox').first().click();await page.getByRole('option',{name:lang==='fr'?'90 derniers jours':'Last 90 days',exact:true}).click();await expect(page.locator('.ops-metrics section').nth(1).locator('strong')).toHaveText('900');slowResolve();await expect(panel.locator('tbody tr').first().locator('td').first()).toHaveText('1');await expect(page.locator('.ops-metrics section').nth(1).locator('strong')).toHaveText('900');
 await page.locator('.ops-analytics-toolbar').first().getByRole('combobox').first().click();await page.getByRole('option',{name:lang==='fr'?'30 derniers jours':'Last 30 days',exact:true}).click();await expect(panel.locator('tbody tr').first().locator('td').first()).toHaveText('1');await expect(page.locator('.ops-metrics section').nth(1).locator('strong')).toHaveText('300');
 const download=page.waitForEvent('download');await page.getByRole('button',{name:lang==='fr'?'Exporter les totaux quotidiens':'Export daily totals',exact:true}).click();const file=await download;expect(fs.readFileSync(await file.path(),'utf8')).toContain('2026-09-24,3000.00,300,100.00,10');
 expect(legacy).toBe(0);expect(new Set(scopes).size).toBe(1);expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);
 fs.mkdirSync('docs/evidence/seller-analytics-ui',{recursive:true});await page.screenshot({path:'docs/evidence/seller-analytics-ui/'+lang+'.jpg',type:'jpeg',quality:65,fullPage:true});checks.push({lang,width,pagination:true,independentRetry:true,staleIgnored:true,csv:true,noLegacy:true,pinnedScope:true});await context.close();
 }fs.writeFileSync('docs/evidence/seller-analytics-ui/check.json',JSON.stringify(checks,null,2));console.log(checks);}finally{await browser.close()}})().catch(e=>{console.error(e);process.exitCode=1});

