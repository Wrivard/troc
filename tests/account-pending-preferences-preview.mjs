import { chromium } from "@playwright/test";

import assert from "node:assert/strict";
const browser = await chromium.launch({ channel: "chrome", headless: true });
const results = [];
try {
  for (const locale of ["en", "fr"])
    for (const dimension of ["theme", "locale"])
      for (const responseStatus of [200, 503]) {
        const context = await browser.newContext({
          viewport: { width: 1280, height: 900 },
        });
        await context.addInitScript((locale) => {
          globalThis.localStorage.setItem("troc.locale", locale);
          globalThis.localStorage.setItem("troc.theme", "dark");
        }, locale);
        const page = await context.newPage();
        let release;
        let started;
        const pending = new Promise((r) => (started = r));
        const hold = new Promise((r) => (release = r));
        const writes = [];
        await page.route("**/api/**", (route) =>
          route.fulfill({ status: 503, json: { code: "service_unavailable" } }),
        );
        await page.route("**/api/account", (route) =>
          route.fulfill({
            json: {
              id: "00000000-0000-4000-8000-000000000001",
              email: "synthetic@example.test",
              locale,
              theme: "dark",
            },
          }),
        );
        await page.route("**/api/account/preferences", async (route) => {
          writes.push(route.request().postDataJSON());
          started();
          await hold;
          await route.fulfill({
            status: responseStatus,
            json:
              responseStatus === 200
                ? { ok: true }
                : { code: "service_unavailable" },
          });
        });
        await page.goto("http://127.0.0.1:4313/account");
        await page.locator("input[readonly]").waitFor();
        const save = page
          .locator("main section")
          .filter({ has: page.locator("#account-preferences-title") })
          .getByRole("button")
          .last();
        await save.click();
        await pending;
        await page
          .locator(
            dimension === "theme"
              ? "header .troc-theme-option[aria-pressed=false]"
              : "header .troc-locale-option[aria-pressed=false]",
          )
          .click();
        release();
        await page.locator("main[aria-busy=false]").waitFor();
        const misleading = await page
          .getByText(/^(Preferences saved\.|Préférences enregistrées\.)$/)
          .count();
        assert.deepEqual(writes, [{ locale, theme: "dark" }]);
        assert.equal(
          misleading,
          0,
          "Do not confirm a preference that differs from the submitted snapshot",
        );
        results.push({
          locale,
          dimension,
          responseStatus,
          persisted: writes[0],
          savedConfirmationVisible: false,
        });
        await context.close();
      }
  console.log(results);
} finally {
  await browser.close();
}
