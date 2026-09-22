import { chromium } from "@playwright/test";
import assert from "node:assert/strict";
const browser = await chromium.launch({ channel: "chrome", headless: true });
try {
  for (const width of [390, 1440])
    for (const lang of ["en", "fr"])
      for (const theme of ["light", "dark"]) {
        const page = await browser.newPage({
          viewport: { width, height: width === 390 ? 844 : 900 },
        });
        await page.addInitScript(
          ({ lang, theme }) => {
            globalThis.localStorage.setItem("troc.locale", lang);
            globalThis.localStorage.setItem("troc.theme", theme);
          },
          { lang, theme },
        );
        await page.goto(`http://127.0.0.1:4313/?lang=${lang}`);
        await page.locator(".troc-marketplace-stats").waitFor();
        for (const selector of [".troc-home-hero"])
          assert.equal(
            await page
              .locator(selector)
              .evaluate(
                (el) => globalThis.getComputedStyle(el).backgroundColor,
              ),
            "rgba(0, 0, 0, 0)",
          );
        assert.equal(
          await page
            .locator(".troc-marketplace-stats")
            .evaluate((el) => el.classList.contains("light")),
          false,
        );
        assert.equal(
          await page.evaluate(
            () => document.documentElement.scrollWidth > innerWidth,
          ),
          false,
        );
        await page.locator(".troc-home-hero").screenshot({
          path: `verification/home-backdrop-${width}-${lang}-${theme}-hero.png`,
        });
        await page.locator(".troc-marketplace-stats").screenshot({
          path: `verification/home-backdrop-${width}-${lang}-${theme}-stats.png`,
        });
        console.log({ width, lang, theme, result: "PASS" });
        await page.close();
      }
} finally {
  await browser.close();
}
