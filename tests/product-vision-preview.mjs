import { chromium } from "@playwright/test";
import assert from "node:assert/strict";
const browser = await chromium.launch({ channel: "chrome", headless: true });
try {
  for (const width of [390, 1440])
    for (const lang of ["en", "fr"])
      for (const theme of ["light", "dark"]) {
        const page = await browser.newPage({
          viewport: { width, height: width === 390 ? 844 : 900 },
          reducedMotion: "reduce",
        });
        await page.addInitScript(
          ({ lang, theme }) => {
            globalThis.localStorage.setItem("troc.locale", lang);
            globalThis.localStorage.setItem("troc.theme", theme);
          },
          { lang, theme },
        );
        await page.goto(
          `http://127.0.0.1:4313/product/pokemon-pidgey-05c50488?lang=${lang}`,
        );
        const breadcrumb = page.getByRole("navigation", {
          name: lang === "fr" ? "Fil d’Ariane" : "Breadcrumb",
          exact: true,
        });
        await breadcrumb.waitFor();
        assert.match(await breadcrumb.innerText(), /Pokémon/);
        assert.match(await breadcrumb.innerText(), /151/);
        assert.match(await breadcrumb.innerText(), /Pidgey/);
        assert.equal(await breadcrumb.getByRole("link").count(), 4);
        const next = page
          .locator(".troc-purchase-summary-options a")
          .filter({
            hasText: lang === "fr" ? "Holographique inversée" : "Reverse holo",
          });
        const target = new URL(
          await next.getAttribute("href"),
          "http://127.0.0.1:4313",
        );
        await next.click();
        await page.waitForURL(
          (url) =>
            url.searchParams.get("variantId") ===
            target.searchParams.get("variantId"),
        );
        await page
          .locator(".troc-purchase-summary-options [aria-current=true]")
          .filter({
            hasText: lang === "fr" ? "Holographique inversée" : "Reverse holo",
          })
          .waitFor();
        await page
          .getByRole("link", {
            name: lang === "fr" ? "Choisir une offre" : "View offers",
            exact: true,
          })
          .click();
        assert.equal(
          await page.evaluate(() => document.activeElement.id),
          "seller-offers",
        );
        const history = page.locator(".troc-history-compact");
        await history.scrollIntoViewIfNeeded();
        await history
          .getByRole("button", {
            name: lang === "fr" ? "90 J" : "90D",
            exact: true,
          })
          .click();
        assert.equal(
          await history
            .getByRole("button", {
              name: lang === "fr" ? "90 J" : "90D",
              exact: true,
            })
            .getAttribute("aria-pressed"),
          "true",
        );
        const widths = await page.evaluate(() => ({
          chart: document
            .querySelector(".troc-history-compact")
            .getBoundingClientRect().width,
          section: document
            .querySelector(".troc-price-history")
            .getBoundingClientRect().width,
          overflow: document.documentElement.scrollWidth > innerWidth,
        }));
        assert.ok(Math.abs(widths.chart - widths.section) < 2);
        assert.equal(widths.overflow, false);
        for (const [name, selector] of [
          ["identity", ".troc-product-decision"],
          ["history", ".troc-price-history"],
        ])
          await page
            .locator(selector)
            .screenshot({
              path: `verification/vision-product-${width}-${lang}-${theme}-${name}.png`,
            });
        console.log(JSON.stringify({ width, lang, theme, result: "PASS" }));
        await page.close();
      }
} finally {
  await browser.close();
}
