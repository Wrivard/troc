import process from "node:process";
import { chromium, expect } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";
import assert from "node:assert/strict";
import { writeFile } from "node:fs/promises";

const origin = process.env.TROC_TEST_ORIGIN ?? "http://localhost:5173";
const catalog = await (
  await globalThis.fetch(origin + "/api/catalog/page?path=/games/pokemon")
).json();
const product = catalog.results.find((r) => r.product.images?.length).product;
const set = catalog.sets.find((s) => s.id === product.setId);
const routes = [
  "/",
  "/search",
  "/games/pokemon",
  "/games/magic",
  "/games/yu-gi-oh",
  "/games/one-piece",
  "/games/riftbound",
  `/sets/${set.slug}`,
  `/product/${product.slug}`,
  "/store/cartes-du-nord",
  "/sell",
  "/founding-sellers",
  "/about",
  "/developers",
  "/help",
  "/condition-guide",
  "/cart",
  "/smart-cart",
  "/checkout",
  "/sign-in",
  "/sign-up",
  "/account",
  "/account/settings",
  "/account/orders",
  "/account/orders/00000000-0000-0000-0000-000000000000",
  "/order-confirmation/00000000-0000-0000-0000-000000000000",
  ...[
    "messages",
    "notifications",
    "wishlist",
    "price-alerts",
    "following",
    "credit",
  ].map((s) => "/account/" + s),
  "/collection",
  "/collection/pokemon",
  "/collection/pokemon/demo-set",
  "/want-lists",
  "/want-lists/demo",
  "/seller",
  ...[
    "apply",
    "inventory",
    "orders",
    "orders/00000000-0000-0000-0000-000000000000",
    "promotions",
    "offers",
    "analytics",
    "storefront",
    "team",
    "settings",
    "plan",
    "buylist",
  ].map((s) => "/seller/" + s),
];
const browser = await chromium.launch({ channel: "msedge", headless: true });
const results = [];
try {
  for (const width of [390, 768, 1280, 1920])
    for (const [lang, theme] of [
      ["en", "dark"],
      ["fr", "light"],
    ]) {
      const context = await browser.newContext({
        viewport: { width, height: 900 },
        reducedMotion: "reduce",
      });
      const page = await context.newPage();
      const errors = [];
      page.on("pageerror", (e) => errors.push(e.message));
      for (const route of routes) {
        await page.goto(origin + route + `?lang=${lang}&theme=${theme}`);
        await expect(page.locator("main h1")).toBeVisible();
        await expect(page.locator("footer")).toBeAttached();
        await page.evaluate(() => document.fonts.ready);
        assert.ok(
          await page.evaluate(
            () => document.documentElement.scrollWidth <= innerWidth,
          ),
          `${route} ${width} overflow`,
        );
        await expect(page.locator("html")).toHaveAttribute(
          "lang",
          `${lang}-CA`,
        );
        await expect(page.locator("html")).toHaveAttribute(
          "data-theme",
          `troc-${theme}`,
        );
        // Wait for the requested theme and its font paint before contrast measurement.
        await page.evaluate(
          () =>
            new Promise((resolve) =>
              globalThis.requestAnimationFrame(() =>
                globalThis.requestAnimationFrame(resolve),
              ),
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
            nodes: v.nodes.map((n) => n.target),
          })),
          [],
          `${route} ${width} ${lang} ${theme}`,
        );
        assert.deepEqual(errors, [], route);
        if (
          [
            "/",
            "/search",
            "/cart",
            "/sell",
            "/collection",
            "/sign-in",
            `/product/${product.slug}`,
            "/store/cartes-du-nord",
          ].includes(route)
        ) {
          const name = route === "/" ? "home" : route.split("/")[1];
          for (const img of await page.locator("main img").all()) {
            if (!(await img.isVisible())) continue;
            await img.scrollIntoViewIfNeeded();
            await expect(img).toHaveJSProperty("complete", true);
            await expect(img).not.toHaveJSProperty("naturalWidth", 0);
          }
          await page.screenshot({
            path: `verification/polish-${name}-${width}-${lang}-${theme}.png`,
            fullPage: true,
          });
        }
        results.push({ route, width, lang, theme, passed: true });
      }
      // The hero's utility is real: keyboard submit carries a search into the catalog.
      await page.goto(origin + `/?lang=${lang}&theme=${theme}`);
      const search = page.locator('main input[name="q"]');
      await search.fill("Pidgey");
      await search.press("Enter");
      await expect(page).toHaveURL(/\/search\?.*q=Pidgey/);
      await expect(page.locator("main h1")).toBeVisible();
      await context.close();
      console.log(
        `Passed ${routes.length} routes at ${width} ${lang}/${theme}`,
      );
    }
  await writeFile(
    "verification/design-polish-browser.json",
    JSON.stringify({ origin, results }, null, 2),
  );
  console.log(`Passed ${results.length} responsive route checks`);
} finally {
  await browser.close();
}
