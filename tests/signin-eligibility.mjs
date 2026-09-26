
import {chromium,expect} from "@playwright/test";
import assert from "node:assert/strict";
const browser=await chromium.launch({channel:"chrome"});
try {
 for(const [width,lang] of [[1440,"en"],[390,"fr"]]) {
 const page=await browser.newPage({viewport:{width,height:950},reducedMotion:"reduce"});
 const requests=[];
 await page.route("**/api/**",r=>{
 const path=new URL(r.request().url()).pathname;
 if(path==="/api/auth/providers")return r.fulfill({json:{google:true}});
 if(path==="/api/auth/google"){requests.push(r.request().postDataJSON());return r.fulfill({status:503,json:{code:"service_unavailable"}});}
 return r.fulfill({status:401,json:{code:"unauthorized"}});
 });
 await page.goto("http://127.0.0.1:4313/sign-in?lang="+lang);
 const button=page.locator(".troc-google-signin-button");
 await expect(button).toBeEnabled();
 await expect(page.locator(".troc-google-signin-consent")).toHaveCount(0);
 assert.equal(await button.evaluate(e=>getComputedStyle(e).backgroundColor),"rgb(255, 255, 255)");
 assert.equal(await page.locator(".signin-register-prompt").evaluate(e=>getComputedStyle(e).textDecorationLine),"none");
 await expect(page.locator(".signin-register a")).toHaveAttribute("href",/sign-up/);
 await page.locator(".troc-signin-artwork img, .troc-signin-visual img").first().waitFor({timeout:1500}).catch(()=>{});
 await page.screenshot({path:"verification/onboarding-integrated/signin-canada-"+width+".png"});
 await button.click();
 await expect.poll(()=>requests.length).toBe(1);
 assert.equal(requests[0].intent,"signin");
 assert.equal(requests[0].canadaConfirmed,undefined);
 assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth),false);
 await page.close();
 console.log(width,lang,"sign-in: no consent checkbox, white Google button, separate signup link, correct OAuth intent PASS");
 }
}finally{await browser.close();}
