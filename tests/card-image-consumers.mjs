import { chromium, expect } from "@playwright/test";
import assert from "node:assert/strict";
import fs from "node:fs/promises";
const browser = await chromium.launch({ channel: "chrome", headless: true });
const results = [];
try {
  for (const [width, lang, theme] of [
    [1440, "en", "dark"],
    [390, "fr", "light"],
  ]) {
    const page = await browser.newPage({
      viewport: { width, height: 1100 },
      reducedMotion: "reduce",
    });
    await page.addInitScript(
      ({ lang, theme }) => {
        globalThis.localStorage.setItem("troc.theme", theme);
        globalThis.localStorage.setItem("troc.locale", lang);
      },
      { lang, theme },
    );
    await page.goto(`http://127.0.0.1:4313/?lang=${lang}`);
    const shelf = page.locator(".troc-editorial-catalog--shelf");
    await expect(shelf).toBeVisible();
    await shelf.scrollIntoViewIfNeeded();
    for (const img of await shelf.locator("img").all())
      await img.evaluate((e) => e.decode());
    await shelf.screenshot({
      path: `verification/card-corners-shelf-${width}.jpg`,
    });
    const geometry = await shelf.locator("img").evaluateAll((es) =>
      es.map((e) => {
        const b = e.getBoundingClientRect(),
          p = e.parentElement.getBoundingClientRect();
        return {
          alt: e.alt,
          ratio: b.width / b.height,
          natural: e.naturalWidth / e.naturalHeight,
          width: b.width,
          height: b.height,
          filled: b.width > p.width * 0.75 || b.height > p.height * 0.75,
          contained: b.width <= p.width + 0.5 && b.height <= p.height + 0.5,
        };
      }),
    );
    for (const item of geometry) {
      assert.ok(item.contained);
      assert.ok(item.filled, JSON.stringify(item));
      assert.ok(
        Math.abs(item.ratio - item.natural) < 0.015,
        JSON.stringify(item),
      );
    }
    assert.equal(
      await page.evaluate(
        () => document.documentElement.scrollWidth > innerWidth,
      ),
      false,
    );
    results.push({ width, lang, theme, geometry });
    await page.close();
  }
  const page = await browser.newPage({
    viewport: { width: 1200, height: 1100 },
    reducedMotion: "reduce",
  });
  await page.goto("http://127.0.0.1:4313/style-guide#page=editorial");
  await expect(page.locator(".troc-editorial-catalog").first()).toBeVisible();
  for (const img of await page
    .locator(".troc-editorial-catalog")
    .first()
    .locator("img")
    .all()) {
    await img.scrollIntoViewIfNeeded();
    await img.evaluate((e) => e.decode());
  }
  await page
    .locator(".troc-editorial-catalog")
    .first()
    .screenshot({ path: "verification/card-corners-style-guide.jpg" });
  // Isolated shape coverage uses production CSS and untouched originals; synthetic
  // white borders/landscape/portrait are diagnostic fixtures, never catalog data.
  await page.evaluate(() => {
    const main = document.createElement("main");
    main.id = "shapes";
    main.style.cssText =
      "display:flex;gap:20px;padding:30px;background:#191919";
    const svg = (w, h) =>
      `data:image/svg+xml,${encodeURIComponent(`<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}"><rect width="100%" height="100%" fill="white"/><rect x="10%" y="10%" width="80%" height="80%" fill="#c52939"/></svg>`)}`;
    for (const [name, src, w, h] of [
      ["magic", "/catalog-art/1e623432536b0f29b6fd-488.webp", 488, 680],
      ["transparent", "/catalog-art/07d7b019c516e22f3487-600.webp", 600, 825],
      ["white-border", svg(630, 880), 630, 880],
      ["landscape", svg(880, 630), 880, 630],
      ["portrait", svg(400, 1000), 400, 1000],
    ]) {
      const col = document.createElement("section");
      col.style.width = "190px";
      const title = document.createElement("p");
      title.textContent = name;
      title.style.color = "white";
      col.append(title);
      for (const size of [32, 96, 180]) {
        const frame = document.createElement("span");
        frame.className = "troc-card-image";
        frame.style.cssText = `width:${size}px;margin-bottom:20px`;
        const img = new globalThis.Image();
        img.src = src;
        img.width = w;
        img.height = h;
        img.alt = name;
        img.style.setProperty("--troc-card-art-ratio", w / h);
        frame.append(img);
        col.append(frame);
      }
      main.append(col);
    }
    document.body.replaceChildren(main);
  });
  await page
    .locator("img")
    .evaluateAll((es) => Promise.all(es.map((e) => e.decode())));
  const shapes = await page.locator("img").evaluateAll((es) =>
    es.map((e) => {
      const b = e.getBoundingClientRect(),
        p = e.parentElement.getBoundingClientRect();
      return {
        alt: e.alt,
        ratio: b.width / b.height,
        natural: e.naturalWidth / e.naturalHeight,
        width: b.width,
        height: b.height,
        filled: b.width > p.width * 0.75 || b.height > p.height * 0.75,
        contained: b.width <= p.width + 0.5 && b.height <= p.height + 0.5,
      };
    }),
  );
  for (const item of shapes) {
    assert.ok(item.contained, JSON.stringify(item));
    assert.ok(
      Math.abs(item.ratio - item.natural) < 0.015,
      JSON.stringify(item),
    );
  }
  await page.screenshot({ path: "verification/card-corners-shapes.jpg" });
  results.push({ shapes });
  await fs.writeFile(
    "verification/card-corners-consumers.json",
    JSON.stringify(results, null, 2),
  );
  console.log(
    "PASS shelf EN/FR dark/light geometry and15 image shape/size cases",
  );
} finally {
  await browser.close();
}
