
import {chromium,expect} from '@playwright/test';import AxeBuilder from '@axe-core/playwright';import assert from 'node:assert/strict';import{mkdir,writeFile}from'node:fs/promises';
const out='../UX-AUDIT/SELLER-OPERATIONS-20260923';await mkdir(out,{recursive:true});const b=await chromium.launch({channel:'chrome'});const results=[];
try{for(const[width,lang,theme]of[[1440,'en','dark'],[390,'fr','light']]){
 const c=await b.newContext({viewport:{width,height:1000}});await c.addInitScript(({lang,theme})=>{localStorage.setItem('troc.locale',lang);localStorage.setItem('troc.theme',theme)},{lang,theme});
 await c.request.post('http://127.0.0.1:4313/api/dev/session',{headers:{Origin:'http://127.0.0.1:4313'},data:{role:'seller'}});
 const p=await c.newPage();await p.goto('http://127.0.0.1:4313/seller/orders?lang='+lang);await expect(p.locator('.ops-table tbody tr')).toHaveCount(8);
 await expect(p.locator('.ops-product img')).toHaveCount(8);await p.locator('.ops-search input').fill('Charizard');assert.ok((await p.locator('.ops-table tbody tr').allTextContents()).every(s=>s.includes('Charizard')));await p.locator('.ops-search input').fill('');
 const axe=(await new AxeBuilder({page:p}).analyze()).violations.map(v=>({id:v.id,n:v.nodes.length}));assert.deepEqual(axe,[]);
 assert.equal(await p.evaluate(()=>document.documentElement.scrollWidth>innerWidth),false);
 await p.screenshot({path:out+'/orders-'+width+'.png',fullPage:true});
 await p.evaluate(()=>scrollTo(0,document.body.scrollHeight));const geometry=await p.evaluate(()=>{const s=document.querySelector('.seller-sidebar-rail>.seller-sidebar').getBoundingClientRect(),f=document.querySelector('.seller-workspace>footer').getBoundingClientRect();return{sidebarBottom:s.bottom,footerTop:f.top,background:getComputedStyle(document.querySelector('.seller-sidebar')).backgroundImage}});if(width>760)assert.ok(geometry.sidebarBottom<=geometry.footerTop+1,JSON.stringify(geometry));results.push({width,axe,geometry});await c.close();
}}finally{await b.close();await writeFile(out+'/orders.json',JSON.stringify(results,null,2))}console.log(results);
