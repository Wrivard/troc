import { chromium, expect } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";
import assert from "node:assert/strict";
import { writeFile } from "node:fs/promises";
const origin = "http://localhost:5175";
const fixture = await (
  await globalThis.fetch(origin + "/api/test-fixture")
).json();
const selected = fixture.listings.slice(-100);
const browser = await chromium.launch({ channel: "msedge", headless: true });
const results = [];
try {
  for (const width of [390, 768, 1280])
    for (const count of [5, 20, 50, 100]) {
      const context = await browser.newContext({
        viewport: { width, height: 900 },
        reducedMotion: "reduce",
      });
      const page = await context.newPage();
      await page.goto(origin + "/cart?lang=fr&theme=light");
      await page.evaluate(
        (lines) =>
          globalThis.localStorage.setItem(
            "troc.cart.v1",
            JSON.stringify(lines),
          ),
        selected.slice(0, count).map((l) => ({ listingId: l.id, quantity: 1 })),
      );
      const start = Date.now();
      await page.reload();
      await expect(page.locator(".troc-cart-group").first()).toBeVisible();
      assert.ok((await page.locator(".troc-cart-item").count()) <= 30);
      assert.ok(
        await page.evaluate(
          () => document.documentElement.scrollWidth <= innerWidth,
        ),
      );
      const errors = (
        await new AxeBuilder({ page })
          .withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa"])
          .analyze()
      ).violations;
      assert.deepEqual(
        errors.map((e) => e.id),
        [],
      );
      if (count === 100)
        await page.screenshot({
          path: `verification/commerce-100-${width}.png`,
          fullPage: true,
        });
      results.push({
        width,
        lines: count,
        renderedRows: await page.locator(".troc-cart-item").count(),
        loadMs: Date.now() - start,
      });
      await context.close();
    }
  const context = await browser.newContext({
    viewport: { width: 390, height: 900 },
    reducedMotion: "reduce",
  });
  const page = await context.newPage();
  const offer = fixture.listings.find(
    (l) => l.sellerId === fixture.sellers[2].id && l.cents === 35,
  );
  assert.ok(offer);
  await page.goto(origin + "/cart?lang=fr&theme=light");
  await page.evaluate(
    (id) =>
      globalThis.localStorage.setItem(
        "troc.cart.v1",
        JSON.stringify([{ listingId: id, quantity: 1 }]),
      ),
    offer.id,
  );
  await page.reload();
  await expect(
    page.locator(".troc-market-progress-help").first(),
  ).toContainText("Ajoutez");
  const sameSet = await page
    .getByRole("link", { name: "Cartes de la même série", exact: true })
    .getAttribute("href");
  assert.ok(sameSet.includes("set=" + offer.setSlug));
  await page
    .locator("main").getByRole("link", { name: "Cartes à moins de 1 $", exact: true })
    .click();
  await expect(page).toHaveURL(/\/store\/.*max=99/);
  await page.goto(origin + "/cart?lang=fr&theme=light");
  const quantity = page.locator(".troc-cart-item input").first();
  await quantity.fill("15");
  await quantity.press("Tab");
  await expect(
    page.locator(".troc-market-progress-help").first(),
  ).toContainText("Minimum atteint");
  await expect(
    page.getByRole("button", { name: "Commande simulée", exact: true }),
  ).toBeEnabled();
  await page.screenshot({
    path: "verification/commerce-minimum-mobile-fr.png",
    fullPage: true,
  });
  await context.close();
  await writeFile(
    new URL("../verification/commerce-large.json", import.meta.url),
    JSON.stringify(results, null, 2),
  );
  console.log("Large carts passed: " + results.length);
} finally {
  await browser.close();
}
