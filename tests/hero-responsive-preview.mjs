import { chromium, expect } from "@playwright/test";
import fs from "node:fs/promises";
import assert from "node:assert/strict";
const browser = await chromium.launch({ channel: "chrome", headless: true });
const rows = [];
const cases = [
  320, 359, 360, 390, 430, 767, 768, 769, 834, 1023, 1024, 1025, 1199, 1200,
  1201, 1280, 1366, 1440, 1672, 1920, 2560, 3440,
].map((width) => ({
  width,
  height: 1000,
  lang: "en",
  theme: "dark",
  motion: "reduce",
}));
cases.push(
  ...[320, 390, 768, 1024, 1440, 3440].map((width) => ({
    width,
    height: 700,
    lang: "fr",
    theme: "light",
    motion: "reduce",
  })),
  { width: 844, height: 390, lang: "fr", theme: "dark", motion: "reduce" },
  { width: 720, height: 450, lang: "fr", theme: "light", motion: "reduce" },
  {
    width: 1672,
    height: 941,
    lang: "en",
    theme: "dark",
    motion: "no-preference",
  },
);
try {
  for (const c of cases) {
    const page = await browser.newPage({
      viewport: { width: c.width, height: c.height },
      reducedMotion: c.motion,
    });
    await page.addInitScript((c) => {
      globalThis.localStorage.setItem("troc.theme", c.theme);
      globalThis.localStorage.setItem("troc.locale", c.lang);
    }, c);
    await page.goto(`http://127.0.0.1:4313/?lang=${c.lang}`);
    const hero = page.locator(".troc-cinematic-hero");
    await hero
      .locator("img")
      .evaluateAll((es) => Promise.all(es.map((e) => e.decode())));
    const measure = () =>
      page.evaluate(() => {
        const box = (e) => {
          const r = e.getBoundingClientRect();
          return {
            x: r.x,
            y: r.y,
            right: r.right,
            bottom: r.bottom,
            width: r.width,
            height: r.height,
          };
        };
        const cards = [
          ...document.querySelectorAll(".troc-cinematic-hero .troc-stack-card"),
        ].map(box);
        const essential = [
          ...document.querySelectorAll(
            ".troc-hero-copy,.troc-hero-benefits,.troc-hero-closing",
          ),
        ].map(box);
        const hit = (a, b) =>
          a.x < b.right && a.right > b.x && a.y < b.bottom && a.bottom > b.y;
        return {
          cards,
          essential,
          overlap: cards.some((a) => essential.some((b) => hit(a, b))),
          overflow:
            document.documentElement.scrollWidth > globalThis.innerWidth,
          background: globalThis.getComputedStyle(
            document.querySelector(".troc-hero-display"),
          ).backgroundImage,
        };
      });
    let result = await measure();
    assert.equal(result.overlap, false, JSON.stringify({ c, result }));
    assert.equal(result.overflow, false, JSON.stringify(c));
    assert.ok(
      result.cards.every((r) => r.x >= 0 && r.right <= c.width),
      JSON.stringify({ c, result }),
    );
    if (c.width < 1024) assert.equal(result.background, "none");
    const search = hero.locator("input[name=q]");
    await search.focus();
    await expect(search).toBeFocused();
    await search.fill("Bulbasaur");
    await expect(hero.locator(".troc-hero-actions a").first()).toHaveAttribute(
      "href",
      /search/,
    );
    await expect(hero.locator(".troc-hero-actions a").last()).toHaveAttribute(
      "href",
      /founding-sellers/,
    );
    if (c.motion === "no-preference") {
      const stage = hero.locator(".troc-stack-stage");
      await stage.scrollIntoViewIfNeeded();
      const b = await stage.boundingBox();
      await page.mouse.move(b.x + 2, b.y + 2);
      await page.waitForTimeout(500);
      result = await measure();
      assert.equal(result.overlap, false);
      await page.mouse.move(b.x + b.width - 2, b.y + b.height - 2);
      await page.waitForTimeout(500);
      result = await measure();
      assert.equal(result.overlap, false);
    }
    await search.evaluate((e) => e.blur());
    if (
      [390, 834, 1024, 1672, 3440].includes(c.width) &&
      c.lang === "en" &&
      c.motion === "reduce"
    )
      await hero.screenshot({
        path: `verification/hero-responsive-after-${c.width}.jpg`,
      });
    if (c.width === 390 && c.lang === "fr") {
      await search.press("Enter");
      await page.waitForURL(/\/search\?/);
      assert.equal(new URL(page.url()).searchParams.get("q"), "Bulbasaur");
      assert.equal(new URL(page.url()).searchParams.get("lang"), "fr");
    }
    rows.push({ ...c, result, status: "PASS" });
    await page.close();
  }
  await fs.writeFile(
    "verification/hero-responsive-after.json",
    JSON.stringify(rows, null, 2),
  );
  console.log(
    `${rows.length} responsive geometry, locale/theme, controls and motion cases PASS`,
  );
} finally {
  await browser.close();
}
