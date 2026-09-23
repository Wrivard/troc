import { chromium, expect } from "@playwright/test";
import assert from "node:assert/strict";
import fs from "node:fs/promises";
const browser = await chromium.launch({ channel: "chrome", headless: true });
const results = [];
try {
  for (const [width, lang, theme] of [
    [1440, "en", "dark"],
    [768, "fr", "light"],
    [390, "fr", "dark"],
    [320, "en", "light"],
  ]) {
    const page = await browser.newPage({
      viewport: { width, height: 900 },
      reducedMotion: "reduce",
    });
    let prohibited = 0;
    await page.addInitScript(
      ({ lang, theme }) => {
        globalThis.localStorage.setItem("troc.locale", lang);
        globalThis.localStorage.setItem("troc.theme", theme);
      },
      { lang, theme },
    );
    await page.route("**/api/commerce/events", (r) =>
      r.fulfill({ status: 204 }),
    );
    await page.route("**/api/commerce/cart", (r) =>
      r.fulfill({ status: 401, json: { code: "unauthorized" } }),
    );
    await page.route(/\/api\/commerce\/(checkout|smart\/apply)/, (r) => {
      prohibited++;
      return r.abort();
    });
    await page.goto(
      `http://127.0.0.1:4313/product/pokemon-pidgey-05c50488?lang=${lang}`,
    );
    const add = (seller) =>
      page.getByRole("button", {
        name: `${lang === "fr" ? "Ajouter au panier" : "Add to cart"} · ${seller}`,
        exact: true,
      });
    const opener = page
      .locator("header")
      .getByRole("button", { name: lang === "fr" ? /^Panier/ : /^Cart/ });
    await add("Piko Trading Cards").click();
    await opener.click();
    const dialog = page.getByRole("dialog");
    await expect(dialog.locator(".troc-cart-group")).toHaveCount(1);
    await expect(dialog.getByRole("spinbutton").first()).toBeEnabled();
    const review = dialog.getByRole("button", {
      name: lang === "fr" ? "Vérifier la commande →" : "Review order →",
      exact: true,
    });
    await expect(review).toBeInViewport();
    await expect(review).toBeDisabled();
    const coupon = dialog.locator("#cart-summary > details > summary");
    await coupon.click();
    await expect(review).toBeInViewport();
    await coupon.click();
    const details = dialog.locator(".troc-cart-seller-options").first();
    await expect(details).not.toHaveAttribute("open", "");
    await details.locator("summary").click();
    const locks = details.getByRole("checkbox");
    await expect(locks).toHaveCount(2);
    await locks.first().click();
    await expect
      .poll(() =>
        page.evaluate(
          () =>
            JSON.parse(globalThis.localStorage.getItem("troc.cart.v1"))[0]
              .lockListing,
        ),
      )
      .toBe(true);
    await expect(dialog.getByRole("spinbutton").first()).toBeEnabled();
    await details.locator("summary").click();
    const quantity = dialog.getByRole("spinbutton").first();
    const count = String(
      Math.min(20, Number(await quantity.getAttribute("max"))),
    );
    await quantity.fill(count);
    await quantity.press("Enter");
    await expect(quantity).toHaveValue(count);
    await expect(quantity).toBeEnabled();
    await dialog
      .locator(".troc-cart-compact-groups")
      .evaluate((e) => (e.scrollTop = 0));
    await dialog.screenshot({
      path: `verification/cart-polish-one-${width}-${lang}-${theme}.jpg`,
    });
    await page.keyboard.press("Escape");
    await expect(opener).toBeFocused();
    await add("Card Forge TCG").click();
    await add("The Playground").click();
    await opener.click();
    await expect(dialog.locator(".troc-cart-group")).toHaveCount(3);
    await expect(dialog.getByRole("spinbutton").first()).toBeEnabled();
    await dialog
      .locator(".troc-cart-compact-groups")
      .evaluate((e) => (e.scrollTop = e.scrollHeight));
    await expect(review).toBeInViewport();
    await expect(
      dialog.getByRole("button", {
        name: lang === "fr" ? "Fermer le panier" : "Close cart",
        exact: true,
      }),
    ).toBeInViewport();
    assert.equal(
      await dialog.evaluate((e) => e.scrollWidth > e.clientWidth),
      false,
    );
    await dialog
      .locator(".troc-cart-compact-groups")
      .evaluate((e) => (e.scrollTop = 0));
    await expect(
      dialog.locator(".troc-cart-group-name").first(),
    ).toBeInViewport();
    await dialog.screenshot({
      path: `verification/cart-polish-three-${width}-${lang}-${theme}.jpg`,
    });
    await dialog.locator(".troc-cart-item-remove button").first().click();
    await expect(dialog.locator(".troc-cart-group")).toHaveCount(2);
    await page.keyboard.press("Escape");
    await opener.click();
    await expect(dialog.locator(".troc-cart-group")).toHaveCount(2);
    assert.equal(prohibited, 0);
    results.push({ width, lang, theme, result: "PASS", prohibited });
    await page.close();
  }
  await fs.writeFile(
    "verification/cart-polish.json",
    JSON.stringify(results, null, 2),
  );
  console.log(results);
} finally {
  await browser.close();
}
