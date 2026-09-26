import {createRequire} from 'node:module';
import {once} from 'node:events';
import {readFile,writeFile} from 'node:fs/promises';
import {resolve} from 'node:path';
import {gzipSync} from 'node:zlib';
import {chromium,expect} from '@playwright/test';
import publicRouter from '../artifacts/api-server/src/routes/public-site';
const require=createRequire(new URL('../artifacts/api-server/package.json',import.meta.url));
const express=require('express'),cookieParser=require('cookie-parser');
process.env.CATALOG_MODE='demo';
const app=express();app.use(cookieParser());
app.use((req:any,res:any,next:any)=>{const send=res.send.bind(res);res.send=(body:any)=>{if(typeof body==='string'&&req.headers['accept-encoding']?.includes('gzip')){res.set('Content-Encoding','gzip');res.set('Vary','Accept-Encoding');return send(gzipSync(body))}return send(body)};next()});
app.use('/api',async(req:any,res:any)=>{if(req.method!=='GET')return res.sendStatus(405);const r=await fetch('http://127.0.0.1:5313/api'+req.url,{headers:{cookie:req.headers.cookie||''}});res.status(r.status);for(const key of ['content-type','cache-control','server-timing'])if(r.headers.get(key))res.set(key,r.headers.get(key));res.send(await r.text())});
app.use('/assets',async(req:any,res:any,next:any)=>{try{const path=resolve('artifacts/marketplace/dist/assets','.'+req.path);if(!path.startsWith(resolve('artifacts/marketplace/dist/assets')+'\\'))return res.sendStatus(400);const body=await readFile(path);res.type(path);if(/\.(js|css)$/.test(path)&&req.headers['accept-encoding']?.includes('gzip')){res.set('Content-Encoding','gzip');res.send(gzipSync(body))}else res.send(body)}catch{next()}});
app.use('/catalog-art',express.static(resolve('artifacts/marketplace/public/catalog-art'),{immutable:true,maxAge:'1y'}));app.use(express.static(resolve('artifacts/marketplace/dist'),{index:false}));app.use(async(req:any,res:any,next:any)=>{if(process.env.PERF_SQL!=='true'||!/^\/(?:$|search$|product\/|store\/|games\/|sets\/)/.test(req.path))return next();const r=await fetch('http://127.0.0.1:5313'+req.originalUrl,{headers:{cookie:req.headers.cookie||''},redirect:'manual'});if(r.status>=300&&r.status<400){res.status(r.status).set('Location',r.headers.get('location')||'/').end();return;}res.status(r.status);res.type(r.headers.get('content-type')||'text/html');res.send(await r.text());});app.use(publicRouter);app.use((_req:any,res:any)=>res.sendFile(resolve('artifacts/marketplace/dist/index.html')));
const server=app.listen(0,'127.0.0.1');await once(server,'listening');const address=server.address();if(!address||typeof address==='string')throw Error('address');const base='http://127.0.0.1:'+address.port;process.env.PUBLIC_SITE_URL=base;
const browser=await chromium.launch({channel:'chrome'});const routes:any[]=[],measurements:any[]=[];
try{
 const hydrationMatrix=[];
 const renderedSearch=await(await fetch(base+'/search?lang=en')).text();
 const catalog=JSON.parse(renderedSearch.match(/window\.__TROC_PAGE__=(.*?);<\/script>/s)![1]);
 for(const lang of ['en','fr'])for(const theme of ['dark','light']){
  const c=await browser.newContext();await c.addCookies([{name:'troc_theme',value:theme,url:base}]);const p=await c.newPage();const errors:string[]=[];
  p.on('pageerror',e=>errors.push(e.message));p.on('console',m=>{if(m.type()==='error'&&/hydrat|Minified React error|server rendered/i.test(m.text()))errors.push(m.text())});
  for(const path of ['/','/search','/product/'+catalog.results[0].product.slug,'/store/cartes-du-nord']){await p.goto(base+path+'?lang='+lang);await expect(p.locator('[aria-busy]').first()).toHaveAttribute('aria-busy','false');await expect(p.locator('html')).toHaveAttribute('lang',lang+'-CA');await expect(p.locator('html')).toHaveAttribute('data-theme','troc-'+theme);expect(errors).toEqual([]);hydrationMatrix.push({path,lang,theme,errors:0})}await c.close();
 }
 await writeFile('docs/evidence/theme-flash/hydration.json',JSON.stringify(hydrationMatrix,null,2));
 const html=await (await fetch(base+'/search?lang=fr&game=pokemon')).text();expect(html).toContain('window.__TROC_PAGE__');expect(html).toContain('rel="canonical"');expect(html).toContain('hreflang="fr-CA"');expect(html).toContain('noindex,follow');expect(html).toContain('catalog-browse-form');
console.log("16 compiled hydration cases and SEO assertions passed");
}finally{await browser.close();server.closeAllConnections();await new Promise<void>(r=>server.close(()=>r()))}
