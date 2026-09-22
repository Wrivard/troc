import { chromium, expect } from "@playwright/test";
import assert from "node:assert/strict";
import { writeFile } from "node:fs/promises";
// Original synthetic fixtures prove dimensions/selection only, not publisher artwork readiness.
const browser = await chromium.launch({ channel: "msedge", headless: true });
const results = [];
try {
  for (const width of [390, 768, 1280])
    for (const lang of ["en", "fr"])
      for (const theme of ["dark", "light"]) {
        const context = await browser.newContext({
          viewport: { width, height: 900 },
          deviceScaleFactor: 1,
        });
        const page = await context.newPage();
        let release;
        const gate = new Promise((resolve) => {
          release = resolve;
        });
        await page.route("**/catalog-art/fixture-*.svg", async (route) => {
          await gate;
          const pathname = new URL(route.request().url()).pathname;
          const w = Number(pathname.match(/-(245|600)\.svg$/)[1]);
          const sealed = pathname.includes("sealed");
          const h = sealed ? Math.round(w * 0.6) : Math.round((w * 88) / 63);
          await route.fulfill({
            contentType: "image/svg+xml",
            body: `<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}" viewBox="0 0 ${w} ${h}"><rect width="${w}" height="${h}" fill="#ddd"/><rect x="10" y="10" width="${w - 20}" height="${h - 20}" fill="#eee" stroke="#111"/><text x="20" y="40" fill="#111">${sealed ? "SEALED TEST" : "IMAGE TEST"} ${pathname.includes("back") ? "BACK" : "FRONT"}</text></svg>`,
          });
        });
        await page.route("**/api/catalog/page?*", async (route) => {
          const response = await route.fetch();
          const data = await response.json();
          const decorate = (p) => ({
            ...p,
            images: [],
            variants: p.variants.map((v) => ({
              ...v,
              images: ["front", "back"].map((side) => {
                const prefix =
                  "/catalog-art/fixture-" + p.type + "-" + v.id + "-" + side;
                return {
                  id: v.id + "-" + side,
                  side,
                  url: prefix + "-600.svg",
                  sources: [245, 600].map((w) => ({
                    url: prefix + "-" + w + ".svg",
                    width: w,
                  })),
                  width: 600,
                  height: p.type === "sealed" ? 360 : 838,
                  provenance: {
                    provider: "original synthetic test",
                    externalId: "test",
                    sourceUrl: "https://example.invalid/test",
                    license: "original fixture",
                    capturedAt: "2026-09-22T00:00:00Z",
                  },
                };
              }),
            })),
          });
          data.results = data.results.map((r) => ({
            ...r,
            product: decorate(r.product),
          }));
          if (data.product) data.product = decorate(data.product);
          await route.fulfill({ response, json: data });
        });
        await page.goto(`http://localhost:5173/?lang=${lang}&theme=${theme}`, {
          waitUntil: "domcontentloaded",
        });
        const frame = page
          .locator("[data-catalog-artwork] .troc-card-image")
          .first();
        await expect(frame.locator(".troc-card-image-skeleton")).toBeVisible();
        const before = await frame.boundingBox();
        release();
        await expect(frame.locator(".troc-card-image-skeleton")).toHaveCount(0);
        const after = await frame.boundingBox();
        assert.equal(after.height, before.height);
        const chosen = await frame
          .locator("img")
          .evaluate((img) => img.currentSrc);
        assert.ok(
          chosen.endsWith(width === 1280 ? "-600.svg" : "-245.svg"),
          chosen,
        );
        for (const path of [
          "/product/pokemon-northern-spark",
          "/product/pokemon-collectors-box",
        ]) {
          await page.goto(
            `http://localhost:5173${path}?lang=${lang}&theme=${theme}`,
          );
          const img = page.locator("[data-catalog-artwork] img").first();
          await expect(img).toBeVisible();
          await expect
            .poll(() => img.evaluate((n) => n.complete && n.naturalWidth > 0))
            .toBe(true);
          assert.equal(
            await img.evaluate((n) => globalThis.getComputedStyle(n).objectFit),
            "contain",
          );
          const original = await img.getAttribute("src");
          if (path.includes("spark")) {
            await page
              .getByRole("link", {
                name:
                  lang === "fr" ? "Japonais · Standard" : "Japanese · Standard",
                exact: true,
              })
              .click();
            await expect(img).not.toHaveAttribute("src", original);
            await expect(img).toHaveAttribute("src", /front-600\.svg$/);
          } else {
            assert.ok(
              await img.evaluate((n) => n.naturalWidth > n.naturalHeight),
            );
          }
          const box = await img.boundingBox();
          await page
            .getByRole("button", {
              name: lang === "fr" ? "Verso" : "Back",
              exact: true,
            })
            .click();
          await expect(img).toHaveAttribute("src", /back-600\.svg$/);
          assert.equal((await img.boundingBox()).height, box.height);
          assert.ok(
            await page.evaluate(
              () => document.documentElement.scrollWidth <= innerWidth,
            ),
          );
        }
        results.push({
          width,
          lang,
          theme,
          loadingStable: true,
          responsiveSelection: chosen.split("/").at(-1),
          variantSwitch: true,
          sealedContained: true,
        });
        await context.close();
      }
  await writeFile(
    new URL("../verification/phase-a-image-states.json", import.meta.url),
    JSON.stringify(
      { scope: "Synthetic fixture behavior, not live art acceptance", results },
      null,
      2,
    ),
  );
  console.log("12 EN/FR theme/viewport image-state combinations passed");
} finally {
  await browser.close();
}
