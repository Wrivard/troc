import { chromium } from "@playwright/test";
import assert from "node:assert/strict";
import process from "node:process";
const origin = process.env.SELLER_ORIGIN || "http://127.0.0.1:5311",
  browser = await chromium.launch({ channel: "chrome", headless: true });
try {
  for (const locale of ["en", "fr"])
    for (const width of [390, 1280])
      for (const theme of ["light", "dark"]) {
        const context = await browser.newContext({
          viewport: { width, height: 900 },
        });
        await context.addInitScript(
          ({ locale, theme }) => {
            globalThis.localStorage.setItem("troc.locale", locale);
            globalThis.localStorage.setItem("troc.theme", theme);
          },
          { locale, theme },
        );
        const page = await context.newPage(),
          requests = [];
        await page.route("**/api/**", (route) => {
          const u = new URL(route.request().url()),
            p = Number(u.searchParams.get("page") || 0);
          requests.push(u.pathname + u.search);
          const rows = Array.from(
            { length: p === 0 ? 50 : 1 },
            (_, i) => p * 50 + i,
          );
          const data = u.pathname.endsWith("/sellers")
            ? rows.map((i) => ({
                id: "seller" + i,
                display_name: "Store " + i,
                role: "owner",
                status: "active",
              }))
            : rows.map((i) => ({
                user_id: "user" + i,
                email: "member" + i + "@example.test",
                role: "inventory",
              }));
          return route.fulfill({
            status: 200,
            contentType: "application/json",
            body: JSON.stringify(data),
          });
        });
        await page.goto(origin + "/seller/team");
        await page
          .getByText("member0@example.test", { exact: false })
          .waitFor();
        const teamNav = page.getByRole("navigation", {
            name: locale === "en" ? "Team pages" : "Pages de l’équipe",
            exact: true,
          }),
          sellerNav = page.getByRole("navigation", {
            name: locale === "en" ? "Seller pages" : "Pages de vendeurs",
            exact: true,
          });
        await teamNav
          .getByRole("button", {
            name: locale === "en" ? "Next page" : "Page suivante",
            exact: true,
          })
          .click();
        await page
          .getByText("member50@example.test", { exact: false })
          .waitFor();
        assert.equal(
          await teamNav
            .getByRole("button", {
              name: locale === "en" ? "Next page" : "Page suivante",
              exact: true,
            })
            .isDisabled(),
          true,
        );
        await sellerNav
          .getByRole("button", {
            name: locale === "en" ? "Next page" : "Page suivante",
            exact: true,
          })
          .click();
        await page
          .getByRole("option", { name: "Store 50", exact: true })
          .waitFor({ state: "attached" });
        await page
          .getByText("member0@example.test", { exact: false })
          .waitFor();
        assert.ok(
          requests.includes("/api/seller/platform/seller50/team?page=0"),
        );
        assert.ok(requests.includes("/api/seller/platform/sellers?page=1"));
        assert.ok(
          requests.includes("/api/seller/platform/seller0/team?page=1"),
        );
        await sellerNav
          .getByRole("button", {
            name: locale === "en" ? "Previous page" : "Page précédente",
            exact: true,
          })
          .click();
        await page
          .getByRole("option", { name: "Store 0", exact: true })
          .waitFor({ state: "attached" });
        assert.equal(
          await page.evaluate(
            () => document.documentElement.scrollWidth > innerWidth,
          ),
          false,
        );
        await context.close();
      }
  console.log(
    "C05 seller/team pagination UI passed8EN/FR/theme/viewport cases.",
  );
} finally {
  await browser.close();
}
