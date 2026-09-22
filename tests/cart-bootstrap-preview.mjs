import { chromium } from "@playwright/test";
import assert from "node:assert/strict";
const drawer = process.argv.includes("--drawer");
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
try {
  const page = await browser.newPage();
  let release;
  const hold = new Promise((resolve) => (release = resolve));
  let puts = 0;
  await page.addInitScript(() => {
    globalThis.localStorage.setItem("troc.locale", "en");
    if (!globalThis.sessionStorage.getItem("cart-fixture-initialized")) {
      globalThis.localStorage.setItem(
        "troc.cart.v1",
        JSON.stringify([{ listingId: "fixture-line", quantity: 1 }]),
      );
      globalThis.sessionStorage.setItem("cart-fixture-initialized", "1");
    }
  });
  await page.route("**/api/commerce/**", async (route) => {
    const req = route.request(),
      path = new URL(req.url()).pathname;
    if (path.endsWith("/cart") && req.method() === "GET")
      return route.fulfill({
        json: { lines: serverLines, coupon: "", creditCents: 0 },
      });
    if (path.endsWith("/quote"))
      return route.fulfill({ json: quote(req.postDataJSON().lines) });
    if (path.endsWith("/cart") && req.method() === "PUT") {
      puts++;
      await hold;
      return route.fulfill({ json: { ok: true } });
    }
    return route.fulfill({
      status: 503,
      json: { code: "service_unavailable" },
    });
  });
  await page.goto(
    `http://127.0.0.1:4313/${drawer ? "search" : "cart"}?lang=en`,
  );
  const open = page.locator("header").getByRole("button", { name: /^Cart/ });
  if (drawer) await open.click();
  const dialog = drawer ? page.getByRole("dialog") : page.locator("main");
  await dialog
    .getByRole("button", { name: "Remove Pidgey", exact: true })
    .click();
  await dialog
    .getByText("Your cart is ready for its first card.", { exact: true })
    .waitFor();
  if (drawer) {
    await page.keyboard.press("Escape");
    await dialog.waitFor({ state: "hidden" });
    await open.click();
  } else {
    await page.goto("http://127.0.0.1:4313/search?lang=en");
    await page.goto("http://127.0.0.1:4313/cart?lang=en");
  }
  await dialog
    .getByText("Your cart is ready for its first card.", { exact: true })
    .waitFor();
  assert.equal(
    await dialog
      .getByRole("button", { name: "Remove Pidgey", exact: true })
      .count(),
    0,
  );
  console.log({
    case: "Intentional empty cart survives reopen while PUT pending",
    surface: drawer ? "drawer" : "route",
    puts,
    result: "PASS",
  });
  assert.equal(puts, 1);
  release();
  await page.close();
} finally {
  await browser.close();
}
