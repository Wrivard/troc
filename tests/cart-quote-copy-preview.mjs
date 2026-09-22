import { chromium, expect } from "@playwright/test";
const browser = await chromium.launch({ channel: "chrome", headless: true });
try {
  for (const lang of ["en", "fr"])
    for (const failed of ["quote", "account"]) {
      const page = await browser.newPage({
        viewport: { width: 390, height: 844 },
      });
      await page.addInitScript((lang) => {
        globalThis.localStorage.setItem("troc.locale", lang);
        globalThis.localStorage.setItem(
          "troc.cart.v1",
          JSON.stringify([{ listingId: "fixture", quantity: 1 }]),
        );
      }, lang);
      let recovered = false;
      await page.route("**/api/commerce/**", (route) => {
        const path = new URL(route.request().url()).pathname;
        if (path.endsWith("/events")) return route.fulfill({ status: 204 });
        if (path.endsWith("/cart"))
          return route.fulfill({
            status: failed === "account" ? 503 : 401,
            json: {
              code:
                failed === "account" ? "service_unavailable" : "unauthorized",
            },
          });
        if (path.endsWith("/quote") && (failed !== "quote" || recovered))
          return route.fulfill({
            json: {
              groups: [],
              cards: 0,
              merchandiseCents: 0,
              discountCents: 0,
              shippingCents: 0,
              taxCents: 0,
              creditCents: 0,
              totalCents: 0,
              eligible: false,
              demo: true,
              currency: "CAD",
            },
          });
        return route.fulfill({
          status: 503,
          json: { code: "service_unavailable" },
        });
      });
      await page.goto(
        `http://127.0.0.1:4313/${failed === "quote" ? "cart" : "checkout"}?lang=${lang}`,
      );
      const alert = page.getByRole("alert");
      await expect(alert).toContainText(
        failed === "quote"
          ? lang === "fr"
            ? "Le devis est temporairement indisponible"
            : "The estimate is temporarily unavailable"
          : lang === "fr"
            ? "Les services de compte"
            : "Account services",
      );
      if (failed === "quote") {
        recovered = true;
        await page
          .getByRole("button", {
            name: lang === "fr" ? "Réessayer le devis" : "Retry estimate",
            exact: true,
          })
          .click();
        await expect(alert).toHaveCount(0);
      }
      console.log({ lang, failed, result: "PASS" });
      await page.close();
    }
} finally {
  await browser.close();
}
