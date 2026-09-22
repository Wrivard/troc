import { chromium, expect } from "@playwright/test";
import assert from "node:assert/strict";
import { readFile, writeFile } from "node:fs/promises";
// Local reference artwork is used only in browser test responses, never imported into the live catalog.
const art = await readFile(
  new URL(
    "../artifacts/troc-design-system/src/assets/cards/charizard-ex.webp",
    import.meta.url,
  ),
);
const other = await readFile(
  new URL(
    "../artifacts/troc-design-system/src/assets/cards/pikachu.webp",
    import.meta.url,
  ),
);
const browser = await chromium.launch({ channel: "msedge", headless: true });
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
        await page.route("**/catalog-art/test-*.webp", (route) =>
          route.fulfill({
            contentType: "image/webp",
            body: route.request().url().includes("back") ? other : art,
          }),
        );
        await page.route("**/api/catalog/page?*", async (route) => {
          const response = await route.fetch();
          const data = await response.json();
          const image = (side) => ({
            id: "test-" + side,
            side,
            url: "/catalog-art/test-" + side + ".webp",
            sources: [
              { url: "/catalog-art/test-" + side + ".webp", width: 600 },
            ],
            width: 600,
            height: 825,
            provenance: {
              provider: "local browser fixture",
              externalId: "fixture",
              sourceUrl: "https://example.invalid",
              license: "style-guide test only",
              capturedAt: "2026-09-22T00:00:00Z",
            },
          });
          const illustrate = (p) => ({
            ...p,
            images: [image("front"), image("back")],
          });
          data.results = data.results.map((r) => ({
            ...r,
            product: illustrate(r.product),
          }));
          if (data.product) data.product = illustrate(data.product);
          await route.fulfill({ response, json: data });
        });
        for (const path of [
          "/",
          "/search",
          "/games/pokemon",
          "/sets/pokemon-demo-set",
          "/product/pokemon-northern-spark",
          "/store/cartes-du-nord",
        ]) {
          await page.goto(
            "http://localhost:5173" +
              path +
              "?lang=" +
              lang +
              "&theme=" +
              theme,
          );
          const image = page.locator("[data-catalog-artwork] img").first();
          await image.scrollIntoViewIfNeeded();
          await expect(image).toBeVisible();
          await expect
            .poll(() => image.evaluate((n) => n.complete && n.naturalWidth > 0))
            .toBe(true);
          assert.ok(await image.getAttribute("srcset"));
          assert.ok(await image.getAttribute("sizes"));
          assert.ok(
            await page.evaluate(
              () => document.documentElement.scrollWidth <= innerWidth,
            ),
          );
          await expect(
            page.locator(".troc-site-header-brand a"),
          ).toHaveAttribute("href", "/?lang=" + lang);
          if (path.startsWith("/product")) {
            const frame = page
              .locator("[data-catalog-artwork] .troc-card-image")
              .first();
            const before = await frame.boundingBox();
            await page
              .getByRole("button", {
                name: lang === "fr" ? "Verso" : "Back",
                exact: true,
              })
              .click();
            await expect(image).toHaveAttribute(
              "src",
              "/catalog-art/test-back.webp",
            );
            await expect
              .poll(() =>
                image.evaluate((n) => n.complete && n.naturalWidth > 0),
              )
              .toBe(true);
            const after = await frame.boundingBox();
            assert.equal(after.height, before.height);
          }
          results.push({
            path,
            width,
            lang,
            theme,
            loaded: true,
            overflow: false,
          });
        }
        for (const path of ["/sign-in", "/style-guide"]) {
          await page.goto(
            "http://localhost:5173" +
              path +
              "?lang=" +
              lang +
              "&theme=" +
              theme,
          );
          if (path === "/style-guide" && width <= 900)
            await page.locator(".ds-mobile-menu").click();
          const logo =
            path === "/style-guide"
              ? page.locator(".ds-sidebar-brand a:visible").first()
              : page.locator('header a[aria-label="TROC"]');
          await logo.click();
          await expect(page).toHaveURL("http://localhost:5173/?lang=" + lang);
          await page.locator(".troc-site-header").waitFor();
        }
        // Simulate broken artwork; frame must remain stable and retain a localized fallback.
        await page.unroute("**/catalog-art/test-*.webp");
        await page.route("**/catalog-art/test-*.webp", (route) =>
          route.abort(),
        );
        await page.goto(
          "http://localhost:5173/product/pokemon-northern-spark?lang=" +
            lang +
            "&theme=" +
            theme,
        );
        await expect(
          page
            .locator("[data-catalog-artwork] .troc-card-image--missing")
            .first(),
        ).toBeVisible();
        assert.ok(
          await page.evaluate(
            () => document.documentElement.scrollWidth <= innerWidth,
          ),
        );
        await context.close();
      }
  await writeFile(
    new URL("../verification/m25-image-browser-results.json", import.meta.url),
    JSON.stringify(
      {
        scope:
          "Local injected reference artwork; production provider sample pending approval",
        cases: results,
      },
      null,
      2,
    ),
  );
  console.log(
    results.length +
      " image route cases passed; logo navigation and failure fallback passed",
  );
} finally {
  await browser.close();
}
