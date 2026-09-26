import { chromium } from "@playwright/test";
import fs from "node:fs/promises";
const browser = await chromium.launch({ channel: "chrome", headless: true });
const rows = [];
try {
  for (const width of [390, 767, 1023, 1024, 1672, 2560, 3440]) {
    const page = await browser.newPage({
      viewport: { width, height: 1000 },
      reducedMotion: "reduce",
    });
    await page.goto("http://127.0.0.1:4313/?lang=en");
    await page
      .locator(".troc-cinematic-hero img")
      .evaluateAll((es) => Promise.all(es.map((e) => e.decode())));
    const row = await page.evaluate(() => {
      const boxes = (s) =>
        [...document.querySelectorAll(s)].map((e) => {
          const r = e.getBoundingClientRect();
          return {
            x: r.x,
            y: r.y,
            right: r.right,
            bottom: r.bottom,
            width: r.width,
            height: r.height,
          };
        });
      const cards = boxes(".troc-cinematic-hero .troc-stack-card"),
        benefits = boxes(".troc-hero-benefits")[0];
      return {
        width: globalThis.innerWidth,
        cards,
        benefits,
        overlap: Math.max(...cards.map((c) => c.bottom)) > benefits.y,
        overflow: document.documentElement.scrollWidth > globalThis.innerWidth,
      };
    });
    rows.push(row);
    if ([390, 2560].includes(width))
      await page
        .locator(".troc-cinematic-hero")
        .screenshot({
          path: `verification/hero-responsive-before-${width}.jpg`,
        });
    await page.close();
  }
  await fs.writeFile(
    "verification/hero-responsive-before.json",
    JSON.stringify(rows, null, 2),
  );
  console.log(
    rows.map(({ width, overlap, overflow, cards, benefits }) => ({
      width,
      overlap,
      overflow,
      cardBottom: Math.max(...cards.map((c) => c.bottom)),
      benefitsY: benefits.y,
    })),
  );
} finally {
  await browser.close();
}
