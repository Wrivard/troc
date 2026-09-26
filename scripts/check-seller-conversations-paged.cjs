const{chromium,expect}=require('@playwright/test'),fs=require('fs');
(async()=>{const b=await chromium.launch({channel:'chrome'}),out=[];try{for(const[lang,width]of[['en',1440],['fr',390]]){
 const c=await b.newContext({viewport:{width,height:950}});const origin='http://127.0.0.1:4313';await c.request.post(origin+'/api/dev/session',{headers:{Origin:origin},data:{role:'seller'}});
 const p=await c.newPage();let template,legacy=0,listFail=true,detailFail=true,releaseSlow,requests=0,posts=[];
 const id=n=>'00000000-0000-4000-8000-'+String(n).padStart(12,'0');
 const off=id(999);
 await p.route('**/api/seller/platform/*/operations',r=>{legacy++;return r.continue()});
 await p.route('**/api/seller/platform/*/conversations**',async r=>{
  requests++;const u=new URL(r.request().url()),selected=u.pathname.split('/conversations/')[1];
  if(!template){template=await(await c.request.get(u.origin+u.pathname.split('/conversations')[0]+'/operations')).json();}
  if(selected){if(selected===off&&detailFail)return r.fulfill({status:503,json:{code:'unavailable'}});return r.fulfill({json:{sellerId:template.sellerId,canReply:true,order:{...template.orders[0],id:selected,buyer:'Selected '+selected.slice(-3)}}});}
  const q=u.searchParams.get('q')||'',offset=Number(u.searchParams.get('cursor')||0);
  if(q==='slow')await new Promise(resolve=>releaseSlow=resolve);
  if(q==='fail'&&listFail)return r.fulfill({status:503,json:{code:'unavailable'}});
  const count=q==='empty'?0:209;
  const conversations=Array.from({length:Math.min(20,Math.max(0,count-offset))},(_,i)=>({...template.orders[0],id:id(offset+i),buyer:q+' Buyer '+(offset+i),hasMessages:true}));
  return r.fulfill({json:{sellerId:template.sellerId,canReply:true,conversations,nextCursor:offset+20<count?String(offset+20):null}});
 });
 await p.route('**/api/commerce/seller/orders/**',r=>r.fulfill({json:r.request().url().endsWith('/messages')?{messages:[],nextBefore:null,unreadCount:0}:{messages:[]}}));
 await p.route('**/api/commerce/seller-orders/*/actions',r=>{posts.push(r.request().postDataJSON());return r.fulfill({status:503,json:{code:'unavailable'}})});
 await p.goto(origin+'/seller/messages?lang='+lang+'&order='+off);
 const retry=p.getByRole('button',{name:lang==='fr'?'Réessayer la conversation choisie':'Retry selected conversation',exact:true});await expect(retry).toBeVisible();
 await expect(p.locator('.ops-conversations>button')).toHaveCount(20);detailFail=false;await retry.click();
 await expect(p.locator('.ops-conversation h2')).toHaveText('Selected 999');const draft=p.locator('#seller-reply');await draft.fill('Keep this draft');
 if(width<760)await p.getByRole('button',{name:'Retour',exact:true}).click();
 const next=p.locator('.ops-inbox-pager').getByRole('button',{name:lang==='fr'?'Suivant':'Next',exact:true});await next.click();await expect(p.locator('.ops-conversations>button').first()).toContainText('Buyer 20');
 await p.locator('.ops-inbox-pager').getByRole('button',{name:lang==='fr'?'Précédent':'Previous',exact:true}).click();await expect(p.locator('.ops-conversations>button').first()).toContainText('Buyer 0');
 await expect(draft).toHaveValue('Keep this draft');
 const search=p.getByRole('textbox',{name:lang==='fr'?'Rechercher des conversations':'Search conversations',exact:true});await search.fill('fail');await expect(p.getByRole('button',{name:lang==='fr'?'Réessayer les conversations':'Retry conversations',exact:true})).toBeVisible();await expect(draft).toHaveValue('Keep this draft');listFail=false;await p.getByRole('button',{name:lang==='fr'?'Réessayer les conversations':'Retry conversations',exact:true}).click();await expect(p.locator('.ops-conversations>button')).toHaveCount(20);
 await search.fill('empty');await expect(p.locator('.ops-conversations')).toContainText(lang==='fr'?'Aucune conversation ne correspond.':'No conversations match your search.');
 await search.fill('slow');await expect.poll(()=>typeof releaseSlow).toBe('function');await search.fill('fast');await expect(p.locator('.ops-conversations>button').first()).toContainText('fast Buyer');const late=p.waitForResponse(r=>r.url().includes('/conversations?')&&new URL(r.url()).searchParams.get('q')==='slow');releaseSlow();await late;await expect(p.locator('.ops-conversations>button').first()).toContainText('fast Buyer');
 await search.fill('');await expect(p.locator('.ops-conversations>button')).toHaveCount(20);
 await p.locator('.ops-conversations>button').first().click();await expect(p.locator('.ops-conversation h2')).toHaveText('Selected 000');await draft.fill('Second draft');
 await p.locator('.ops-composer button[type=submit]').click();await expect(p.locator('.ops-message-error')).toBeVisible();await p.locator('.ops-composer button[type=submit]').click();await expect.poll(()=>posts.length).toBe(2);expect(posts[0].idempotencyKey).toBe(posts[1].idempotencyKey);await expect(draft).toHaveValue('Second draft');
 expect(legacy).toBe(0);expect(await p.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);
 fs.mkdirSync('docs/evidence/seller-conversations-paged',{recursive:true});await p.screenshot({path:'docs/evidence/seller-conversations-paged/'+lang+'.jpg',type:'jpeg',quality:75});out.push({lang,width,offPage:true,independentErrors:true,paging:true,staleIgnored:true,draftPreserved:true,retryKey:true,noLegacy:true,requests});await c.close();
}fs.writeFileSync('docs/evidence/seller-conversations-paged/check.json',JSON.stringify(out,null,2));console.log(out)}finally{await b.close()}})().catch(e=>{console.error(e);process.exitCode=1});
