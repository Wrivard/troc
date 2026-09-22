import { chromium } from "@playwright/test";
import assert from "node:assert/strict";
import process from "node:process";
const browser = await chromium.launch({ headless: true, channel: "chrome" });
const origin = process.env.SELLER_ORIGIN || "http://127.0.0.1:5311";
let checks = 0;
try {
  for (const locale of ["en", "fr"]) {
    for (const stage of ["sellers", "team"]) {
      for (const failure of [
        "unauthorized",
        "forbidden",
        "service_unavailable",
        "network",
      ]) {
        const context = await browser.newContext();
        await context.addInitScript(
          (locale) => globalThis.localStorage.setItem("troc.locale", locale),
          locale,
        );
        const page = await context.newPage();
        await page.route("**/api/**", async (route) => {
          const path = new URL(route.request().url()).pathname;
          if (path.endsWith("/" + stage)) {
            if (failure === "network") return route.abort("failed");
            return route.fulfill({
              status:
                failure === "unauthorized"
                  ? 401
                  : failure === "forbidden"
                    ? 403
                    : 503,
              contentType: "application/json",
              body: JSON.stringify({ code: failure }),
            });
          }
          return route.fulfill({
            contentType: "application/json",
            body: JSON.stringify([
              {
                id: "seller",
                display_name: "Store",
                role: "owner",
                status: "active",
              },
            ]),
          });
        });
        await page.goto(origin + "/seller/team");
        const expected =
          failure === "unauthorized"
            ? locale === "fr"
              ? "Connectez-vous pour accéder à cet espace."
              : "Sign in to access this workspace."
            : failure === "forbidden"
              ? locale === "fr"
                ? "Votre compte n’a pas l’autorisation d’accéder à cet espace."
                : "Your account does not have permission to access this workspace."
              : locale === "fr"
                ? "Cet espace est temporairement indisponible. Veuillez réessayer."
                : "This workspace is temporarily unavailable. Please try again.";
        await page
          .getByRole("alert")
          .getByText(expected, { exact: true })
          .waitFor();
        assert.equal(await page.locator("input[name=userId]").count(), 0);
        checks++;
        await context.close();
      }
    }
  }
  console.log(
    `${checks} initial and workspace access-error browser cases passed.`,
  );
} finally {
  await browser.close();
}
