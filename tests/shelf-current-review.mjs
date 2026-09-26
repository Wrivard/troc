import { chromium, expect } from "@playwright/test";
import assert from "node:assert/strict";
import fs from "node:fs/promises";
import process from "node:process";
const baseline = process.argv.includes("--baseline");
const browser = await chromium.launch({ channel: "chrome", headless: true });
const results = [];
const currentIdentity = new Map();
const cases = baseline
  ? [
      [1672, "en", "dark"],
      [1672, "fr", "dark"],
    ]
  : [
      [1672, "en", "dark"],
      [1440, "fr", "light"],
      [1100, "fr", "dark"],
      [1099, "en", "light"],
      [834, "en", "dark"],
      [600, "fr", "light"],
      [390, "fr", "dark"],
      [320, "en", "light"],
    ];
try {
  for (const [width, lang, theme] of cases) {
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
    const section = page.locator(".troc-small-edit");
    await expect(page.locator("[aria-busy]").first()).toHaveAttribute("aria-busy", "false");
    await section.scrollIntoViewIfNeeded();
    const cards = section.locator(".troc-market-card");
    await expect(cards).toHaveCount(4);
    for (const img of await cards.locator("img").all()) {
      await img.scrollIntoViewIfNeeded();
      await expect(img).toHaveJSProperty("complete", true);
      assert.ok(await img.evaluate((e) => e.naturalWidth > 0));
    }
    const identity = await cards.evaluateAll((es) =>
      es.map((e) => ({
        text: e.innerText,
        href: e.getAttribute("href"),
        src: e.querySelector("img").getAttribute("src"),
        srcset: e.querySelector("img").getAttribute("srcset"),
      })),
    );
    const file = `verification/shelf-baseline-${lang}.json`;
    if (baseline) {
      await fs.writeFile(file, JSON.stringify(identity, null, 2));
      await page.close();
      continue;
    }
    // Compare today's same-language identities across layouts; retain historical baseline files.
    if (currentIdentity.has(lang)) assert.deepEqual(identity, currentIdentity.get(lang));
    else currentIdentity.set(lang, identity);
    for (const item of identity) assert.match(item.href, /^\/product\//);
    for (const price of await cards.locator(".troc-market-card-price").allTextContents()) {
      const match = price.match(/\d+[.,]\d{2}/);
      assert.ok(match && Number(match[0].replace(",", ".")) < 1, "Shelf prices must be below one CAD");
    }
    const bounds = await cards.evaluateAll((es) =>
      es.map((e) => {
        const b = e.getBoundingClientRect();
        const price = e
          .querySelector(".troc-market-card-price")
          .getBoundingClientRect();
        return {
          x: b.x,
          y: b.y,
          width: b.width,
          height: b.height,
          priceY: price.y,
        };
      }),
    );
    console.log({width, lang, bounds, text: identity.map(x=>x.text)});
    const columns = width >= 1100 ? 4 : width >= 600 ? 2 : 1;
    assert.equal(
      bounds.filter((b) => Math.abs(b.y - bounds[0].y) < 2).length,
      columns,
    );
    for (let i = 0; i < 4; i += columns) {
      const row = bounds.slice(i, i + columns);
      assert.ok(
        Math.max(...row.map((b) => b.height)) -
          Math.min(...row.map((b) => b.height)) <
          2,
      );
      assert.ok(
        Math.max(...row.map((b) => b.priceY)) -
          Math.min(...row.map((b) => b.priceY)) <
          2,
      );
    }
    assert.equal(
      await page.evaluate(
        () => document.documentElement.scrollWidth > globalThis.innerWidth,
      ),
      false,
    );
    for (const card of await cards.all()) {
      await card.focus();
      await expect(card).toBeFocused();
    }
    assert.ok(
      await cards
        .locator("img")
        .evaluateAll((es) =>
          es.every((e) => globalThis.getComputedStyle(e).objectFit === "contain"),
        ),
    );
    const link = section.locator(".troc-editorial-text-link");
    const target = new URL(await link.getAttribute("href"), page.url());
    assert.equal(target.searchParams.get("max"), "99");
    assert.equal(target.searchParams.get("sort"), "price");
    assert.equal(target.searchParams.get("lang"), lang);
    await page.evaluate(() => globalThis.document.activeElement.blur());
    await page.mouse.move(0, 0);
    await section.screenshot({
      path: `verification/shelf-current-${width}-${lang}-${theme}.jpg`,
      style: ".troc-marketplace-header-frame,.troc-skip{visibility:hidden!important}",
    });
    if (width === 1672) {
      const productTarget = await cards.first().getAttribute("href");
      await cards.first().focus();
      await page.keyboard.press("Enter");
      await page.waitForURL(new URL(productTarget, page.url()).href);
      await expect(page.locator("h1")).not.toBeEmpty();
    }
    results.push({ width, lang, theme, columns, bounds, result: "PASS" });
    await page.close();
  }
  if (!baseline)
    await fs.writeFile(
      "verification/shelf-current-review.json",
      JSON.stringify(results, null, 2),
    );
  console.log(baseline ? "Captured original shelf data for EN/FR" : results);
} finally {
  await browser.close();
}
