import { chromium, expect } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";
import assert from "node:assert/strict";
import { writeFile } from "node:fs/promises";
const origin = "http://localhost:5175";
const fixture = await (
  await globalThis.fetch(origin + "/api/test-fixture")
).json();
const listings = fixture.listings.filter(
  (l) => l.cents === 25 && l.sellerId === fixture.sellers[0].id,
);
const browser = await chromium.launch({ channel: "msedge", headless: true });
const results = [];
async function audit(page, label) {
  assert.ok(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth,
    ),
    label + " overflow",
  );
  const violations = (
    await new AxeBuilder({ page })
      .withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa"])
      .analyze()
  ).violations;
  assert.deepEqual(
    violations.map((v) => ({ id: v.id, nodes: v.nodes.map((n) => n.target) })),
    [],
    label,
  );
}
try {
  let index = 0;
  for (const width of [390, 768, 1280])
    for (const lang of ["en", "fr"])
      for (const theme of ["dark", "light"]) {
        const context = await browser.newContext({
          viewport: { width, height: 900 },
          reducedMotion: "reduce",
        });
        const page = await context.newPage(),
          errors = [];
        page.on("pageerror", (e) => errors.push(e.message));
        const offer = listings[index++ % listings.length];
        await page.goto(
          origin +
            `/product/${offer.slug}?variantId=${offer.variantId}&lang=${lang}&theme=${theme}`,
        );
        await page
          .getByRole("button", {
            name: lang === "en" ? "Add to cart" : "Ajouter au panier",
            exact: true,
          })
          .first()
          .click();
        await page.goto(origin + `/cart?lang=${lang}&theme=${theme}`);
        await expect(page.locator(".troc-cart-item").first()).toBeVisible();
        await audit(page, "cart");
        // Exercise under-minimum seller and recovery through the server quote, then a 20-card promotion.
        const quantity = page.locator(".troc-cart-item input").first();
        await quantity.fill("20");
        await quantity.press("Tab");
        await expect(page.locator(".troc-cart-group")).toContainText(
          lang === "en" ? "Promotions" : "Promotions",
        );
        await page.goto(origin + `/smart-cart?lang=${lang}&theme=${theme}`);
        await page
          .getByRole("button", {
            name:
              lang === "en"
                ? "Optimize landed cost"
                : "Optimiser le coût total",
            exact: true,
          })
          .click();
        await expect(page.locator(".troc-smart-cart")).toBeVisible();
        await audit(page, "smart");
        await page
          .getByRole("button", {
            name: lang === "en" ? "Use this cart" : "Utiliser ce panier",
            exact: true,
          })
          .click();
        await page.goto(origin + `/checkout?lang=${lang}&theme=${theme}`);
        await expect(page.locator('input[name="recipient"]')).toBeVisible();
        for (const [name, value] of Object.entries({
          recipient: "Demo Buyer",
          line1: "1 Test Street",
          city: "Toronto",
          postalCode: "M5V 1A1",
        }))
          await page.locator(`input[name="${name}"]`).fill(value);
        await audit(page, "checkout");
        await page.screenshot({
          path: `verification/commerce-checkout-${width}-${lang}-${theme}.png`,
          fullPage: true,
        });
        await page
          .getByRole("button", {
            name:
              lang === "en"
                ? "Place simulated order — no charge"
                : "Passer la commande simulée — sans frais",
            exact: true,
          })
          .click();
        await expect(page).toHaveURL(/\/account\/orders\/[a-f0-9-]+/);
        await expect(
          page.locator("main").getByRole("heading", { level: 2 }).first(),
        ).toBeVisible();
        await audit(page, "buyer-order");
        await page.screenshot({
          path: `verification/commerce-order-${width}-${lang}-${theme}.png`,
          fullPage: true,
        });
        await context.addCookies([
          { name: "test_role", value: "seller", url: origin },
        ]);
        await page.goto(origin + `/seller/orders?lang=${lang}&theme=${theme}`);
        await page.locator("main li a").first().click();
        await expect(
          page.getByRole("button", {
            name: lang === "en" ? "Mark shipped" : "Marquer comme expédiée",
            exact: true,
          }),
        ).toBeVisible();
        await audit(page, "seller-order");
        await page
          .getByRole("button", {
            name: lang === "en" ? "Mark shipped" : "Marquer comme expédiée",
            exact: true,
          })
          .click();
        await expect(
          page.locator("main").getByRole("heading", { level: 2 }),
        ).toContainText(lang === "en" ? "Shipped" : "Expédiée");
        assert.deepEqual(errors, []);
        results.push({
          width,
          lang,
          theme,
          flow: "product → cart → promotion → Smart Cart → checkout → buyer order → seller fulfillment",
          accessibility: "passed",
        });
        console.log(`Commerce verified ${width}/${lang}/${theme}`);
        await context.close();
      }
  await writeFile(
    new URL("../verification/commerce-browser.json", import.meta.url),
    JSON.stringify(results, null, 2),
  );
} finally {
  await browser.close();
}
