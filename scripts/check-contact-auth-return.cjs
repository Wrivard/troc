const {chromium,expect}=require('@playwright/test'),fs=require('node:fs');
(async()=>{
const browser=await chromium.launch({channel:'chrome'}),results=[];
try { for(const [lang,width] of [['en',1440],['fr',390]]) {
const p=await browser.newPage({viewport:{width,height:850}});
let signins=0, blockedWrites=0;
await p.route('**/api/**',async r=>{
const req=r.request(),path=new URL(req.url()).pathname;
if(path==='/api/auth/sign-in'){signins++;return r.fulfill({json:{ok:true}})}
if(req.method()!=='GET'){blockedWrites++;return r.fulfill({json:{ok:true}})}
if(path==='/api/account')return r.fulfill({status:401,json:{code:'unauthorized'}});
return r.continue();
});
const origin='http://127.0.0.1:4313',store='/store/cartes-du-nord';
await p.goto(origin+store+'?lang='+lang);
const trigger=p.getByRole('button',{name:lang==='fr'?'Contacter le vendeur':'Contact seller',exact:true});
await trigger.focus();await p.keyboard.press('Enter');
const dialog=p.getByRole('dialog'),login=dialog.getByRole('link');
await expect(login).toHaveAttribute('href','/sign-in?lang='+lang+'&returnTo='+encodeURIComponent(store));
await p.keyboard.press('Escape');await expect(trigger).toBeFocused();
await trigger.click();await login.click();
async function submit(){await p.locator('input[name="email"]').fill('fixture@example.test');await p.locator('input[name="password"]').fill('FixtureOnly123!');await p.locator('form button[type="submit"]').click();}
await submit();await expect(p).toHaveURL(origin+store+'?lang='+lang);
for(const target of ['/store//evil.test','/store/%2f%2fevil.test','/store/cartes-du-nord?next=https://evil.test','/store/../admin','//evil.test']){
await p.goto(origin+'/sign-in?lang='+lang+'&returnTo='+encodeURIComponent(target));
await submit();await expect(p).toHaveURL(origin+'/account?lang='+lang);
}
results.push({lang,width,storeReturn:true,escapeFocus:true,unsafeTargetsRejected:5,mockedSignins:signins,blockedWrites});
await p.close();
} fs.mkdirSync('docs/evidence/contact-auth-return',{recursive:true});fs.writeFileSync('docs/evidence/contact-auth-return/check.json',JSON.stringify(results,null,2));console.log(results);
}finally{await browser.close();}
})().catch(e=>{console.error(e.message);process.exitCode=1});
