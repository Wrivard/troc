import { chromium, expect } from "@playwright/test";
const b = await chromium.launch({ channel: "msedge", headless: true });
try {
  for (const width of [390, 1440])
    for (const lang of ["en", "fr"]) {
      const context = await b.newContext({ viewport: { width, height: 844 } });
      const p = await context.newPage();
      await p.goto(`http://localhost:4313/sign-in?lang=${lang}`);
      await p.locator('form a[href^="/sign-up"]').click();
      await expect(p).toHaveURL(new RegExp(`/sign-up\\?lang=${lang}`));
      await expect(p.locator("#password-hint")).toBeVisible();
      await p.locator('form a[href^="/sign-in"]').click();
      await expect(p).toHaveURL(new RegExp(`/sign-in\\?lang=${lang}`));
      const shop = p.locator('.troc-site-nav a[href^="/search"]');
      await expect(shop).toHaveAttribute("href", `/search?lang=${lang}`);
      const popupPromise = context.waitForEvent("page");
      await shop.click({ modifiers: ["Control"] });
      const popup = await popupPromise;
      await popup.waitForLoadState();
      await expect(popup).toHaveURL(new RegExp(`/search\\?lang=${lang}`));
      await popup.close();
      await shop.focus();
      await shop.press("Enter");
      await expect(p).toHaveURL(new RegExp(`/search\\?lang=${lang}`));
      await context.close();
    }
  console.log("4 native navigation and auth locale round-trip cases passed");
} finally {
  await b.close();
}
