import { chromium, expect } from "@playwright/test";
import assert from "node:assert/strict";
const b = await chromium.launch({ channel: "msedge", headless: true });
try {
  for (const lang of ["en", "fr"])
    for (const path of ["/store/cartes-du-nord", "/games/pokemon"]) {
      const p = await b.newPage({ viewport: { width: 390, height: 844 } });
      await p.goto(
        `http://localhost:4313${path}?lang=${lang}&max=99&sort=price`,
      );
      await p.locator(".troc-market-card").first().waitFor();
      const firstCard = await p
        .locator(".troc-market-card")
        .first()
        .getAttribute("href");
      await p
        .getByRole("link", {
          name: lang === "fr" ? "Page suivante" : "Next page",
          exact: true,
        })
        .click();
      await p
        .getByRole("link", {
          name: lang === "fr" ? "Première page" : "First page",
          exact: true,
        })
        .click();
      const url = new URL(p.url());
      assert.equal(url.pathname, path);
      assert.equal(url.searchParams.get("max"), "99");
      assert.equal(url.searchParams.get("sort"), "price");
      assert.equal(url.searchParams.get("lang"), lang);
      assert.equal(url.searchParams.has("cursor"), false);
      await expect(p.locator(".troc-market-card").first()).toHaveAttribute(
        "href",
        firstCard,
      );
      await p.close();
    }
  console.log("4 store/game first-page filter preservation cases pass");
} finally {
  await b.close();
}
