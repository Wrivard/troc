import {chromium,expect} from "@playwright/test";
import assert from "node:assert/strict";
const browser=await chromium.launch({channel:"chrome"});
try{
const page=await browser.newPage({viewport:{width:390,height:900}});
let invalid=true,requests=[];
await page.route("**/api/**",r=>{
 const path=new URL(r.request().url()).pathname;
 if(path==="/api/auth/providers")return r.fulfill({json:{google:true}});
 if(path.startsWith("/api/auth/recovery/")){
  requests.push({path,body:r.request().postDataJSON()});
  const fail=path.endsWith("finish")&&invalid;
  return r.fulfill({status:fail?400:path.endsWith("start")?202:200,json:fail?{code:"auth_failed"}:{ok:true}});
 }
 return r.fulfill({status:401,json:{code:"unauthorized"}});
});
await page.goto("http://127.0.0.1:4313/sign-in?lang=fr&authError=email_confirmation_failed");
await expect(page.locator(".wl-login [role=alert]")).toBeVisible();
await page.getByRole("button",{name:"Mot de passe oublié?"}).click();
await page.getByLabel("Courriel",{exact:true}).fill("test@example.invalid");await page.getByRole("button",{name:"Envoyer le code"}).click();
await page.getByLabel("Code de récupération").fill("123456");
await page.getByLabel("Nouveau mot de passe",{exact:false}).fill("Only-test-password-123");
await page.getByRole("button",{name:"Modifier le mot de passe"}).click();await expect(page.locator(".wl-login [role=alert]")).toBeVisible();
await expect(page.getByLabel("Code de récupération")).toHaveValue("123456");
invalid=false;await page.getByRole("button",{name:"Modifier le mot de passe"}).click();await expect(page.locator(".wl-login [role=status]")).toContainText("modifié");
assert.equal(requests.length,3);assert.ok(requests.every(r=>r.path.startsWith("/api/auth/recovery")));
assert.equal(requests[0].body.password,undefined);
console.log("French mobile recovery: callback error, request code, invalid-code retry, success and credentials isolation PASS");
}finally{await browser.close();}
