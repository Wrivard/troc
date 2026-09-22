import { chromium } from "@playwright/test";
import assert from "node:assert/strict";
const browser = await chromium.launch({ channel: "chrome", headless: true });
try {
  for (const width of [320, 390, 1440])
    for (const lang of ["en", "fr"])
      for (const theme of ["light", "dark"]) {
        const page = await browser.newPage({
          viewport: { width, height: width < 1440 ? 844 : 900 },
          reducedMotion: "reduce",
        });
        await page.addInitScript(
          ({ lang, theme }) => {
            globalThis.localStorage.setItem("troc.locale", lang);
            globalThis.localStorage.setItem("troc.theme", theme);
          },
          { lang, theme },
        );
        await page.goto(`http://127.0.0.1:4313/?lang=${lang}`);
        await page.locator(".troc-marketplace-journey").waitFor();
        assert.equal(
          await page.locator(".troc-marketplace-journey > li").count(),
          3,
        );
        assert.equal(
          await page.evaluate(
            () => document.documentElement.scrollWidth > innerWidth,
          ),
          false,
        );
        for (const [name, selector] of [
          ["hero", ".troc-home-hero"],
          ["journey", ".troc-how-edit"],
          ["stores", ".troc-community-grid"],
          ["closing", ".troc-final-edit"],
        ]) {
          const el = page.locator(selector);
          await el.scrollIntoViewIfNeeded();
          await el.locator("img").evaluateAll(async (images) => {
            await Promise.all(
              images.map((image) => image.decode().catch(() => {})),
            );
          });
          if (await el.count())
            await el.screenshot({
              path: `verification/vision-home-${width}-${lang}-${theme}-${name}.png`,
            });
        }
        await page.locator('a[href*="/store/cartes-du-nord"]').last().click();
        await page.locator(".troc-store-hero").waitFor();
        assert.equal(
          await page.locator(".troc-store-profile h1").innerText(),
          "Card Forge TCG",
        );
        assert.equal(
          await page.evaluate(
            () => document.documentElement.scrollWidth > innerWidth,
          ),
          false,
        );
        await page.locator(".troc-store-hero").screenshot({
          path: `verification/vision-store-${width}-${lang}-${theme}.png`,
        });
        for (const [slug, name] of [
          ["maple-singles", "Piko Trading Cards"],
          ["west-coast-cards", "The Playground"],
        ]) {
          await page.goto(`http://127.0.0.1:4313/store/${slug}?lang=${lang}`);
          await page.locator(".troc-store-hero").waitFor();
          assert.equal(
            await page.locator(".troc-store-profile h1").innerText(),
            name,
          );
          await page
            .locator(".troc-store-hero img")
            .evaluateAll(async (images) => {
              await Promise.all(images.map((image) => image.decode()));
            });
          assert.equal(
            await page.evaluate(
              () => document.documentElement.scrollWidth > innerWidth,
            ),
            false,
          );
          await page
            .locator(".troc-store-hero")
            .screenshot({
              path: `verification/vision-store-${slug}-${width}-${lang}-${theme}.png`,
            });
        }
        console.log(JSON.stringify({ width, lang, theme, result: "PASS" }));
        await page.close();
      }
} finally {
  await browser.close();
}
