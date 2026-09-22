import { chromium } from "@playwright/test";
import assert from "node:assert/strict";
const browser = await chromium.launch({ channel: "chrome", headless: true });
try {
  for (const lang of ["en", "fr"]) {
    const page = await browser.newPage({
      viewport: { width: 390, height: 844 },
    });
    await page.addInitScript(
      (lang) => globalThis.localStorage.setItem("troc.locale", lang),
      lang,
    );
    await page.route("**/api/commerce/checkout", (route) => route.abort());
    await page.route("**/api/commerce/smart/apply", (route) => route.abort());
    await page.goto(
      `http://127.0.0.1:4313/product/pokemon-pidgey-05c50488?lang=${lang}`,
    );
    for (const seller of ["Card Forge TCG", "Piko Trading Cards"])
      await page
        .getByRole("button", {
          name: `${lang === "fr" ? "Ajouter au panier" : "Add to cart"} · ${seller}`,
          exact: true,
        })
        .click();
    await page.goto(`http://127.0.0.1:4313/cart?lang=${lang}`);
    await page.locator("#cart-minimum-explanation").waitFor();
    assert.match(
      await page.locator("#cart-minimum-explanation").innerText(),
      /Piko Trading Cards/,
    );
    assert.match(await page.locator("main").innerText(), /Card Forge TCG/);
    await page.goto(`http://127.0.0.1:4313/smart-cart?lang=${lang}`);
    await page
      .getByRole("button", {
        name:
          lang === "fr" ? "Optimiser le coût total" : "Optimize landed cost",
        exact: true,
      })
      .click();
    const changes = page
      .locator("summary")
      .filter({
        hasText:
          lang === "fr" ? "Changements d’offres" : "Listing substitutions",
      });
    await changes.click();
    const text = await changes.locator("..").innerText();
    assert.match(text, /Card Forge TCG/);
    assert.match(text, /Piko Trading Cards/);
    assert.doesNotMatch(text, /Cartes du Nord|Maple Singles/);
    await changes
      .locator("..")
      .screenshot({ path: `verification/commerce-branding-${lang}.png` });
    console.log(
      `${lang}: public offer -> cart minimum -> SmartCart names PASS`,
    );
    await page.close();
  }
} finally {
  await browser.close();
}
