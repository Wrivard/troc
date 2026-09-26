const { chromium, expect } = require('@playwright/test');
const fs = require('node:fs');
(async () => {
  const browser = await chromium.launch({ channel: 'chrome' });
  const results = [];
  try {
    for (const [lang, width] of [['en', 1440], ['fr', 390]]) {
      const page = await browser.newPage({ viewport: { width, height: 800 } });
      await page.goto('http://127.0.0.1:4313/product/pokemon-alakazam-ex-3c6915d3?lang=' + lang);
      await page.getByRole('button', { name: lang === 'fr' ? 'Acheter au meilleur prix' : 'Buy cheapest', exact: true }).click();
      await page.getByText(lang === 'fr' ? '1 ajouté chez' : 'Added 1 from', { exact: false }).waitFor();
      await page.getByRole('button', { name: lang === 'fr' ? /Panier/ : /Cart/ }).first().click();
      const dialog = page.getByRole('dialog');
      const options = dialog.locator('.troc-cart-seller-options').first();
      await options.locator('summary').click();
      const listingName = lang === 'fr' ? 'Conserver cette offre exacte' : 'Keep this exact listing';
      const sellerName = lang === 'fr' ? 'Conserver ce vendeur' : 'Keep this seller';
      const listing = dialog.getByRole('checkbox', { name: listingName, exact: true });
      const seller = dialog.getByRole('checkbox', { name: sellerName, exact: true });
      await listing.focus(); await page.keyboard.press('Space');
      await expect(listing).toBeChecked();
      await expect(seller).not.toBeChecked();
      await seller.click(); await expect(seller).toBeChecked();
      const read = () => page.evaluate(() => JSON.parse(localStorage.getItem('troc.cart.v1'))[0]);
      await expect.poll(async () => { const x = await read(); return [x.lockListing, x.lockSeller]; }).toEqual([true, true]);
      const original = await read();
      await page.keyboard.press('Escape');
      await page.goto('http://127.0.0.1:4313/cart?lang=' + lang);
      const fullListing = page.getByRole('checkbox', { name: listingName, exact: true });
      const fullSeller = page.getByRole('checkbox', { name: sellerName, exact: true });
      await expect(fullListing).toBeChecked(); await expect(fullSeller).toBeChecked();
      await fullSeller.click(); await expect(fullSeller).not.toBeChecked();
      await expect(fullListing).toBeChecked();
      await expect.poll(async () => (await read()).lockSeller).toBe(false);
      await page.reload();
      await expect(fullListing).toBeChecked(); await expect(fullSeller).not.toBeChecked();
      const retained = await read();
      expect(retained.listingId).toBe(original.listingId);
      expect(retained.quantity).toBe(original.quantity);
      expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
      results.push({ lang, width, independentLocks: true, keyboard: true, drawerToCart: true, reload: true, listingAndQuantityPreserved: true, noOverflow: true });
      await page.close();
    }
    fs.mkdirSync('docs/evidence/cart-lock-continuity', { recursive: true });
    fs.writeFileSync('docs/evidence/cart-lock-continuity/check.json', JSON.stringify(results, null, 2));
    console.log(results);
  } finally { await browser.close(); }
})().catch(error => { console.error(error.message); process.exitCode = 1; });
