import process from "node:process";
import { chromium, expect } from "@playwright/test";
import assert from "node:assert/strict";
const browser = await chromium.launch({ channel: "chrome", headless: true });
try {
  for (const [width, lang, theme] of [
    [390, "fr", "dark"],
    [1440, "en", "light"],
    [320, "fr", "light"],
    [390, "en", "light"],
    [390, "en", "dark"],
    [390, "fr", "light"],
    [1440, "en", "dark"],
    [1440, "fr", "light"],
    [1440, "fr", "dark"],
  ]) {
    if (
      process.argv.includes("--inspect") &&
      !(
        (width === 320 && lang === "fr") ||
        (width === 1440 && lang === "fr" && theme === "dark")
      )
    )
      continue;
    const page = await browser.newPage({
      viewport: { width, height: width === 1440 ? 900 : 844 },
      reducedMotion: "reduce",
    });
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
    await page.route("**/api/commerce/checkout", (r) => r.abort());
    await page.route("**/api/commerce/smart/apply", (r) => r.abort());
    await page.goto(
      `http://127.0.0.1:4313/product/pokemon-pidgey-05c50488?lang=${lang}`,
    );
    const open = page
      .locator("header")
      .getByRole("button", { name: lang === "fr" ? /^Panier/ : /^Cart/ });
    await open.click();
    const dialog = page.getByRole("dialog");
    await dialog.waitFor();
    await dialog
      .getByText(
        lang === "fr"
          ? "Votre panier attend sa première carte."
          : "Your cart is ready for its first card.",
      )
      .waitFor();
    await page.keyboard.press("Escape");
    await dialog.waitFor({ state: "hidden" });
    assert.equal(
      await open.evaluate((el) => el === document.activeElement),
      true,
    );
    await page
      .getByRole("button", {
        name: `${lang === "fr" ? "Ajouter au panier" : "Add to cart"} · Piko Trading Cards`,
        exact: true,
      })
      .click();
    await open.click();
    await dialog
      .getByText("Piko Trading Cards", { exact: true })
      .first()
      .waitFor();
    assert.equal(await page.locator("main").count(), 1);
    assert.equal(
      await dialog
        .getByRole("navigation", {
          name: lang === "fr" ? "Navigation principale" : "Main navigation",
          exact: true,
        })
        .count(),
      0,
    );
    assert.match(
      await dialog.locator("#cart-minimum-explanation").innerText(),
      /Piko Trading Cards/,
    );
    assert.equal(
      await dialog.evaluate((el) => el.scrollWidth > el.clientWidth),
      false,
    );
    for (let i = 0; i < 24; i++) {
      await page.keyboard.press(i < 12 ? "Tab" : "Shift+Tab");
      assert.equal(
        await dialog.evaluate((el) => el.contains(document.activeElement)),
        true,
        "modal focus stays trapped",
      );
    }
    assert.equal(
      await page
        .locator("main")
        .evaluate((el) => el.closest('[aria-hidden="true"]') !== null),
      true,
      "background hidden from accessibility tree",
    );
    await dialog.evaluate((el) => {
      el.scrollTop = el.scrollHeight;
    });
    await expect(
      dialog.getByRole("button", {
        name: lang === "fr" ? "Fermer le panier" : "Close cart",
        exact: true,
      }),
    ).toBeInViewport();
    await dialog.screenshot({
      path: `verification/drawer-summary-${width}-${lang}-${theme}.png`,
    });
    await dialog.evaluate((el) => {
      el.scrollTop = 0;
    });
    await dialog.screenshot({
      path: `verification/drawer-${width}-${lang}-${theme}.png`,
    });
    const before = page.url();
    await dialog
      .getByRole("button", {
        name: lang === "fr" ? "Fermer le panier" : "Close cart",
        exact: true,
      })
      .click();
    await dialog.waitFor({ state: "hidden" });
    assert.equal(page.url(), before);
    assert.equal(
      await open.evaluate((el) => el === document.activeElement),
      true,
    );
    await open.click();
    await dialog
      .getByText("Piko Trading Cards", { exact: true })
      .first()
      .waitFor();
    if (width === 1440) {
      await page
        .locator(".troc-overlay")
        .click({ position: { x: 10, y: 450 } });
      await dialog.waitFor({ state: "hidden" });
      assert.equal(
        await open.evaluate((el) => el === document.activeElement),
        true,
      );
      await open.click();
      await dialog
        .getByText("Piko Trading Cards", { exact: true })
        .first()
        .waitFor();
    }
    await dialog
      .getByRole("link", {
        name: lang === "fr" ? "Ouvrir le panier complet" : "Open full cart",
        exact: true,
      })
      .click();
    await page.waitForURL(/\/cart\?/);
    await page.locator("#cart-summary").waitFor();
    await page
      .locator("header")
      .getByRole("button", { name: lang === "fr" ? /^Panier/ : /^Cart/ })
      .click();
    assert.equal(await page.getByRole("dialog").count(), 0);
    console.log(JSON.stringify({ width, lang, theme, result: "PASS" }));
    await page.close();
  }
} finally {
  await browser.close();
}
