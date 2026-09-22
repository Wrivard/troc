import { chromium, expect } from "@playwright/test";
import assert from "node:assert/strict";
import AxeBuilder from "@axe-core/playwright";
const browser = await chromium.launch({ channel: "chrome", headless: true });
try {
  for (const width of [390, 1440, 320])
    for (const lang of ["en", "fr"])
      for (const theme of ["light", "dark"]) {
        const context = await browser.newContext({
          viewport: { width, height: 900 },
          reducedMotion: "reduce",
        });
        const page = await context.newPage();
        await page.addInitScript(
          ({ lang, theme }) => {
            globalThis.localStorage.setItem("troc.locale", lang);
            globalThis.localStorage.setItem("troc.theme", theme);
            globalThis.localStorage.setItem("troc.cart.v1", "[ ]");
          },
          { lang, theme },
        );
        await page.route("**/api/commerce/cart", (r) =>
          r.fulfill({ status: 401, json: { code: "unauthorized" } }),
        );
        await page.route("**/api/commerce/events", (r) =>
          r.fulfill({ status: 204 }),
        );
        if (width === 390) {
          await page.goto(`http://127.0.0.1:4313/?lang=${lang}`);
          const entry = page.locator(".troc-smart-story a");
          await entry.focus();
          await page.keyboard.press("Enter");
          await page.waitForURL(`**/smart-cart?lang=${lang}`);
        } else await page.goto(`http://127.0.0.1:4313/smart-cart?lang=${lang}`);
        const demo = page.locator(".troc-smart-demo");
        const toggle = demo.locator("button[aria-expanded]");
        await toggle.waitFor();
        await page.waitForLoadState("networkidle");
        const before = await page.evaluate(() =>
          globalThis.localStorage.getItem("troc.cart.v1"),
        );
        const requests = [];
        page.on("request", (r) => requests.push(`${r.method()} ${r.url()}`));
        await toggle.focus();
        await page.keyboard.press("Enter");
        await expect(toggle).toHaveAttribute("aria-expanded", "true");
        const money = (n) =>
          new Intl.NumberFormat(lang + "-CA", {
            style: "currency",
            currency: "CAD",
          }).format(n / 100);
        await expect(
          demo.locator(".troc-consolidation-total").nth(0),
        ).toHaveText(money(1425));
        await expect(
          demo.locator(".troc-consolidation-total").nth(1),
        ).toHaveText(money(1122));
        await expect(
          demo.locator(".troc-consolidation-result strong"),
        ).toHaveText(money(303));
        const steps = demo.getByRole("group").getByRole("button");
        await steps.nth(1).focus();
        await page.keyboard.press("Enter");
        await expect(steps.nth(1)).toHaveAttribute("aria-pressed", "true");
        await steps.nth(2).click();
        await expect(demo.getByRole("status")).toContainText(
          lang === "fr" ? "ne sont pas garanties" : "not guaranteed",
        );
        await demo
          .getByRole("button", {
            name: lang === "fr" ? "Réinitialiser l’exemple" : "Reset example",
          })
          .click();
        await expect(steps.nth(0)).toHaveAttribute("aria-pressed", "true");
        assert.equal(
          await page.evaluate(() => globalThis.localStorage.getItem("troc.cart.v1")),
          before,
        );
        assert.deepEqual(requests, []);
        assert.equal(
          await page.evaluate(
            () => document.documentElement.scrollWidth > innerWidth,
          ),
          false,
        );
        await expect(demo.getByRole("link")).toHaveAttribute(
          "href",
          `/search?lang=${lang}`,
        );
        await demo.screenshot({
          path: `verification/smart-demo-${width}-${lang}-${theme}.png`,
        });
        if (width === 390 && lang === "fr") {
          const result = await new AxeBuilder({ page })
            .include(".troc-smart-demo")
            .analyze();
          assert.deepEqual(
            result.violations.map((v) => ({ id: v.id, impact: v.impact })),
            [],
          );
        }
        await toggle.click();
        await expect(toggle).toHaveAttribute("aria-expanded", "false");
        assert.equal(
          await page.evaluate(() => globalThis.localStorage.getItem("troc.cart.v1")),
          before,
        );
        assert.deepEqual(requests, []);
        console.log(
          `PASS ${width} ${lang} ${theme}: amounts, keyboard, steps/reset, cart bytes, zero requests, reflow`,
        );
        await context.close();
      }
} finally {
  await browser.close();
}
