import { chromium } from "@playwright/test";
import assert from "node:assert/strict";
const browser = await chromium.launch({ channel: "chrome", headless: true });
const base = {
  name_en: "Pidgey",
  name_fr: "Pidgey",
  condition: "NM",
  status: "active",
  source_platform: "manual",
  sync_status: "not_connected",
  sync_error: null,
};
const rows = [
  {
    ...base,
    id: "design-standard",
    language: "en",
    finish: "standard",
    collector_number: "016",
    quantity: 20,
    unit_price_cents: 5,
    inventory_version: 1,
    seller_sku: "DESIGN-STD",
  },
  {
    ...base,
    id: "design-reverse",
    language: "en",
    finish: "reverse",
    collector_number: "016",
    quantity: 3,
    unit_price_cents: 15,
    inventory_version: 2,
    seller_sku: "DESIGN-REV",
  },
  {
    ...base,
    id: "design-missing",
    quantity: 1,
    unit_price_cents: 10,
    inventory_version: 1,
    seller_sku: "DESIGN-MISSING",
  },
  {
    ...base,
    id: "design-unknown",
    language: "zz",
    finish: "special-print",
    collector_number: "099",
    quantity: 1,
    unit_price_cents: 10,
    inventory_version: 1,
    seller_sku: "DESIGN-UNKNOWN",
  },
];
try {
  for (const width of [320, 390, 1440])
    for (const lang of ["en", "fr"])
      for (const theme of ["light", "dark"]) {
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
        const writes = [];
        await page.route("**/api/**", (route) => {
          const request = route.request(),
            path = new URL(request.url()).pathname;
          if (request.method() !== "GET") {
            writes.push(request.postDataJSON());
            return route.fulfill({
              status: 503,
              json: { code: "service_unavailable" },
            });
          }
          let json = [];
          if (path.endsWith("/sellers"))
            json = [{ id: "design-seller", display_name: "Design fixture" }];
          if (path.endsWith("/listings")) json = { rows, next: null };
          return route.fulfill({ json });
        });
        await page.goto(`http://127.0.0.1:4313/seller/inventory?lang=${lang}`);
        const listings = page.locator(".inventory-list > li");
        await listings.first().waitFor();
        assert.match(
          await listings.nth(0).innerText(),
          new RegExp(
            `${lang === "fr" ? "Anglais" : "English"} · Standard · #016`,
          ),
        );
        assert.match(
          await listings.nth(1).innerText(),
          new RegExp(
            `${lang === "fr" ? "Holographique inversée" : "Reverse holo"} · #016`,
          ),
        );
        assert.equal(
          await listings.nth(2).locator(".inventory-check").innerText(),
          "Pidgey · NM · DESIGN-MISSING",
        );
        assert.match(
          await listings.nth(3).innerText(),
          /zz · special-print · #099/,
        );
        assert.equal(
          await page.evaluate(
            () => document.documentElement.scrollWidth > innerWidth,
          ),
          false,
        );
        await page.screenshot({
          path: `verification/di01-${width}-${lang}-${theme}.png`,
          fullPage: true,
        });
        const reverse = listings.nth(1);
        await reverse.getByRole("checkbox").check();
        assert.equal(
          await listings.nth(0).getByRole("checkbox").isChecked(),
          false,
        );
        await reverse.locator("input[name=quantity]").fill("4");
        await reverse.locator("input[name=price]").fill("0.17");
        await reverse
          .getByRole("button", {
            name: lang === "fr" ? "Enregistrer" : "Save",
            exact: true,
          })
          .click();
        await page.getByRole("status").waitFor();
        assert.deepEqual(writes, [
          {
            changes: [
              { id: "design-reverse", version: 2, quantity: 4, priceCents: 17 },
            ],
          },
        ]);
        assert.equal(
          await reverse.locator("input[name=quantity]").inputValue(),
          "4",
        );
        assert.equal(
          await reverse.locator("input[name=price]").inputValue(),
          "0.17",
        );
        console.log(JSON.stringify({ width, lang, theme, result: "PASS" }));
        await page.close();
      }
} finally {
  await browser.close();
}
