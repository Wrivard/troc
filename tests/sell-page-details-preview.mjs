import { chromium, expect } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";
import assert from "node:assert/strict";
import fs from "node:fs/promises";
import { commerceConfig } from "../artifacts/api-server/src/modules/commerce/config.ts";
const browser = await chromium.launch({ channel: "chrome", headless: true });
const results = [];
try {
  for (const [width, lang, theme] of [
    [1440, "en", "dark"],
    [834, "fr", "light"],
    [390, "en", "light"],
    [320, "fr", "dark"],
  ]) {
    const context = await browser.newContext({
      viewport: { width, height: 1000 },
      reducedMotion: "reduce",
    });
    const page = await context.newPage();
    const errors = [];
    page.on("pageerror", (e) => errors.push(e.message));
    let writes = 0;
    page.on("request", (r) => {
      if (!["GET", "HEAD"].includes(r.method())) writes++;
    });
    await page.goto(`http://127.0.0.1:4318/?lang=${lang}&theme=${theme}`);
    const root = page.locator(".troc-sell-details");
    await expect(root).toBeVisible();
    const pct = (bps) =>
      new Intl.NumberFormat(`${lang}-CA`, {
        style: "percent",
        maximumFractionDigits: 2,
      }).format(bps / 10000);
    const money = (c) =>
      new Intl.NumberFormat(`${lang}-CA`, {
        style: "currency",
        currency: "CAD",
      }).format(c / 100);
    await expect(root.locator("[data-fee=commission]")).toHaveText(
      pct(commerceConfig.commissionBps),
    );
    await expect(root.locator("[data-fee=shipping]")).toHaveText(
      pct(commerceConfig.shippingCommissionBps),
    );
    await expect(root.locator("[data-fee=promoted]")).toHaveText(
      "+" + pct(commerceConfig.promotedBps),
    );
    await expect(root.locator("[data-fee=processing]")).toHaveText(
      pct(commerceConfig.processingBps) +
        " + " +
        money(commerceConfig.processingFixedCents),
    );
    assert.equal(await page.getByRole("heading", { level: 1 }).count(), 1);
    assert.equal(
      await page.evaluate(
        () => document.documentElement.scrollWidth > innerWidth,
      ),
      false,
    );
    await expect(root.locator("ol li")).toHaveCount(3);
    await expect(root.locator(".troc-sell-fees")).toContainText(
      lang === "fr" ? "DÉMONSTRATION" : "DEMO",
    );
    const links = root.getByRole("link");
    for (let i = 0; i < (await links.count()); i++) {
      const link = links.nth(i);
      await link.focus();
      await expect(link).toBeFocused();
      const href = await link.getAttribute("href");
      assert.ok(href.endsWith(`?lang=${lang}`));
      const response = await context.request.get(href);
      assert.equal(response.status(), 200);
    }
    const axe = await new AxeBuilder({ page })
      .include(".troc-sell-details")
      .analyze();
    assert.equal(
      axe.violations.length,
      0,
      JSON.stringify(axe.violations.map((v) => v.id)),
    );
    await root.screenshot({
      path: `verification/sell-details-${width}-${lang}-${theme}.jpg`,
    });
    assert.deepEqual(errors, []);
    assert.equal(writes, 0);
    results.push({
      width,
      lang,
      theme,
      feesMatchConfig: true,
      links: 2,
      axe: 0,
      writes,
    });
    await context.close();
  }
  await fs.writeFile(
    "verification/sell-details.json",
    JSON.stringify(results, null, 2),
  );
  console.log(results);
} finally {
  await browser.close();
}
