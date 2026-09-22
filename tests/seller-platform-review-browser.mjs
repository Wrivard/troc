/** Deterministic UI regression fixtures; service/database authorization has separate tests. */
import { chromium } from "@playwright/test";
import assert from "node:assert/strict";
import process from "node:process";
const origin = process.env.SELLER_ORIGIN || "http://127.0.0.1:5311";
const browser = await chromium.launch({ headless: true, channel: "chrome" });
try {
  for (const width of [390, 1280])
    for (const locale of ["en", "fr"])
      for (const theme of ["dark", "light"]) {
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
        const page = await context.newPage();
        let teamWrites = 0;
        const pages = [];
        await page.route("**/api/**", async (route) => {
          const url = new URL(route.request().url()),
            path = url.pathname;
          let body = {};
          let status = 200;
          if (path === "/api/admin/seller-applications") {
            const p = Number(url.searchParams.get("page"));
            pages.push(p);
            body = Array.from({ length: p === 0 ? 50 : 1 }, (_, i) => ({
              id: String(p * 50 + i),
              contact_name: "Contact",
              status: p === 0 ? "approved" : "submitted",
              province: "QC",
              seller_type: "professional",
              profile: {
                displayName: "Store " + (p * 50 + i),
                channels: ["https://store.example.test"],
                games: ["Pokemon"],
                platforms: ["Spreadsheet"],
                inventorySize: 12345,
                salesRange: "10k-20k",
                taxRegistered: true,
              },
            }));
          } else if (path.endsWith("/sellers"))
            body = [
              {
                id: "seller",
                display_name: "Store",
                role: "owner",
                status: "active",
              },
            ];
          else if (path.endsWith("/dashboard"))
            body = {
              account: {
                display_name: "Store",
                role: "owner",
                plan_id: "free",
                level_id: "new",
              },
              inventory: {
                active_listings: 1,
                units: "1",
                asking_value_cents: "9007199254740993",
              },
              sales: {
                completed_orders: 1,
                merchandise_cents: "9007199254740993",
              },
            };
          else if (
            path.endsWith("/team") &&
            route.request().method() === "POST"
          ) {
            teamWrites++;
            if (teamWrites === 1) {
              status = 409;
              body = { code: "last_owner" };
            } else body = { ok: true };
          } else if (path.endsWith("/team"))
            body = [
              { user_id: "owner", email: "owner@example.test", role: "owner" },
            ];
          await route.fulfill({
            status,
            contentType: "application/json",
            body: JSON.stringify(body),
          });
        });
        await page.goto(origin + "/admin/seller-applications");
        await page
          .getByRole("heading", { name: "Store 0", exact: true })
          .waitFor();
        await page
          .getByRole("button", {
            name: locale === "fr" ? "Page suivante" : "Next page",
            exact: true,
          })
          .click();
        await page
          .getByRole("heading", { name: "Store 50", exact: true })
          .waitFor();
        assert.deepEqual(pages, [0, 1]);
        for (const value of [
          "https://store.example.test",
          "Pokemon",
          "Spreadsheet",
          "10k-20k",
        ])
          await page.getByText(value, { exact: true }).waitFor();
        assert.equal(await page.locator("section form").count(), 1);
        await page
          .getByRole("button", {
            name: locale === "fr" ? "Page précédente" : "Previous page",
            exact: true,
          })
          .click();
        await page
          .getByRole("heading", { name: "Store 0", exact: true })
          .waitFor();
        await page.goto(origin + "/seller/team");
        await page.locator("input[name=userId]").fill("owner");
        await page.locator("select[name=role]").selectOption("");
        await page.locator("form button").click();
        await page.getByRole("alert").waitFor();
        assert.equal(await page.locator("input[name=userId]").count(), 1);
        await page.locator("select[name=role]").selectOption("owner");
        await page.locator("form button").click();
        await page.waitForFunction(
          () => !document.querySelector("[role=alert]"),
        );
        assert.equal(teamWrites, 2);
        await page.goto(origin + "/seller/dashboard");
        await page
          .getByText(
            locale === "fr"
              ? "90 071 992 547 409,93 $"
              : "$90,071,992,547,409.93",
            { exact: true },
          )
          .first()
          .waitFor();
        assert.equal(
          await page.evaluate(
            () => document.documentElement.scrollWidth > innerWidth,
          ),
          false,
        );
        await context.close();
      }
  console.log(
    "C01-C04 seller UI regressions passed in 8 locale/theme/viewport combinations.",
  );
} finally {
  await browser.close();
}
