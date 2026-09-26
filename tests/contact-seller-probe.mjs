
import{chromium,expect}from'@playwright/test';
const b=await chromium.launch({channel:'chrome'}),c=await b.newContext({viewport:{width:1440,height:1000}}),origin='http://127.0.0.1:4313';try{await c.request.post(origin+'/api/dev/session',{headers:{Origin:origin},data:{role:'buyer'}});const p=await c.newPage();await p.goto(origin+'/store/cartes-du-nord?lang=en');await expect(p.getByRole('button',{name:'Contact seller',exact:true})).toBeVisible({timeout:15000});console.log('Contact actions:',await p.getByRole('button',{name:'Contact seller',exact:true}).count());console.log((await p.locator('main').innerText()).slice(0,350));}finally{await b.close()}

