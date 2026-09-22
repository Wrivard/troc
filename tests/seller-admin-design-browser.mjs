import { chromium, expect } from "@playwright/test";
import assert from "node:assert/strict";
import process from "node:process";
const origin = process.env.ADMIN_ORIGIN || "http://127.0.0.1:4313";
const browser = await chromium.launch({ channel: "msedge", headless: true });
const application = (id, status = "submitted") => ({
  id: `design-${id}`,
  contact_name: `Fixture ${id}`,
  status,
  province: "QC",
  profile: { displayName: `Fixture ${id}` },
  review_note: status === "approved" ? "Existing fixture review note" : null,
});
try {
  for (const lang of ["en", "fr"])
    for (const theme of ["light", "dark"]) {
      const page = await browser.newPage({
        viewport: { width: lang === "fr" ? 390 : 1440, height: 900 },
      });
      let paginated = false,
        posts = 0;
      await page.route("**/api/admin/seller-applications**", async (route) => {
        if (route.request().method() === "POST") {
          posts++;
          return route.fulfill({
            status: 503,
            json: { code: "service_unavailable" },
          });
        }
        const next =
          new URL(route.request().url()).searchParams.get("page") === "1";
        const data = paginated
          ? Array.from({ length: next ? 1 : 50 }, (_, i) =>
              application(i, "approved"),
            )
          : [application(0, "approved"), application(1)];
        await route.fulfill({ json: data });
      });
      await page.goto(
        `${origin}/admin/seller-applications?lang=${lang}&theme=${theme}`,
      );
      await expect(
        page.getByText("Existing fixture review note", { exact: true }),
      ).toBeVisible();
      const pager = page.getByRole("navigation", {
        name: lang === "fr" ? "Pages de demandes" : "Application pages",
      });
      await expect(pager).toHaveCount(0);
      const decision = page.locator('select[name="decision"]');
      await expect(decision).toHaveValue("");
      await page.locator('textarea[name="note"]').fill("Retain this draft");
      await page
        .getByRole("button", {
          name: lang === "fr" ? "Enregistrer la décision" : "Save decision",
          exact: true,
        })
        .click();
      assert.equal(
        await decision.evaluate((el) => el.validity.valueMissing),
        true,
      );
      assert.equal(posts, 0);
      for (const value of ["approved", "rejected"]) {
        await decision.selectOption(value);
        await page
          .getByRole("button", {
            name: lang === "fr" ? "Enregistrer la décision" : "Save decision",
            exact: true,
          })
          .click();
        await expect.poll(() => posts).toBe(value === "approved" ? 1 : 2);
        await expect(page.locator('textarea[name="note"]')).toHaveValue(
          "Retain this draft",
        );
        await expect(
          page.getByRole("button", {
            name: lang === "fr" ? "Enregistrer la décision" : "Save decision",
            exact: true,
          }),
        ).toBeEnabled();
      }
      assert.equal(
        await page.evaluate(
          () => document.documentElement.scrollWidth <= globalThis.innerWidth,
        ),
        true,
      );
      await page.screenshot({
        path: `verification/admin-design-${lang}-${theme}.png`,
        fullPage: true,
      });
      paginated = true;
      await page.reload();
      const next = pager.getByRole("button", {
        name: lang === "fr" ? "Page suivante" : "Next page",
      });
      const previous = pager.getByRole("button", {
        name: lang === "fr" ? "Page précédente" : "Previous page",
      });
      await expect(next).toBeEnabled();
      await next.click();
      await expect(previous).toBeEnabled();
      await expect(next).toBeDisabled();
      await previous.click();
      await expect(next).toBeEnabled();
      await expect(previous).toBeDisabled();
      await page.close();
      console.log(`PASS admin presentation ${lang}/${theme}`);
    }
} finally {
  await browser.close();
}
