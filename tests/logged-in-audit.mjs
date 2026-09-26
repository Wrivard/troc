import { chromium, expect } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";
import {mkdir,writeFile} from "node:fs/promises";
const out="../UX-AUDIT/LOGGED-IN-20260923";await mkdir(out,{recursive:true});
const browser=await chromium.launch({channel:"chrome",headless:true});const results=[];
try {
 for(const role of ["buyer","seller","admin"]){
 const c=await browser.newContext({viewport:{width:1440,height:1000}});const p=await c.newPage();
 await c.request.post("http://127.0.0.1:4313/api/dev/session",{headers:{Origin:"http://127.0.0.1:4313"},data:{role}});
 const routes=role==="buyer"?["/","/account","/account/settings","/account/orders","/account/addresses","/account/messages","/account/notifications","/account/wishlist","/account/price-alerts","/account/following","/account/credit","/collection","/want-lists","/seller/dashboard","/help"]:role==="seller"?["/account","/seller/dashboard","/seller/inventory","/seller/team","/seller/orders","/seller/settings","/seller/storefront","/seller/analytics","/seller/plan"]:["/account","/admin/seller-applications","/early-access/admin","/seller/dashboard"];
 for(const route of routes){const errors=[];const listener=r=>{if(r.url().includes("/api/")&&r.status()>=400)errors.push({path:new URL(r.url()).pathname,status:r.status()});};p.on("response",listener);await p.goto("http://127.0.0.1:4313"+route+"?lang=en");await p.waitForLoadState("networkidle");results.push({role,route,title:await p.title(),text:(await p.locator("main").innerText().catch(()=>p.locator("body").innerText())).slice(0,6500),errors,overflow:await p.evaluate(()=>document.documentElement.scrollWidth>innerWidth)});p.off("response",listener);
 if(["/account","/account/orders","/seller/dashboard","/seller/inventory","/admin/seller-applications","/early-access/admin"].includes(route))await p.screenshot({path:out+"/"+role+route.replaceAll("/","-")+".png",fullPage:true});
 }
 await p.goto("http://127.0.0.1:4313/account/orders?lang=en");const trigger=p.getByRole("button",{name:"Account menu: "+role+"@troc.test",exact:true});await trigger.click();await expect(p.getByRole("dialog")).toBeVisible();await p.screenshot({path:out+"/"+role+"-menu-desktop.png"});
 const axe=await new AxeBuilder({page:p}).include(".troc-account-popover").analyze();results.push({role,state:"menu",axe:axe.violations.map(x=>({id:x.id,impact:x.impact})),links:await p.locator(".troc-account-popover a").allTextContents()});
 await p.keyboard.press("Escape");await expect(trigger).toBeFocused();
 if(role==="buyer"){
 for(const [width,lang,theme] of [[390,"fr","light"],[320,"en","dark"],[768,"fr","dark"]]){
 await p.setViewportSize({width,height:900});await p.goto("http://127.0.0.1:4313/account/orders?lang="+lang);
 await p.evaluate(theme=>{document.documentElement.classList.remove("dark","light");document.documentElement.classList.add(theme);},theme);
 await p.getByRole("button",{name:(lang==="fr"?"Menu du compte : ":"Account menu: ")+"buyer@troc.test",exact:true}).click();
 await p.screenshot({path:out+"/buyer-menu-"+width+"-"+lang+"-"+theme+".png"});
 results.push({role,state:"menu",width,lang,theme:await p.locator("html").getAttribute("class"),overflow:await p.evaluate(()=>document.documentElement.scrollWidth>innerWidth),axe:(await new AxeBuilder({page:p}).include(".troc-account-popover").analyze()).violations.map(x=>x.id)});
 }
 await p.getByRole("button",{name:"Se déconnecter",exact:true}).click();await p.waitForURL("**/sign-in?lang=fr");await expect(p.locator(".troc-account-trigger")).toHaveCount(0);
 results.push({state:"signout",status:(await c.request.get("http://127.0.0.1:4313/api/account")).status()});
 }
 await c.close();
 }
}finally{await writeFile(out+"/evidence.json",JSON.stringify(results,null,2));await browser.close();}
console.log("Audit route observations and menu checks saved.");
