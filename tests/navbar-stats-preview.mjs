import { chromium, expect } from "@playwright/test";
import assert from "node:assert/strict";
import fs from "node:fs/promises";
import process from "node:process";
const browser = await chromium.launch({ channel: "chrome", headless: true });
const results = [];
try {
  for (const [width, lang, theme] of [
    [1440, "en", "dark"],
    [2560, "fr", "light"],
    [834, "fr", "dark"],
    [390, "en", "light"],
    [320, "fr", "dark"],
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
    const stats = page.locator(".troc-marketplace-stats");
    await expect(stats).toBeVisible();
    const text = await stats.innerText();
    const baseline = `verification/nav-stats-baseline-${lang}.json`;
    if (process.argv.includes("--baseline")) {
      await fs.writeFile(baseline, JSON.stringify({ text }));
      await page.close();
      continue;
    }
    assert.equal(text, JSON.parse(await fs.readFile(baseline, "utf8")).text);
    const header = page.locator(".troc-marketplace-header-frame");
    const before = await header.boundingBox();
    if (width === 320) {
      assert.ok(before.height <= 180);
      const lastLink = await header
        .locator(".troc-site-nav-link")
        .last()
        .boundingBox();
      const cartBox = await header.locator(".troc-site-cart").boundingBox();
      assert.ok(
        lastLink.x + lastLink.width <= cartBox.x,
        "Navigation labels do not overlap cart",
      );
    }
    await page.evaluate(() => globalThis.scrollTo(0, 1200));
    await expect
      .poll(async () => Math.round((await header.boundingBox()).y))
      .toBe(0);
    const geometry = await page.evaluate(() => {
      const s = document.querySelector(".troc-marketplace-stats"),
        c = document.querySelector(".troc-category-section"),
        d = s.querySelector(".troc-stats-decoration"),
        r = s.getBoundingClientRect(),
        b = d.getBoundingClientRect();
      return {
        ordered: !!(
          c.compareDocumentPosition(s) &
          globalThis.Node.DOCUMENT_POSITION_FOLLOWING
        ),
        leafRight: b.right - r.right,
        leafBottom: b.bottom - r.bottom,
        border: globalThis.getComputedStyle(s).borderBottomWidth,
        source: s.querySelector(".troc-stats-source").textContent,
        overflow: document.documentElement.scrollWidth > innerWidth,
      };
    });
    assert.ok(geometry.ordered);
    assert.ok(Math.abs(geometry.leafRight) <= 1);
    assert.ok(Math.abs(geometry.leafBottom) <= 1);
    assert.equal(geometry.border, "1px");
    assert.equal(geometry.overflow, false);
    await stats.scrollIntoViewIfNeeded();
    await stats.locator("img").evaluate((e) => e.decode());
    await stats.screenshot({
      path: `verification/nav-stats-${width}-${lang}-${theme}.jpg`,
    });
    await page.locator(".troc-skip").focus();
    await page.keyboard.press("Enter");
    const main = await page.locator("#main-content").boundingBox();
    assert.ok(
      main.y >= before.height - 1,
      "Skip target stays below persistent header",
    );
    const cart = header.getByRole("button", {
      name: lang === "fr" ? /^Panier/ : /^Cart/,
    });
    await cart.click();
    await expect(page.getByRole("dialog")).toBeVisible();
    await expect
      .poll(() =>
        page.getByRole("dialog").evaluate((e) => {
          const b = e.getBoundingClientRect();
          return e.contains(
            document.elementFromPoint(b.right - 20, b.top + 30),
          );
        }),
      )
      .toBe(true);
    await page.keyboard.press("Escape");
    await expect(cart).toBeFocused();
    await page.evaluate(() => globalThis.scrollTo(0, 1200));
    await header.screenshot({
      path: `verification/nav-header-${width}-${lang}-${theme}.jpg`,
    });
    results.push({
      width,
      lang,
      theme,
      headerHeight: before.height,
      geometry,
      result: "PASS",
    });
    await page.close();
  }
  if (!process.argv.includes("--baseline")) {
    await fs.writeFile(
      "verification/nav-stats.json",
      JSON.stringify(results, null, 2),
    );
    console.log(results);
  } else console.log("Saved original ENFR stats text baselines before build");
} finally {
  await browser.close();
}
