import process from "node:process";
import { chromium, expect } from "@playwright/test";
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
  let recover = false;
  const requests = [];
  const delayed = [];
  const smartRequests = [];
  let holdProvince = true;
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
    requests.push({ path, method: req.method(), body: req.postDataJSON() });
    if (path.endsWith("/smart")) {
      smartRequests.push(route);
      return;
    }
    if (path.endsWith("/quote")) {
      const body = req.postDataJSON();
      if (body.lines.some((line) => line.quantity > 1) && !recover)
        return route.fulfill({
          status: 503,
          json: { code: "service_unavailable" },
        });
      if (
        body.coupon.startsWith("SLOW") ||
        (body.province === "QC" && holdProvince)
      ) {
        delayed.push({ route, body });
        return;
      }
      return route.fulfill({ json: quote(body.lines) });
    }
    if (path.endsWith("/cart") && req.method() === "PUT") {
      puts++;
      await hold;
      return route.fulfill({
        status: 503,
        json: { code: "service_unavailable" },
      });
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
    .getByRole("button", { name: "Increase quantity", exact: true })
    .click();
  await dialog.getByRole("alert").waitFor();
  const checkout = dialog.getByRole("button", {
    name: "Simulated checkout",
    exact: true,
  });
  assert.equal(
    await checkout.isEnabled(),
    false,
    "stale estimate cannot authorize checkout",
  );
  assert.match(
    await dialog.innerText(),
    /Previous amounts are no longer current/,
  );
  const writesBeforeRetry = requests.filter(
    (r) => !r.path.endsWith("/quote") && !r.path.endsWith("/events"),
  );
  const quoteBeforeRetry = requests
    .filter((r) => r.path.endsWith("/quote"))
    .at(-1).body;
  recover = true;
  await dialog
    .getByRole("button", { name: "Retry estimate", exact: true })
    .click();
  await checkout.waitFor();
  await page.waitForFunction(() =>
    [...document.querySelectorAll("button")].some(
      (b) => b.textContent === "Simulated checkout" && !b.disabled,
    ),
  );
  assert.match(await dialog.locator("#cart-summary").innerText(), /1\.10/);
  assert.deepEqual(
    requests.filter(
      (r) => !r.path.endsWith("/quote") && !r.path.endsWith("/events"),
    ),
    writesBeforeRetry,
    "quote retry must not replay mutations",
  );
  assert.deepEqual(
    requests.filter((r) => r.path.endsWith("/quote")).at(-1).body,
    quoteBeforeRetry,
    "quote retry preserves exact inputs",
  );
  assert.equal(puts, 1);
  release();
  await expect(dialog.getByRole("alert")).toBeVisible();
  // Changing applied coupons invalidates synchronously; stale successes and failures cannot win.
  await dialog.locator("summary").filter({ hasText: "Coupon" }).click();
  const coupon = dialog.getByLabel("Coupon", { exact: true });
  const apply = dialog.getByRole("button", { name: "Apply", exact: true });
  for (const outcome of [200, 503]) {
    await coupon.fill(`SLOW${outcome}`);
    await apply.click();
    await expect(checkout).toBeDisabled();
    await expect.poll(() => delayed.length).toBe(1);
    await coupon.fill(`FAST${outcome}`);
    await apply.click();
    await expect(checkout).toBeEnabled();
    const old = delayed.shift();
    const response =
      outcome === 200
        ? {
            json: {
              ...quote(old.body.lines),
              totalCents: 99999,
              eligible: false,
            },
          }
        : { status: 503, json: { code: "service_unavailable" } };
    const oldResponse = page.waitForResponse(
      (r) =>
        r.url().endsWith("/quote") &&
        r.request().postDataJSON().coupon === old.body.coupon,
    );
    await old.route.fulfill(response);
    await oldResponse;
    await page.evaluate(
      () =>
        new Promise((resolve) =>
          globalThis.requestAnimationFrame(() =>
            globalThis.requestAnimationFrame(resolve),
          ),
        ),
    );
    await expect(checkout).toBeEnabled();
    assert.match(await dialog.locator("#cart-summary").innerText(), /1\.10/);
    await expect(
      dialog.getByRole("button", { name: "Retry estimate", exact: true }),
    ).toHaveCount(0);
  }
  await expect(dialog.getByRole("alert")).toBeVisible();
  if (drawer) {
    await page.keyboard.press("Escape");
    await open.click();
    await expect(checkout).toBeEnabled();
    assert.match(await dialog.locator("#cart-summary").innerText(), /1\.10/);
    assert.equal(puts, 1, "reopening never repeats cart write");
  }
  await page.goto("http://127.0.0.1:4313/checkout?lang=en");
  const pay = page.getByRole("button", {
    name: "Place simulated order — no charge",
    exact: true,
  });
  await expect(pay).toBeEnabled();
  const province = page.getByRole("combobox", {
    name: "Province / territory",
    exact: true,
  });
  await province.click();
  await page.getByRole("option", { name: "QC", exact: true }).click();
  await expect(pay).toBeDisabled();
  await expect.poll(() => delayed.length).toBe(1);
  await province.click();
  await page.getByRole("option", { name: "BC", exact: true }).click();
  await expect(pay).toBeEnabled();
  const oldProvince = delayed.shift();
  const provinceResponse = page.waitForResponse(
    (r) =>
      r.url().endsWith("/quote") &&
      r.request().postDataJSON().province === "QC",
  );
  await oldProvince.route.fulfill({
    status: 503,
    json: { code: "service_unavailable" },
  });
  await provinceResponse;
  await page.evaluate(
    () =>
      new Promise((resolve) =>
        globalThis.requestAnimationFrame(() =>
          globalThis.requestAnimationFrame(resolve),
        ),
      ),
  );
  await expect(pay).toBeEnabled();
  holdProvince = false;
  assert.equal(
    puts,
    1,
    "quote and province changes must not replay a failed cart save",
  );
  assert.equal(
    requests.some((r) => /\/(checkout|smart|repair)(\/|$)/.test(r.path)),
    false,
    "no order/repair/optimization/apply triggered",
  );
  await page.goto("http://127.0.0.1:4313/smart-cart?lang=en");
  const optimize = page.getByRole("button", {
    name: "Optimize landed cost",
    exact: true,
  });
  await expect(optimize).toBeEnabled();
  await optimize.click();
  await expect.poll(() => smartRequests.length).toBe(1);
  await page.locator("summary").filter({ hasText: "Coupon" }).click();
  await page.getByLabel("Coupon", { exact: true }).fill("NEW-INPUT");
  await page.getByRole("button", { name: "Apply", exact: true }).click();
  await expect(optimize).toBeEnabled();
  const lateSmart = smartRequests.shift();
  const smartBody = lateSmart.request().postDataJSON();
  const q = quote(smartBody.lines);
  const proposal = {
    original: q,
    optimized: q,
    naive: q,
    lines: smartBody.lines,
    savingsCents: 0,
    shippingSavingsCents: 0,
    evaluated: 1,
    substitutions: [],
  };
  const smartResponse = page.waitForResponse((r) => r.url().endsWith("/smart"));
  await lateSmart.fulfill({ json: proposal });
  await smartResponse;
  await page.evaluate(
    () =>
      new Promise((resolve) =>
        globalThis.requestAnimationFrame(() =>
          globalThis.requestAnimationFrame(resolve),
        ),
      ),
  );
  await expect(
    page.getByText("No better total found", { exact: true }),
  ).toHaveCount(0);
  await expect(page.locator(".troc-smart-cart")).toHaveCount(0);
  assert.equal(
    requests.some((r) => r.path.endsWith("/smart/apply")),
    false,
  );
  console.log({
    result: "PASS",
    drawer,
    scenario:
      "quantity503->retry200,coupon out-of-order200/503,province,failed PUT preservation,reopen",
    puts,
    checkoutRestored: true,
  });
  await page.close();
} finally {
  await browser.close();
}
