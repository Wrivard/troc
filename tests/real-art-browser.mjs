import process from "node:process";
import { chromium, expect } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";
import assert from "node:assert/strict";
import { writeFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
const origin = process.env.TROC_TEST_ORIGIN ?? "http://localhost:5173";
const browser = await chromium.launch({ channel: "msedge", headless: true });
const data = await (
  await globalThis.fetch(
    origin + "/api/catalog/page?path=/games/pokemon&limit=48",
  )
).json();
const product = data.results.find((r) => r.product.images?.length).product;
const set = data.sets.find((s) => s.id === product.setId);
const routes = [
  "/",
  "/search",
  "/games/pokemon",
  "/games/magic",
  "/games/yu-gi-oh",
  "/sets/" + set.slug,
  "/product/" + product.slug,
  "/store/cartes-du-nord",
];
const results = [];
try {
  for (const width of [390, 768, 1280])
    for (const lang of ["en", "fr"])
      for (const theme of ["dark", "light"]) {
        const context = await browser.newContext({
          viewport: { width, height: 900 },
          reducedMotion: "reduce",
        });
        const page = await context.newPage();
        const errors = [];
        page.on("pageerror", (e) => errors.push(e.message));
        for (const path of routes) {
          await page.goto(origin + path + "?lang=" + lang + "&theme=" + theme);
          const images = page.locator("[data-catalog-artwork] img");
          await expect(images.first()).toBeVisible();
          const count = await images.count();
          assert.ok(count > 0);
          for (let i = 0; i < count; i++) {
            const img = images.nth(i);
            await img.scrollIntoViewIfNeeded();
            await expect
              .poll(() => img.evaluate((n) => n.complete && n.naturalWidth > 0))
              .toBe(true);
            assert.ok(
              (await img.getAttribute("src")).startsWith("/catalog-art/"),
            );
          }
          assert.ok(
            await page.evaluate(
              () => document.documentElement.scrollWidth <= innerWidth,
            ),
          );
          const violations = (
            await new AxeBuilder({ page })
              .withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa"])
              .analyze()
          ).violations;
          assert.deepEqual(
            violations.map((v) => ({
              id: v.id,
              targets: v.nodes.map((n) => n.target),
            })),
            [],
          );
          if (path === "/" || path.startsWith("/product/")) {
            await page.evaluate(() => globalThis.scrollTo(0, 0));
            await page.screenshot({
              path: fileURLToPath(
                new URL(
                  "../verification/real-art-" +
                    (path === "/" ? "home" : "product") +
                    "-" +
                    width +
                    "-" +
                    lang +
                    "-" +
                    theme +
                    ".png",
                  import.meta.url,
                ),
              ),
              fullPage: true,
            });
          }
          results.push({
            path,
            width,
            lang,
            theme,
            images: count,
            loaded: true,
            accessibility: "passed",
          });
        }
        assert.deepEqual(errors, []);
        await context.close();
        console.log("Real art verified " + width + "/" + lang + "/" + theme);
      }
  await writeFile(
    new URL("../verification/real-art-browser.json", import.meta.url),
    JSON.stringify({ origin, results }, null, 2),
  );
  console.log("Passed " + results.length + " real-art route cases");
} finally {
  await browser.close();
}
