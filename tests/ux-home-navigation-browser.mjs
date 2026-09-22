import { chromium, expect } from "@playwright/test";
import assert from "node:assert/strict";
const b = await chromium.launch({ channel: "msedge", headless: true });
try {
  for (const width of [390, 1440])
    for (const lang of ["en", "fr"]) {
      const context = await b.newContext({
        viewport: { width, height: 900 },
        reducedMotion: "reduce",
      });
      const p = await context.newPage();
      await p.goto(`http://localhost:4313/?lang=${lang}`);
      await expect(p.locator(".troc-home-hero .troc-art-note")).toHaveText(
        lang === "fr" ? "Marché de démonstration" : "Demo marketplace",
      );
      for (const path of ["/sell", "/collection"]) {
        const link = p.locator(`.troc-site-nav a[href="${path}?lang=${lang}"]`);
        await expect(link).toBeVisible();
        const promise = context.waitForEvent("page");
        await link.click({ modifiers: ["Control"] });
        const popup = await promise;
        await popup.waitForLoadState();
        assert.equal(new URL(popup.url()).pathname, path);
        assert.equal(new URL(popup.url()).searchParams.get("lang"), lang);
        await popup.close();
        await link.focus();
        await link.press("Enter");
        assert.equal(new URL(p.url()).pathname, path);
        await p.goBack();
      }
      await context.close();
    }
  console.log(
    "4 homepage cases: demo copy and native Sell/Collect Enter/Ctrl-click pass",
  );
} finally {
  await b.close();
}
