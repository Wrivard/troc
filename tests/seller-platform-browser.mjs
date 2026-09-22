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
        const page = await context.newPage(),
          errors = [];
        page.on("pageerror", (e) => errors.push(e.message));
        await page.goto(origin + "/seller/dashboard");
        await page
          .getByText(
            locale === "fr"
              ? "Aucune vente réelle terminée admissible pour le moment."
              : "No eligible real completed sales yet.",
          )
          .waitFor();
        assert.equal(
          await page.evaluate(
            () => document.documentElement.scrollWidth > innerWidth,
          ),
          false,
        );
        await page.goto(origin + "/seller/team");
        await page
          .getByText("seller0@example.test", { exact: false })
          .waitFor();
        await page
          .locator("input[name=userId]")
          .fill("00000000-0000-4000-8000-000000000001");
        await page.locator("select[name=role]").selectOption("");
        await page.locator("form button").click();
        await page
          .getByRole("alert")
          .filter({
            hasText:
              locale === "fr"
                ? "Conservez au moins un propriétaire actif."
                : "Keep at least one active owner.",
          })
          .waitFor();
        assert.deepEqual(errors, []);
        await context.close();
      }
  const context = await browser.newContext();
  await context.addCookies([
    { name: "seller_applicant", value: "1", url: origin },
  ]);
  const page = await context.newPage();
  await page.goto(origin + "/seller/apply");
  await page.locator("input[name=contactName]").fill("New applicant");
  await page.locator("input[name=displayName]").fill("New store");
  await page.locator("input[name=adult]").check();
  await page.locator("form button").click();
  await page.getByText("New store — Submitted").waitFor();
  await context.clearCookies();
  await context.addCookies([{ name: "seller_admin", value: "1", url: origin }]);
  await page.goto(origin + "/admin/seller-applications");
  const row = page.locator("section").filter({
    has: page.getByRole("heading", { name: "New store", exact: true }),
  });
  await row.locator("textarea").fill("Manually reviewed in test");
  await row.locator("select").selectOption("approved");
  await row.locator("button").click();
  await row.getByText(/Approved/).waitFor();
  await context.clearCookies();
  await context.addCookies([
    { name: "seller_denied", value: "1", url: origin },
  ]);
  await page.goto(origin + "/seller/dashboard");
  await page.getByRole("alert").waitFor();
  assert.equal(
    await page.getByText("No eligible real completed sales yet.").count(),
    0,
  );
  await context.close();
  console.log(
    "Seller browser checks passed: 8 locale/theme/viewport cases, application, admin approval, last-owner and fail-closed flows.",
  );
} finally {
  await browser.close();
}
