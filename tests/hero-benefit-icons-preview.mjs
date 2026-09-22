import { chromium } from "@playwright/test";
import assert from "node:assert/strict";
const browser = await chromium.launch({ channel: "chrome", headless: true });
try {
  for (const [width, lang, theme] of [
    [390, "fr", "dark"],
    [1440, "en", "light"],
    [320, "fr", "light"],
  ]) {
    const page = await browser.newPage({
      viewport: { width, height: 900 },
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
    const icons = page.locator(".troc-hero-benefit-icon");
    await icons.first().waitFor();
    const sizes = await icons.evaluateAll((els) =>
      els.map((el) => {
        const r = el.getBoundingClientRect();
        return [r.width, r.height];
      }),
    );
    assert.deepEqual(
      sizes,
      Array.from({ length: 4 }, () => [38, 38]),
    );
    assert.equal(
      await page.evaluate(
        () => document.documentElement.scrollWidth > globalThis.innerWidth,
      ),
      false,
    );
    await page
      .locator(".troc-hero-benefits")
      .screenshot({
        path: `verification/hero-icons-${width}-${lang}-${theme}.png`,
      });
    console.log({ width, lang, theme, sizes, result: "PASS" });
    await page.close();
  }
} finally {
  await browser.close();
}
