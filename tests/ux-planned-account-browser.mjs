import { chromium, expect } from "@playwright/test";
import assert from "node:assert/strict";
const b = await chromium.launch({ channel: "msedge", headless: true });
try {
  for (const lang of ["en", "fr"]) {
    const p = await b.newPage({ viewport: { width: 390, height: 844 } });
    for (const route of [
      "notifications",
      "wishlist",
      "price-alerts",
      "following",
    ]) {
      await p.goto(`http://localhost:4313/account/${route}?lang=${lang}`);
      await expect(p.locator("main")).not.toContainText(
        lang === "fr"
          ? "messages liés aux commandes"
          : "Order-specific messages",
      );
      await expect(p.locator("main")).toContainText(
        lang === "fr" ? "prévu" : "planned",
      );
      if (["wishlist", "price-alerts"].includes(route))
        await expect(p.locator('main a[href^="/want-lists"]')).toBeVisible();
      await expect(p.locator("main input,main form")).toHaveCount(0);
      assert.equal(
        await p.evaluate(
          () => document.documentElement.scrollWidth <= innerWidth,
        ),
        true,
      );
    }
    await p.close();
  }
  console.log("8 contextual planned-account states pass");
} finally {
  await b.close();
}
