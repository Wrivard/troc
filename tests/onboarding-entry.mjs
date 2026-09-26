import {chromium,expect} from "@playwright/test";
import assert from "node:assert/strict";
const b=await chromium.launch({channel:"chrome"});
try{
for(const [width,lang] of [[1440,"en"],[390,"fr"]]){
const p=await b.newPage({viewport:{width,height:900},reducedMotion:"reduce"});
let signup=[],google=[],accepted=false;
await p.route("**/api/**",r=>{
 const path=new URL(r.request().url()).pathname;
 if(path==="/api/account")return r.fulfill({status:401,json:{code:"unauthorized"}});
 if(path==="/api/auth/providers")return r.fulfill({json:{google:true}});
 if(path==="/api/auth/google"){google.push(r.request().postDataJSON());return r.fulfill({status:503,json:{code:"service_unavailable"}});}
 if(path==="/api/auth/sign-up"){signup.push(r.request().postDataJSON());return r.fulfill({status:accepted?202:503,json:accepted?{code:"check_email"}:{code:"service_unavailable"}});}
 return r.fulfill({status:503,json:{}});
});
await p.goto("http://127.0.0.1:4313/sign-up?lang="+lang);
await expect(p.locator(".wl-account-form")).toBeVisible();await expect(p.locator("form.wl-form")).toHaveCount(0);await expect(p.locator(".wl-success")).toHaveCount(0);
await p.locator(".troc-google-signin-button").click();
assert.equal(google.length,0);
await p.locator("#signup-street").fill("123 Example Street");
await p.locator("#signup-city").fill("Ottawa");
await p.locator("#signup-province").click();
await p.getByRole("option",{name:"Ontario",exact:true}).click();
await p.locator("#signup-postal").fill("K1A 0B1");
await p.locator(".troc-google-signin-button").click();
await expect(p.locator(".wl-account [role=alert]")).toBeVisible();
assert.equal(google[0].returnTo,"/early-access");
await p.locator("#wl-account-email").fill("new@example.test");
await p.locator("#wl-account-password").fill("Test-passphrase-only-123");
assert.equal(google[0].intent,"signup");
assert.equal(google[0].address.country,"CA");
await p.locator(".wl-account-form button[type=submit]").click();
await expect(p.locator(".wl-account [role=alert]")).toBeVisible();
accepted=true;
await p.screenshot({path:"verification/onboarding-integrated/account-"+width+".png",fullPage:true});
await p.locator(".wl-account-form button[type=submit]").click();
await expect(p.locator(".wl-account-form")).toHaveCount(0);
assert.equal(signup.at(-1).onboarding,true);
await expect(p.locator(".wl-account a")).toHaveAttribute("href",/returnTo=%2Fearly-access/);
assert.equal(await p.evaluate(()=>document.documentElement.scrollWidth>innerWidth),false);
await p.close();console.log(width,"authentication precedes questions, Google return target, signup retry and verification handoff PASS");
}
}finally{await b.close();}

