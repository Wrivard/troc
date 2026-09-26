const {chromium,expect}=require('@playwright/test'),fs=require('fs');
(async()=>{const b=await chromium.launch({channel:'chrome'}),out=[],origin='http://127.0.0.1:4313';fs.mkdirSync('docs/evidence/storefront-editor',{recursive:true});try{
for(const [width,lang,theme] of [[1440,'en','dark'],[390,'fr','light'],[320,'en','dark'],[820,'fr','dark']]){
const c=await b.newContext({viewport:{width,height:950},reducedMotion:'reduce'});await c.request.post(origin+'/api/dev/session',{headers:{Origin:origin},data:{role:'seller'}});const p=await c.newPage();let posts=0;
await p.route('**/api/seller/platform/*/storefront',async r=>{if(r.request().method()==='POST'){posts++;await r.fulfill({status:503,contentType:'application/json',body:JSON.stringify({error:'unavailable'})})}else await r.continue()});
await p.goto(origin+'/seller/storefront?lang='+lang);await p.waitForLoadState('networkidle');if(theme==='light') await p.getByRole('button',{name:'TROC Light',exact:true}).click(); await expect(p.locator('html')).toHaveAttribute('data-theme','troc-'+theme);
const en=p.getByLabel('English — '+(lang==='en'?'public description':'description publique'));await en.fill('A collector-run store. Carefully packed cards, from our collection to yours.');await expect(p.locator('.storefront-preview-description')).toContainText(lang==='en'?'A collector-run':'Votre description');
await p.getByRole('group',{name:lang==='en'?'Preview language':'Langue de l’aperçu'}).getByRole('button',{name:'EN',exact:true}).click();await expect(p.locator('.storefront-preview-description')).toContainText('A collector-run');
await p.evaluate(() => { document.activeElement?.blur(); window.scrollTo(0,0); });
await p.screenshot({path:`docs/evidence/storefront-editor/${width}-${lang}-${theme}.png`,fullPage:false});
await p.getByRole('button',{name:lang==='en'?'Publish description':'Publier la description',exact:true}).click();await expect(p.getByRole('alert')).toContainText(lang==='en'?'Your text is kept':'Votre texte est conservé');await expect(en).toHaveValue('A collector-run store. Carefully packed cards, from our collection to yours.');expect(posts).toBe(1);
await p.getByRole('button',{name:lang==='en'?'Discard text changes':'Annuler les modifications du texte',exact:true}).click();
expect(await p.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);
const small=await p.locator('.storefront-preview button,.storefront-jump-links a,.seller-page-actions button').evaluateAll(es=>es.filter(e=>e.getBoundingClientRect().height>0&&e.getBoundingClientRect().height<44).map(e=>e.textContent));expect(small).toEqual([]);
await p.getByRole('link',{name:lang==='en'?'Store story':'Histoire de la boutique',exact:true}).click();expect(await p.locator('#storefront-story').evaluate(e=>e.getBoundingClientRect().top)).toBeGreaterThan(60);
if(width<=1100) { const nav=await p.locator('.storefront-jump-links').boundingBox(),story=await p.locator('#storefront-story').boundingBox(); expect(story.y).toBeGreaterThanOrEqual(nav.y+nav.height); }
out.push({width,lang,theme,livePreview:true,failedPublishRetainsText:true,noOverflow:true,touchTargets:true,anchorNotObscured:true});await c.close();}
// Explicit permission recovery and read-only states, isolated API responses.
const c=await b.newContext();await c.request.post(origin+'/api/dev/session',{headers:{Origin:origin},data:{role:'seller'}});const p=await c.newPage();let failed=true;
await p.route('**/api/seller/platform/*/settings',r=>failed?r.fulfill({status:503,contentType:'application/json',body:'{"error":"unavailable"}'}):r.continue());await p.goto(origin+'/seller/storefront?lang=en');await p.getByText('Editing permissions could not load.',{exact:true}).waitFor();await expect(p.getByLabel('Banner',{exact:true})).toBeDisabled();failed=false;await p.getByRole('button',{name:'Try again',exact:true}).click();await expect(p.getByLabel('Banner',{exact:true})).toBeEnabled();
await p.route('**/api/seller/platform/*/storefront',r=>r.fulfill({status:200,contentType:'application/json',body:JSON.stringify({storyEn:'Read only',storyFr:'',version:'1',canManage:false})}));await p.reload();await expect(p.getByText('Only owners and managers can publish changes.',{exact:true})).toBeVisible();await expect(p.getByLabel('English — public description')).toBeDisabled();await c.close();out.push({permissionRetry:true,readOnly:true});fs.writeFileSync('docs/evidence/storefront-editor/check.json',JSON.stringify(out,null,2));console.log(out);
}finally{await b.close()}})().catch(e=>{console.error(e);process.exitCode=1});

