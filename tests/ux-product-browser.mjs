import { chromium, expect } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";
import assert from "node:assert/strict";
import { writeFile, mkdir } from "node:fs/promises";
const origin = "http://localhost:4313";
const catalog = await (
  await globalThis.fetch(origin + "/api/catalog/page?path=/search&q=Pidgey")
).json();
const product =
  catalog.results.find((r) => r.product.name.en === "Pidgey")?.product ??
  catalog.results.find((r) => r.product.images?.length).product;
const path = "/product/" + product.slug;
const data = await (
  await globalThis.fetch(origin + "/api/catalog/page?path=" + path)
).json();
const b = await chromium.launch({ channel: "msedge", headless: true });
const results = [];
await mkdir("verification", { recursive: true });
try {
  for (const width of [390, 768, 1440])
    for (const lang of ["en", "fr"])
      for (const theme of ["dark", "light"]) {
        const c = await b.newContext({
          viewport: { width, height: 844 },
          reducedMotion: "reduce",
        });
        const p = await c.newPage();
        const errors = [];
        p.on("pageerror", (e) => errors.push(e.message));
        await p.goto(origin + path + `?lang=${lang}&theme=${theme}`);
        await p.locator(".troc-purchase-summary").waitFor();
        await p.waitForTimeout(450);
        const cta = p.locator(".troc-purchase-summary a");
        const box = await cta.boundingBox();
        assert.ok(
          box.y + box.height <= 844,
          `CTA below viewport ${width}/${lang}/${theme}: ${box.y}`,
        );
        assert.ok(box.height >= 44);
        await cta.focus();
        await cta.press("Enter");
        await expect(p.locator("#seller-offers")).toBeFocused();
        assert.ok((await p.locator("#seller-offers").boundingBox()).y >= 0);
        const row = p.locator(".troc-offer").first();
        const quantity = row.getByRole("spinbutton");
        await expect(quantity).toHaveAccessibleName(
          new RegExp(
            data.sellers.find((s) => s.id === data.offers[0].sellerId).name,
          ),
        );
        await quantity.fill("2");
        await quantity.blur();
        await row
          .getByRole("button", { name: /Add to cart|Ajouter au panier/ })
          .click();
        const feedback = p.locator(".troc-offer-feedback");
        await expect(feedback).toContainText("2");
        await expect(feedback.locator("a")).toBeVisible();
        await expect(feedback).toBeInViewport();
        const saved = await p.evaluate(() =>
          JSON.parse(globalThis.localStorage.getItem("troc.cart.v1")),
        );
        assert.equal(saved[0].listingId, data.offers[0].id);
        assert.equal(saved[0].quantity, 2);
        const qty = quantity;
        await qty.fill("-3");
        await qty.blur();
        await expect(qty).toHaveValue("1");
        await qty.fill("99999");
        await qty.blur();
        await expect(qty).toHaveValue(String(data.offers[0].quantity));
        assert.ok(
          await p.evaluate(
            () => document.documentElement.scrollWidth <= innerWidth,
          ),
        );
        assert.deepEqual(errors, []);
        const violations = (
          await new AxeBuilder({ page: p })
            .withTags(["wcag2a", "wcag2aa", "wcag21aa"])
            .analyze()
        ).violations;
        assert.deepEqual(
          violations.map((v) => ({
            id: v.id,
            targets: v.nodes.map((n) => n.target),
          })),
          [],
        );
        await p.screenshot({
          path: `verification/ux-01-feedback-${width}-${lang}-${theme}.png`,
          fullPage: true,
        });
        await p.evaluate(() => globalThis.scrollTo(0, 0));
        await p.screenshot({
          path: `verification/ux-01-top-${width}-${lang}-${theme}.png`,
        });
        results.push({ width, lang, theme, ctaY: box.y, passed: true });
        await c.close();
      }

  // Change printing through the real link, preserving French and requiring an explicit add.
  {
    const p = await b.newPage();
    await p.goto(origin + path + "?lang=fr");
    assert.ok(data.product.variants.length >= 2);
    const variant = data.product.variants[1];
    await p
      .locator(`.troc-product-summary a[href*="variantId=${variant.id}"]`)
      .click();
    await expect(p).toHaveURL(/lang=fr/);
    await expect(p).toHaveURL(new RegExp(variant.id));
    await expect(
      p.locator('.troc-product-summary a[aria-current="true"]'),
    ).toHaveAttribute("href", new RegExp(variant.id));
    assert.equal(
      await p.evaluate(() => globalThis.localStorage.getItem("troc.cart.v1")),
      null,
    );
    const selected = await (
      await globalThis.fetch(
        origin + "/api/catalog/page?path=" + path + "&variantId=" + variant.id,
      )
    ).json();
    await p
      .locator(".troc-offer")
      .first()
      .getByRole("button", { name: /Ajouter au panier/ })
      .click();
    const saved = await p.evaluate(() =>
      JSON.parse(globalThis.localStorage.getItem("troc.cart.v1")),
    );
    assert.equal(saved[0].listingId, selected.offers[0].id);
    await p.close();
  }
  // Explicit local storage failure cannot claim success or show a success cart link.
  const p = await b.newPage();
  await p.addInitScript(() => {
    const set = globalThis.Storage.prototype.setItem;
    globalThis.Storage.prototype.setItem = function (k, v) {
      if (k === "troc.cart.v1") throw new Error("test storage unavailable");
      return set.call(this, k, v);
    };
  });
  await p.goto(origin + path);
  await p
    .locator(".troc-offer")
    .first()
    .getByRole("button", { name: /Add to cart/ })
    .click();
  await expect(p.locator(".troc-offer-feedback")).toContainText(
    "Could not save",
  );
  await expect(p.locator(".troc-offer-feedback a")).toHaveCount(0);
  await p.close();
  // Controlled no-offer and sold-out responses, never production mutations.
  for (const mode of ["empty", "sold-out"]) {
    const p = await b.newPage();
    await p.route("**/api/catalog/page?*", async (route) => {
      const r = await route.fetch();
      const body = await r.json();
      if (body.product) {
        body.offers =
          mode === "empty"
            ? []
            : body.offers.map((o) => ({ ...o, quantity: 0 }));
      }
      await route.fulfill({ response: r, json: body });
    });
    await p.goto(origin + path);
    await expect(p.locator(".troc-purchase-summary")).toContainText(
      "No available offers",
    );
    await expect(p.getByRole("button", { name: /Add to cart/ })).toHaveCount(0);
    if (mode === "empty")
      await expect(
        p.getByRole("link", { name: "Clear offer filters" }),
      ).toBeVisible();
    else
      await expect(p.locator(".troc-offer-unavailable").first()).toHaveText(
        "Out of stock",
      );
    await p.close();
  }
  await writeFile(
    "verification/ux-product-browser.json",
    JSON.stringify(
      { results, storageFailure: true, noOffers: true, soldOut: true },
      null,
      2,
    ),
  );
  console.log(
    `Passed ${results.length} product purchase-path cases plus storage error, empty and sold-out states`,
  );
} finally {
  await b.close();
}
