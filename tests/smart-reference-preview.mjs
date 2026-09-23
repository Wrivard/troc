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
      viewport: { width, height: 1100 },
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
    const section = page.locator(".troc-smart-edit");
    await section.scrollIntoViewIfNeeded();
    for (const cents of [1425, 1122, 303])
      await expect(section).toContainText(
        new Intl.NumberFormat(lang + "-CA", {
          style: "currency",
          currency: "CAD",
        }).format(cents / 100),
      );
    await expect(section).toContainText(
      lang === "fr" ? "démonstration" : "demo basket",
    );
    const panels = await section
      .locator(".troc-consolidation-side")
      .evaluateAll((es) =>
        es.map((e) => {
          const b = e.getBoundingClientRect();
          return { x: b.x, y: b.y, width: b.width, height: b.height };
        }),
      );
    assert.equal(panels.length, 2);
    if (width > 600) {
      assert.ok(Math.abs(panels[0].height - panels[1].height) < 2);
      assert.ok(Math.abs(panels[0].y - panels[1].y) < 2);
    } else assert.ok(panels[1].y > panels[0].y + panels[0].height);
    assert.equal(
      await page.evaluate(
        () => document.documentElement.scrollWidth > globalThis.innerWidth,
      ),
      false,
    );
    const cta = section.locator("a");
    await cta.focus();
    await expect(cta).toBeFocused();
    assert.match(await cta.getAttribute("href"), /smart-cart/);
    await cta.evaluate((e) => e.blur());
    await page.mouse.move(0, 0);
    await section.screenshot({
      path: `verification/smart-reference-${width}-${lang}-${theme}.jpg`,
    });
    results.push({ width, lang, theme, panels, result: "PASS" });
    await page.close();
  }
  await fs.writeFile(
    "verification/smart-reference.json",
    JSON.stringify(results, null, 2),
  );
  console.log(results);
} finally {
  await browser.close();
}
