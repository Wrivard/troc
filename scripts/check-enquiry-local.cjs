const {chromium,expect}=require('@playwright/test');const {randomUUID}=require('crypto');const fs=require('fs');
(async()=>{const b=await chromium.launch({channel:'chrome'}),buyer=await b.newContext(),seller=await b.newContext({viewport:{width:390,height:844}});
const base='http://127.0.0.1:4313',origin={Origin:base},store='00000000-0000-4000-8000-000000000010';
for(const [c,role] of [[buyer,'buyer'],[seller,'seller']]){const r=await c.request.post(base+'/api/dev/session',{headers:origin,data:{role}});expect(r.ok()).toBeTruthy();}
const route=base+'/api/seller/platform/'+store+'/enquiries';
const created=await buyer.request.post(route,{headers:origin,data:{key:'00000000-0000-4000-8000-000000008888',subject:'Local QA: card condition',body:'Fictional test enquiry: is this card near mint?'}});expect(created.ok()).toBeTruthy();const {id}=await created.json();
let list=await (await seller.request.get(route)).json();expect(list.find(r=>r.id===id).unread_count).toBe(1);
const read=await seller.request.post(route+'/'+id+'/read',{headers:origin,data:{}});expect(read.ok()).toBeTruthy();
list=await(await seller.request.get(route)).json();expect(list.find(r=>r.id===id).unread_count).toBe(0);
const p=await seller.newPage();await p.goto(base+'/seller/messages?lang=fr');await p.getByRole('button',{name:'Questions avant achat',exact:true}).click();await p.getByRole('button').filter({hasText:'Local QA: card condition'}).first().click();await expect(p.getByLabel('Répondre à cette demande')).toBeVisible();
await p.locator('.ops-bubbles').getByText('Fictional test enquiry: is this card near mint?',{exact:true}).waitFor();await p.locator('.ops-conversation').scrollIntoViewIfNeeded();
fs.mkdirSync('docs/evidence/messages',{recursive:true});await p.locator('.ops-conversation').screenshot({path:'docs/evidence/messages/local-mobile-fr.png'});
console.log(JSON.stringify({realLocalAPI:true,unreadBefore:1,unreadAfter:0,mobileComposerVisible:true,overflow:await p.evaluate(()=>document.documentElement.scrollWidth>innerWidth)}));await b.close();})().catch(e=>{console.error(e);process.exit(1)});