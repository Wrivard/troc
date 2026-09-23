import { chromium, expect } from "@playwright/test";
import sharp from "sharp";
import assert from "node:assert/strict";
const browser = await chromium.launch({ channel: "chrome", headless: true });
try {
  const page = await browser.newPage({
    viewport: { width: 1440, height: 1100 },
    reducedMotion: "reduce",
  });
  await page.addInitScript(() =>
    globalThis.localStorage.setItem("troc.theme", "dark"),
  );
  await page.goto(
    "http://127.0.0.1:4313/product/magic-angel-s-feather-60304a35?lang=en",
  );
  const image = page.locator(".troc-card-image img").first();
  await expect(image).toBeVisible();
  await image.evaluate((e) => e.decode());
  const frame = image.locator("..");
  const { data, info } = await sharp(await frame.screenshot())
    .removeAlpha()
    .raw()
    .toBuffer({ resolveWithObject: true });
  const n = Math.ceil(info.width * 0.025);
  let white = 0;
  for (let y = 0; y < n; y++)
    for (let x = 0; x < n; x++)
      for (const [px, py] of [
        [x, y],
        [info.width - 1 - x, y],
        [x, info.height - 1 - y],
        [info.width - 1 - x, info.height - 1 - y],
      ]) {
        const i = (py * info.width + px) * 3;
        if (data[i] > 220 && data[i + 1] > 220 && data[i + 2] > 220) white++;
      }
  console.log({
    width: info.width,
    height: info.height,
    whiteCornerPixels: white,
  });
  assert.equal(
    white,
    0,
    "Opaque source background must not appear outside rounded card corners",
  );
} finally {
  await browser.close();
}
