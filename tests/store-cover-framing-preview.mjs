import { chromium } from "@playwright/test";
import fs from "node:fs/promises";
import assert from "node:assert/strict";
const browser = await chromium.launch({ channel: "chrome", headless: true });
const results = [];
for (const [width, locale, theme] of [
  [1672, "en", "dark"],
  [390, "fr", "light"],
]) {
  const page = await browser.newPage({
    viewport: { width, height: 941 },
    deviceScaleFactor: width === 1672 ? 2 : 1,
    reducedMotion: "reduce",
  });
  await page.addInitScript(
    ({ locale, theme }) => {
      globalThis.localStorage.setItem("troc.locale", locale);
      globalThis.localStorage.setItem("troc.theme", theme);
    },
    { locale, theme },
  );
  await page.goto(`http://127.0.0.1:4313/?lang=${locale}`);
  await page.locator(".troc-community-grid").waitFor();
  const hero = await page.evaluate(async () => {
    const e = document.querySelector(".troc-cinematic-hero");
    const src = globalThis
      .getComputedStyle(e)
      .getPropertyValue("--hero-image")
      .match(/url\("?(.*?)"?\)/)[1];
    const im = new globalThis.Image();
    im.src = src;
    await im.decode();
    return { src, width: im.naturalWidth, height: im.naturalHeight };
  });
  assert.equal(hero.width, 3344);
  assert.equal(hero.height, 1882);
  if (width === 1672)
    await page.screenshot({ path: "verification/hero-upscale-desktop-2x.png" });
  const cards = page.locator(".troc-seller-preview");
  const links = await cards.evaluateAll((es) =>
    es.map((e) => e.getAttribute("href")),
  );
  assert.equal(links.length, 3);
  await page.locator(".troc-community-grid").scrollIntoViewIfNeeded();
  await page
    .locator(".troc-community-grid img")
    .evaluateAll((es) =>
      Promise.all(es.map((e) => e.decode().catch(() => {}))),
    );
  const frames = await page
    .locator(".troc-seller-preview-cover > img")
    .evaluateAll((es) =>
      es.map((e) => ({
        w: e.clientWidth,
        h: e.clientHeight,
        fit: globalThis.getComputedStyle(e).objectFit,
        loaded: e.naturalWidth > 0,
      })),
    );
  assert.equal(new Set(frames.map((f) => f.h)).size, 1);
  assert.ok(frames.every((f) => f.fit === "cover" && f.loaded));
  await page
    .locator(".troc-community-grid")
    .screenshot({ path: `verification/store-frames-home-${width}.png` });
  for (let i = 0; i < links.length; i++) {
    await page.goto(new URL(links[i], "http://127.0.0.1:4313").href);
    await page.locator(".troc-store-cover > img").evaluate((e) => e.decode());
    const frame = await page.locator(".troc-store-cover").evaluate((e) => {
      const im = e.querySelector("img");
      return {
        w: e.clientWidth,
        iw: im.clientWidth,
        fit: globalThis.getComputedStyle(im).objectFit,
        overflow: document.documentElement.scrollWidth > innerWidth,
      };
    });
    assert.equal(frame.w, frame.iw);
    assert.equal(frame.fit, "cover");
    assert.equal(frame.overflow, false);
    await page
      .locator(".troc-store-hero")
      .screenshot({ path: `verification/store-frame-${i}-${width}.png` });
    results.push({ width, locale, theme, store: i, ...frame });
  }
  results.push({ width, hero, frames });
  await page.close();
}
await fs.writeFile(
  "verification/store-cover-framing.json",
  JSON.stringify(results, null, 2),
);
await browser.close();
console.log(JSON.stringify(results, null, 2));
