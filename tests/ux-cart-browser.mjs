import { chromium, expect } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";
import assert from "node:assert/strict";
import { writeFile } from "node:fs/promises";
const origin = "http://localhost:4313";
const search = await (
  await fetch(origin + "/api/catalog/page?path=/search&q=Pidgey")
).json();
const product = search.results.find(
  (r) => r.product.name.en === "Pidgey",
).product;
const detail = await (
  await fetch(origin + "/api/catalog/page?path=/product/" + product.slug)
).json();
const lines = [
  { listingId: detail.offers[0].id, quantity: 2, lockListing: true },
];
const browser = await chromium.launch({ channel: "msedge", headless: true });
const results = [];
try {
  for (const width of [390, 1440])
    for (const lang of ["en", "fr"])
      for (const theme of ["light", "dark"]) {
        const c = await browser.newContext({
          viewport: { width, height: 844 },
          reducedMotion: "reduce",
        });
        await c.addInitScript(
          (lines) =>
            localStorage.setItem("troc.cart.v1", JSON.stringify(lines)),
          lines,
        );
        const p = await c.newPage();
        const errors = [];
        p.on("pageerror", (e) => errors.push(e.message));
        await p.goto(origin + `/cart?lang=${lang}&theme=${theme}`);
        const summary = p.locator("#cart-summary");
        await expect(summary).toBeVisible();
        await expect(summary).toContainText(
          lang === "fr" ? "Total avant taxes" : "Total before taxes",
        );
        const coupon = summary.locator("details");
        await expect(coupon).not.toHaveAttribute("open", "");
        await expect(p.locator("main")).toContainText(
          lang === "fr"
            ? "1 référence · 2 exemplaires"
            : "1 line item · 2 units",
        );
        await p.locator('a[href="#cart-summary"]').click();
        await expect(summary).toBeInViewport();
        await coupon.locator("summary").click();
        await expect(coupon.locator("input")).toBeVisible();
        assert.equal(
          await p.evaluate(
            () => document.documentElement.scrollWidth <= innerWidth,
          ),
          true,
        );
        const violations = (
          await new AxeBuilder({ page: p })
            .withTags(["wcag2a", "wcag2aa", "wcag21aa"])
            .analyze()
        ).violations;
        assert.deepEqual(
          violations.map((v) => v.id),
          [],
        );
        await p.screenshot({
          path: `verification/ux-03-cart-${width}-${lang}-${theme}.png`,
        });
        await p.goto(origin + `/smart-cart?lang=${lang}&theme=${theme}`);
        const optimize = p.getByRole("button", { name: /Optimize|Optimiser/ });
        await expect(optimize).toBeEnabled();
        await optimize.click();
        await expect(
          p.getByRole("heading", {
            name:
              lang === "fr"
                ? "Aucun meilleur total trouvé"
                : "No better total found",
          }),
        ).toBeVisible();
        await expect(
          p.getByRole("button", { name: /Apply Smart|Appliquer Smart/ }),
        ).toHaveCount(0);
        await expect(p.locator(".troc-smart-savings")).toHaveCount(0);
        assert.deepEqual(
          await p.evaluate(() =>
            JSON.parse(localStorage.getItem("troc.cart.v1")),
          ),
          lines,
        );
        await p.screenshot({
          path: `verification/ux-03-smart-${width}-${lang}-${theme}.png`,
        });
        await p.goto(origin + `/checkout?lang=${lang}&theme=${theme}`);
        await expect(p.getByRole("alert")).toContainText(
          lang === "fr"
            ? "temporairement indisponible"
            : "temporarily unavailable",
        );
        await expect(p.locator("main form")).toHaveCount(0);
        await expect(
          p.getByRole("alert").locator('a[href^="/sign-in"]'),
        ).toHaveCount(0);
        await expect(
          p.getByRole("alert").locator('a[href^="/cart"]'),
        ).toBeVisible();
        assert.deepEqual(errors, []);
        results.push({ width, lang, theme, status: "passed" });
        await c.close();
      }
  await writeFile(
    "verification/ux-cart-browser.json",
    JSON.stringify({ origin, results }, null, 2) + "\n",
  );
  console.log(JSON.stringify(results));
} finally {
  await browser.close();
}
