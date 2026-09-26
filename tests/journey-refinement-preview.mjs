import { chromium, expect } from "@playwright/test";
import assert from "node:assert/strict";
import fs from "node:fs/promises";
const browser = await chromium.launch({ channel: "chrome", headless: true });
const results = [];
try {
  for (const [width, lang, theme] of [
    [1672, "en", "dark"],
    [1440, "fr", "light"],
    [834, "en", "dark"],
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
    const section = page.locator(".troc-how-edit");
    await expect(page.locator("[aria-busy]").first()).toHaveAttribute("aria-busy", "false");
    await section.scrollIntoViewIfNeeded();
    await section
      .locator("img")
      .evaluateAll((es) => Promise.all(es.map((e) => e.decode())));
    await expect(section.locator(".troc-marketplace-journey > li")).toHaveCount(
      3,
    );
    // The section uses the current catalogue and seller directory, not fixed seed names.
    await expect(section.locator(".troc-example-result img")).toHaveCount(1);
    const image = section.locator(".troc-example-result img");
    assert.ok(await image.getAttribute("alt"));
    assert.ok(await image.evaluate(e => e.complete && e.naturalWidth > 0));
    const sellers = section.locator(".troc-marketplace-journey > li").nth(1).locator(".troc-example-seller");
    await expect(sellers).toHaveCount(2);
    for (const location of await sellers.locator("small").allTextContents()) {
      assert.ok(location.trim() && !/^,|,$/.test(location.trim()), "No dangling location punctuation");
    }
    await expect(section).toContainText(lang === "fr" ? "11,22 $" : "$11.22");
    await expect(section).toContainText(
      lang === "fr" ? "Parcours illustratif" : "Illustrative journey",
    );
    const panels = await section
      .locator(".troc-journey-illustration")
      .evaluateAll((es) =>
        es.map((e) => {
          const r = e.getBoundingClientRect();
          return { y: r.y, width: r.width, height: r.height };
        }),
      );
    console.log({ width, panels });
    await section.screenshot({
      path: `verification/journey-debug-${width}.png`,
      style: ".troc-marketplace-header-frame,.troc-skip{visibility:hidden!important}",
    });
    if (width > 1100) {
      assert.ok(
        Math.max(...panels.map((p) => p.y)) -
          Math.min(...panels.map((p) => p.y)) <
          2,
      );
      assert.ok(
        Math.max(...panels.map((p) => p.height)) -
          Math.min(...panels.map((p) => p.height)) <
          2,
      );
    }
    assert.equal(
      await page.evaluate(
        () => document.documentElement.scrollWidth > globalThis.innerWidth,
      ),
      false,
    );
    await section.screenshot({
      path: `verification/journey-${width}-${lang}-${theme}.png`,
      style: ".troc-marketplace-header-frame,.troc-skip{visibility:hidden!important}",
    });
    results.push({ width, lang, theme, panels, result: "PASS" });
    await page.close();
  }
  await fs.writeFile(
    "verification/journey-refinement.json",
    JSON.stringify(results, null, 2),
  );
  console.log(results);
} finally {
  await browser.close();
}
