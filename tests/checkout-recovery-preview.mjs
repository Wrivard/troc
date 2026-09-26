import process from "node:process";
import { chromium, expect } from "@playwright/test";
import assert from "node:assert/strict";

const browser = await chromium.launch({ channel: "chrome", headless: true });
const seller = {
  id: "00000000-0000-4000-8006-000000000000",
  name: "Cartes du Nord",
  slug: "cartes-du-nord",
  minimumCents: 0,
  handlingDays: 1,
  reputation: 0,
  badges: [],
  freeShippingCents: null,
  promotions: [],
};
const listing = {
  id: "fixture-line",
  sellerId: seller.id,
  name: { en: "Pidgey", fr: "Pidgey" },
  slug: "pokemon-pidgey-05c50488",
  variantId: "fixture-variant",
  language: "en",
  variantKey: "standard",
  collectorNumber: "016",
  condition: "NM",
  productType: "raw_single",
  quantity: 10,
  demo: true,
  imageUrl: null,
};
const serverLines = [{ listingId: listing.id, quantity: 1 }];
const quote = (lines) => {
  const cards = lines.reduce((sum, line) => sum + line.quantity, 0);
  return {
    groups: cards
      ? [
          {
            seller,
            lines: lines.map((line) => ({
              ...line,
              listing,
              unitCents: 5,
              totalCents: line.quantity * 5,
            })),
            cards,
            merchandiseCents: cards * 5,
            discountCents: 0,
            promotionId: null,
            nextPromotion: null,
            minimumRemainingCents: 0,
            freeShippingRemainingCents: null,
            shipping: { serviceId: "fixture", cents: 100, tracked: false },
            totalCents: cards * 5 + 100,
          },
        ]
      : [],
    cards,
    merchandiseCents: cards * 5,
    discountCents: 0,
    shippingCents: cards ? 100 : 0,
    taxCents: 0,
    creditCents: 0,
    totalCents: cards ? cards * 5 + 100 : 0,
    eligible: true,
    demo: true,
    currency: "CAD",
  };
};

const results = [];
try {
  for (const lang of ["en", "fr"]) {
    const page = await browser.newPage({
      viewport: { width: lang === "en" ? 1440 : 390, height: 950 },
    });
    let mode = "checkout",
      calls = [];
    await page.addInitScript(
      (lines) => localStorage.setItem("troc.cart.v1", JSON.stringify(lines)),
      serverLines,
    );
    await page.route("**/api/commerce/**", async (route) => {
      const req = route.request(),
        path = new URL(req.url()).pathname;
      if (path.endsWith("/quote"))
        return route.fulfill({ json: quote(serverLines) });
      if (path.endsWith("/cart") && req.method() === "GET")
        return route.fulfill({
          json: { lines: serverLines, coupon: "", creditCents: 0 },
        });
      if (path.endsWith("/cart") && req.method() === "PUT")
        return route.fulfill({
          status: mode === "cart" ? 503 : 200,
          json:
            mode === "cart" ? { code: "service_unavailable" } : { ok: true },
        });
      if (path.endsWith("/checkout")) {
        calls.push(req.postDataJSON());
        return route.fulfill({
          status: 503,
          json: { code: "service_unavailable" },
        });
      }
      return route.fulfill({ json: { ok: true } });
    });
    await page.goto("http://127.0.0.1:4313/checkout?lang=" + lang);
    const form = page.locator("form"),
      pay = form.locator('button[type="submit"]');
    const fields = {
      recipient: "Test Buyer",
      line1: "1 Test Street",
      line2: "Unit 2",
      city: "Ottawa",
      postalCode: "K1A 0B1",
    };
    for (const [name, value] of Object.entries(fields))
      await form.locator('[name="' + name + '"]').fill(value);
    await expect(pay).toBeEnabled();
    await pay.click();
    await expect(page.getByRole("alert")).toBeVisible();
    for (const [name, value] of Object.entries(fields))
      await expect(form.locator('[name="' + name + '"]')).toHaveValue(value);
    await expect(pay).toBeEnabled();
    await pay.click();
    await expect.poll(() => calls.length).toBe(2);
    assert.equal(calls[0].idempotencyKey, calls[1].idempotencyKey);
    mode = "cart";
    await pay.click();
    await expect(pay).toBeEnabled();
    assert.equal(calls.length, 2);
    for (const [name, value] of Object.entries(fields))
      await expect(form.locator('[name="' + name + '"]')).toHaveValue(value);
    await form.locator('[name="postalCode"]').fill("90210");
    assert.equal(await form.evaluate((e) => e.checkValidity()), false);
    await form.locator('[name="postalCode"]').fill("k1a 0b1");
    assert.equal(await form.evaluate((e) => e.checkValidity()), true);
    await form.locator('[name="city"]').fill("   ");
    assert.equal(await form.evaluate((e) => e.checkValidity()), false);
    assert.deepEqual(
      await page.evaluate(() =>
        JSON.parse(localStorage.getItem("troc.cart.v1")),
      ),
      serverLines,
    );
    results.push({
      lang,
      addressPreserved: true,
      exactKeyRetry: true,
      cartSaveFailurePreventsCheckout: true,
      postalValidation: true,
      blankCityRejected: true,
      mockedCheckoutAttempts: calls.length,
    });
    await page.close();
  }
  const fs = await import("node:fs");
  fs.mkdirSync("docs/evidence/checkout-recovery", { recursive: true });
  fs.writeFileSync(
    "docs/evidence/checkout-recovery/check.json",
    JSON.stringify(results, null, 2),
  );
  console.log(results);
} finally {
  await browser.close();
}
