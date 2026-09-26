const {chromium,expect}=require('@playwright/test');
(async()=>{const b=await chromium.launch({channel:'chrome'});try{const p=await b.newPage();await p.goto('http://127.0.0.1:4313/search?lang=en');await expect(p.locator('[aria-busy]').first()).toHaveAttribute('aria-busy','false');
let release;const gate=new Promise(r=>release=r);let started;const waiting=new Promise(r=>started=r);
await p.route('**/api/catalog/page?*',async r=>{if(new URL(r.request().url()).searchParams.get('q')==='slow'){started();await gate;}await r.continue().catch(()=>{});});
await p.locator('#catalog-browse-query').fill('slow');await p.locator('.troc-browse-search button').click();await waiting;await expect(p.locator('[aria-busy]').first()).toHaveAttribute('aria-busy','true');await p.goBack();await expect(p.locator('[aria-busy]').first()).toHaveAttribute('aria-busy','false');release();
await p.locator('#catalog-browse-query').fill('Pikachu');await p.locator('.troc-browse-search button').click();await expect(p.locator('[aria-busy]').first()).toHaveAttribute('aria-busy','false');await expect(p.locator('#catalog-browse-query')).toHaveValue('Pikachu');console.log('PASS cancelled slow request, Back clears pending, latest query preserved');
}finally{await b.close()}})().catch(e=>{console.error(e);process.exit(1)});
