import {chromium,expect} from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";
import assert from "node:assert/strict";
import {mkdir,writeFile} from "node:fs/promises";
const out="verification/account-last";await mkdir(out,{recursive:true});
const browser=await chromium.launch({channel:"chrome"});const results=[];
try{
for(const [width,locale,intent,theme] of [[1440,"en","both","dark"],[390,"fr","buyer","light"],[320,"fr","seller","dark"]]){
const context=await browser.newContext({viewport:{width,height:900},reducedMotion:"reduce"});
await context.addInitScript(theme=>localStorage.setItem("troc.theme",theme),theme);
const page=await context.newPage();
let draft=null, user=null,profile=null,failSave=false,creates=0,finalizes=0,googleRequests=[];
await page.route("**/api/**",r=>{
 const p=new URL(r.request().url()).pathname,m=r.request().method(),b=r.request().postDataJSON();
 if(p==="/api/onboarding/draft"){
  if(m==="GET")return r.fulfill({json:{draft}});
  if(failSave)return r.fulfill({status:503,json:{code:"onboarding_unavailable"}});
  draft={payload:b.payload,revision:(draft?.revision||0)+1,ready:b.ready,completed:false};
  return r.fulfill({json:{saved:true,revision:draft.revision}});
 }
 if(p==="/api/auth/providers")return r.fulfill({json:{google:true}});
 if(p==="/api/account")return r.fulfill({status:user?200:401,json:user||{code:"unauthorized"}});
 if(p==="/api/auth/google"){googleRequests.push(b);return r.fulfill({status:503,json:{code:"service_unavailable"}});}
 if(p==="/api/auth/sign-up"){creates++;draft.awaitingEmail=true;return r.fulfill({status:202,json:{code:"check_email"}});}
 if(p==="/api/onboarding/finalize"){finalizes++;draft.completed=true;profile={payload:draft.payload,status:"waitlisted"};return r.fulfill({json:{completed:true,status:"waitlisted"}});}
 if(p==="/api/onboarding/profile")return r.fulfill({json:{profile}});
 return r.fulfill({status:503,json:{code:"service_unavailable"}});
});
await page.goto("http://127.0.0.1:4313/sign-up?lang="+locale);
await page.locator(".wl-intents").waitFor();
const next=()=>page.locator(".wl-actions button[type=submit]").click();
const choose=async(name,value)=>{await page.locator("#wl-"+name).click();await page.locator('[role=option][data-value="'+value+'"]').click();};
await expect(page.locator("#wl-account-email")).toHaveCount(0);
await page.locator('.wl-intents [role=radio][value="'+intent+'"]').check();await next();
await expect(page.locator("#wl-street")).toBeVisible();
await page.locator("#wl-contact").fill("Local Test");await page.locator("#wl-street").fill("123 Example Street");await page.locator("#wl-city").fill("Ottawa");
await choose("province","ON");await page.locator("#wl-postalCode").fill("K1A 0B1");await page.locator("#wl-canada").check();
await expect.poll(()=>draft?.payload.values.city).toBe("Ottawa");
await page.reload();await expect(page.locator("#wl-city")).toHaveValue("Ottawa");
await next();await page.locator(".wl-choices [role=checkbox]").first().check();await next();
if(intent!=="seller"){await next();}
if(intent!=="buyer"){
 for(const [n,v]of [["sellerType","individual"],["inventory","1000_9999"],["initialListings","100_249"],["readiness","at_launch"]])await choose(n,v);
 await page.locator("#wl-adult").check();await next();
}
await page.locator("#wl-consent").check();
await expect(page.locator(".wl-review")).toHaveCount(intent==="both"?5:4);
assert.equal(creates,0);
const axe=(await new AxeBuilder({page}).include(".wl-page").analyze()).violations;
assert.equal(axe.length,0,JSON.stringify(axe.map(v=>v.id)));
await page.screenshot({path:out+"/"+width+"-review.png",fullPage:true});
failSave=true;await next();await expect(page.locator(".wl-error")).toBeVisible();await expect(page.locator("#wl-account-email")).toHaveCount(0);
failSave=false;await next();await expect(page.locator("#wl-account-email")).toBeVisible();assert.equal(draft.ready,true);
await page.locator(".troc-google-signin-button").click();await expect.poll(()=>googleRequests.length).toBe(1);assert.equal(googleRequests[0].intent,"signup");
await page.locator("#wl-account-email").fill("local@example.test");await page.locator("#wl-account-password").fill("Only-a-local-test-123");await page.locator(".wl-account-form button[type=submit]").click();
await expect.poll(()=>creates).toBe(1);await expect(page.locator(".wl-success")).toHaveCount(0);
await page.reload();await expect(page.locator(".wl-account-form")).toHaveCount(0);await expect(page.locator(".wl-account a.wl-primary")).toBeVisible();
user={id:"verified-test-user",email:"local@example.test"};
await page.reload();await expect(page.locator(".wl-account")).toContainText("local@example.test");
await page.locator(".wl-account button.wl-primary").click();await expect(page.locator(".wl-success")).toBeVisible();
assert.equal(finalizes,1);assert.equal(profile.payload.intent,intent);assert.equal(profile.payload.checks.marketing||false,false);
await expect(page.locator("#wl-withdrawal-code")).toHaveCount(0);
assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth),false);
await page.screenshot({path:out+"/"+width+"-success.png",fullPage:true});
results.push({width,locale,intent,theme,passed:true,axe:axe.length});
await context.close();
}
}finally{await browser.close();}
await writeFile(out+"/results.json",JSON.stringify(results,null,2));console.log(results);
