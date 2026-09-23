import { chromium, expect } from "@playwright/test";
import assert from "node:assert/strict";
import fs from "node:fs/promises";
const browser = await chromium.launch({ channel: "chrome", headless: true });
const results = [];
try {
  for (const [width, lang, theme] of [
    [1672, "en", "dark"],
    [834, "en", "light"],
    [390, "fr", "dark"],
    [390, "en", "light"],
    [320, "fr", "light"],
  ]) {
    const page = await browser.newPage({
      viewport: { width, height: 1000 },
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
    const stats = page.locator(".troc-marketplace-stats"),
      categories = page.locator(".troc-category-section");
    await stats.waitFor();
    await categories.scrollIntoViewIfNeeded();
    await categories
      .locator("img")
      .evaluateAll((es) => Promise.all(es.map((e) => e.decode())));
    await expect(categories.locator(".troc-destination")).toHaveCount(5);
    const tiles = await categories
      .locator(".troc-destination")
      .evaluateAll((es) =>
        es.map((e) => ({
          href: e.getAttribute("href"),
          background: e
            .querySelector(".troc-destination-background")
            ?.getAttribute("src"),
          back: e
            .querySelector(".troc-destination-art img")
            ?.getAttribute("src"),
        })),
      );
    assert.equal(tiles.filter((t) => t.background).length, 5);
    assert.equal(tiles.filter((t) => t.back).length, 4);
    for (const link of await categories.locator("a").all()) {
      await link.focus();
      await expect(link).toBeFocused();
      assert.ok((await link.getAttribute("href")).includes(`lang=${lang}`));
    }
    assert.equal(
      await page.evaluate(
        () => document.documentElement.scrollWidth > globalThis.innerWidth,
      ),
      false,
    );
    assert.ok(
      (
        await page.evaluate(
          () => globalThis.getComputedStyle(document.body).backgroundImage,
        )
      ).includes("page-grain"),
    );
    await page.locator("h1").click();
    if (width === 1672) {
      await stats.evaluate(e => globalThis.scrollTo(0, e.getBoundingClientRect().top + globalThis.scrollY - 24));
      await page.screenshot({path: "verification/editorial-full-desktop.png"});
    }
    await stats.screenshot({
      path: `verification/editorial-stats-${width}-${lang}-${theme}.png`,
    });
    await categories.screenshot({
      path: `verification/editorial-categories-${width}-${lang}-${theme}.png`,
    });
    results.push({ width, lang, theme, tiles, result: "PASS" });
    await page.close();
  }
  await fs.writeFile(
    "verification/editorial-refinement.json",
    JSON.stringify(results, null, 2),
  );
  console.log(JSON.stringify(results, null, 2));
} finally {
  await browser.close();
}
