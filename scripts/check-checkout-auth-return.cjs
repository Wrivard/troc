const {chromium,expect}=require('@playwright/test');
const fs=require('fs');
(async()=>{
 const browser=await chromium.launch({channel:'chrome'}), evidence=[];
 try {for(const lang of ['en','fr']){
  const context=await browser.newContext({viewport:{width:lang==='en'?1440:390,height:900}});
  const page=await context.newPage();let signins=0, mutations=0;
  await page.addInitScript(()=>localStorage.setItem('troc.cart.v1',JSON.stringify([{listingId:'isolated-browser-fixture',quantity:2}])));
  await page.route('**/api/**',async route=>{
   const req=route.request(),path=new URL(req.url()).pathname;
   if(path==='/api/auth/sign-in'){signins++;return route.fulfill({json:{ok:true}})}
   if(path==='/api/commerce/quote')return route.fulfill({json:{groups:[],cards:0,merchandiseCents:0,discountCents:0,shippingCents:0,taxCents:0,creditCents:0,totalCents:0,eligible:false,demo:true,currency:'CAD'}});
   if(req.method()!=='GET'){mutations++;return route.fulfill({json:{ok:true}})}
   if(path==='/api/commerce/cart'||path==='/api/account')return route.fulfill({status:401,json:{code:'unauthorized'}});
   return route.continue();
  });
  const origin='http://127.0.0.1:4313';
  await page.goto(origin+'/checkout?lang='+lang);
  const login=page.getByRole('alert').getByRole('link');
  await expect(login).toHaveAttribute('href','/sign-in?lang='+lang+'&returnTo=%2Fcheckout');
  await login.click();
  async function submit(){await page.locator('input[name="email"]').fill('test@example.test');await page.locator('input[name="password"]').fill('NotARealPassword123!');await page.locator('form button[type="submit"]').click()}
  await submit();await expect(page).toHaveURL(origin+'/checkout?lang='+lang);
  expect(await page.evaluate(()=>localStorage.getItem('troc.cart.v1'))).toBe(JSON.stringify([{listingId:'isolated-browser-fixture',quantity:2}]));
  for(const target of ['/cart','/smart-cart','//evil.test','/checkout?redirect=https://evil.test']){
   await page.goto(origin+'/sign-in?lang='+lang+'&returnTo='+encodeURIComponent(target));
   await submit();await expect(page).toHaveURL(origin+(target==='/cart'||target==='/smart-cart'?target:'/account')+'?lang='+lang);
  }
  evidence.push({lang,checkoutLink:true,emailReturn:true,cartPreserved:true,cartAndSmartReturn:true,unsafeReturnRejected:true,mockedSignins:signins,interceptedOtherWrites:mutations});
  await context.close();
 }
 fs.mkdirSync('docs/evidence/checkout-auth-return',{recursive:true});fs.writeFileSync('docs/evidence/checkout-auth-return/check.json',JSON.stringify(evidence,null,2));console.log(evidence);
 }finally{await browser.close()}
})().catch(e=>{console.error(e);process.exitCode=1});
