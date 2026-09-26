const {chromium,expect}=require('@playwright/test');
const fs=require('fs');
(async()=>{
 const browser=await chromium.launch({channel:'chrome'});const evidence=[];
 try{
  for(const width of [1440,390]){
   const c=await browser.newContext({viewport:{width,height:950}});const p=await c.newPage();
   await p.goto('http://127.0.0.1:4313/search?lang=en&limit=12');await expect(p.locator('.troc-market-card')).toHaveCount(12);
   if(width===1440){await p.getByRole('radio',{name:'Pokémon',exact:true}).click();await expect(p).toHaveURL(/game=pokemon/);await expect(p.locator('[aria-busy]').first()).toHaveAttribute('aria-busy','false');await expect(p.getByRole('button',{name:'Apply filters',exact:true})).toHaveCount(0);evidence.push({width,instantGame:true,focus:await p.evaluate(()=>document.activeElement.id)});}
   else {await p.getByRole('button',{name:'Filters',exact:true}).click();await p.getByRole('radio',{name:'Pokémon',exact:true}).click();if(new URL(p.url()).searchParams.has('game'))throw Error('mobile applied before confirmation');await p.getByRole('button',{name:'Apply filters',exact:true}).click();await expect(p).toHaveURL(/game=pokemon/);evidence.push({width,mobileApply:true});}
   await p.getByRole('combobox',{name:'Sort',exact:true}).click();await p.getByRole('option',{name:'Newest sets',exact:true}).click();await expect(p).toHaveURL(/sort=newest/);await expect(p.locator('[aria-busy]').first()).toHaveAttribute('aria-busy','false');
   await p.goBack();await expect(p).not.toHaveURL(/sort=newest/);await expect(p).toHaveURL(/game=pokemon/);
   if(width===1440){
    await p.getByText('Price (CAD)',{exact:true}).click();await p.locator('#browse-price-min').fill('5');await p.locator('#browse-price-max').fill('20');
    await expect(p).not.toHaveURL(/min=/);await p.getByRole('heading',{name:'Find your cards'}).click();await expect(p).toHaveURL(/min=500/);await expect(p).toHaveURL(/max=2000/);
   }
   evidence.push({width,instantSort:true,history:true,priceCommit:width===1440});
   await c.close();
  }
  fs.writeFileSync('docs/evidence/performance/instant-filters.json',JSON.stringify(evidence,null,2));console.log(evidence);
 }finally{await browser.close()}
})().catch(e=>{console.error(e);process.exitCode=1});

