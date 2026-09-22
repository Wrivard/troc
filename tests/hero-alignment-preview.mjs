import { chromium } from "@playwright/test";
import fs from "node:fs/promises";
import assert from "node:assert/strict";
const browser = await chromium.launch({ channel: "chrome", headless: true });
const page = await browser.newPage({
  viewport: { width: 1672, height: 941 },
  reducedMotion: "reduce",
});
await page.addInitScript(() => {
  globalThis.localStorage.setItem("troc.locale", "en");
  globalThis.localStorage.setItem("troc.theme", "dark");
});
await page.goto("http://127.0.0.1:4313/?lang=en");
await page.locator(".troc-cinematic-hero").waitFor();
await page.evaluate(() =>
  Promise.all(
    [...document.querySelectorAll(".troc-cinematic-hero img")].map((i) =>
      i.decode().catch(() => {}),
    ),
  ),
);
const metrics = await page.evaluate(() =>
  Object.fromEntries(
    [
      "header",
      "main",
      ".troc-cinematic-hero",
      ".troc-hero-copy",
      ".troc-hero-copy h1",
      ".troc-hero-lead",
      ".troc-hero-support",
      ".troc-hero-search",
      ".troc-hero-actions",
      ".troc-hero-display",
      ".troc-stack-stage",
      '.troc-stack-card[data-layer="0"]',
      '.troc-stack-card[data-layer="1"]',
      '.troc-stack-card[data-layer="2"]',
      ".troc-hero-benefits",
      ".troc-hero-closing",
    ].map((s) => {
      const e = document.querySelector(s),
        r = e.getBoundingClientRect(),
        c = globalThis.getComputedStyle(e);
      return [
        s,
        {
          x: r.x,
          y: r.y,
          width: r.width,
          height: r.height,
          font: c.fontSize,
          background: c.backgroundPosition,
        },
      ];
    }),
  ),
);
assert.equal(metrics[".troc-cinematic-hero"].y, metrics.header.height);
assert.equal(metrics[".troc-hero-search"].width, 680);
assert.ok(Math.abs(metrics['.troc-stack-card[data-layer="0"]'].y - 178) < 5);
assert.ok(Math.abs(metrics[".troc-hero-search"].y - 525) < 5);
assert.ok(Math.abs(metrics[".troc-hero-closing"].y - 888) < 5);
console.log(metrics);
await fs.writeFile(
  "verification/hero-alignment-final.json",
  JSON.stringify(metrics, null, 2),
);
await page.screenshot({ path: "verification/hero-alignment-final.png" });
await browser.close();
