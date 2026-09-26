const { chromium, expect } = require('@playwright/test');
const fs = require('node:fs');
(async () => {
  const browser = await chromium.launch({ channel: 'chrome' });
  const results = [];
  try {
    for (const [locale, width] of [['en', 1440], ['fr', 390]]) {
      const page = await browser.newPage({ viewport: { width, height: 900 } });
      await page.route('**/gallery-fixture/*.svg', route => route.fulfill({ contentType: 'image/svg+xml', body: '<svg xmlns="http://www.w3.org/2000/svg" width="300" height="420"><rect width="300" height="420" fill="#947047"/></svg>' }));
      await page.route('**/__gallery-audit?*', route => route.fulfill({ contentType: 'text/html', body: '<html data-theme="troc-dark"><div id="root"></div><script type="module">import R from "/@react-refresh";R.injectIntoGlobalHook(window);window.$RefreshReg$=()=>{};window.$RefreshSig$=()=>type=>type;window.__vite_plugin_react_preamble_installed__=true;await import("/src/__audit/gallery-selection.tsx");</script></html>' }));
      await page.goto('http://127.0.0.1:4313/__gallery-audit?lang=' + locale);
      const gallery = page.locator('[data-catalog-artwork]');
      const button = name => page.getByRole('button', { name, exact: true });
      const side = { front: locale === 'fr' ? 'Recto' : 'Front', back: locale === 'fr' ? 'Verso' : 'Back', detail: locale === 'fr' ? 'Détail' : 'Detail' };
      async function check(id, selected) {
        await expect(gallery.locator('button[aria-pressed="true"]')).toHaveText(selected);
        await expect(gallery.locator('a')).toHaveAttribute('href', '/gallery-fixture/' + id + '.svg');
        await expect(gallery.locator('img')).toHaveAttribute('src', '/gallery-fixture/' + id + '.svg');
        await expect.poll(() => gallery.locator('img').evaluate(e => e.complete && e.naturalWidth > 0)).toBe(true);
      }
      await button(side.detail).click();
      await button('shrink').click();
      await check('front', side.front);
      await button('reset').click();
      await button(side.back).focus(); await page.keyboard.press('Enter');
      await check('back', side.back);
      await button('reorder').click();
      await check('back', side.back);
      await button('product').click();
      await check('front', side.front);
      await button(side.back).click();
      await button('variant').click();
      await check('variant-front', side.front);
      await button(side.back).click();
      await check('variant-back', side.back);
      await button('empty').click();
      await expect(gallery.locator('a')).toHaveCount(0);
      await expect(gallery.locator('button')).toHaveCount(0);
      await expect(gallery.locator('img')).toHaveCount(0);
      results.push({ locale, width, shrinking: true, reordering: true, productChange: true, variantChange: true, keyboard: true, empty: true });
      await page.close();
    }
    fs.mkdirSync('docs/evidence/gallery-selection', { recursive: true });
    fs.writeFileSync('docs/evidence/gallery-selection/check.json', JSON.stringify(results, null, 2));
    console.log('Gallery selection: EN desktop / FR mobile passed');
  } finally { await browser.close(); }
})().catch(error => { console.error(error.message); process.exitCode = 1; });
