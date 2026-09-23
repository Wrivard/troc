import { chromium, expect } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";
import assert from "node:assert/strict";
import fs from "node:fs/promises";
const browser = await chromium.launch({ channel: "chrome", headless: true });
const results = [];
try {
  for (const theme of ["light", "dark"]) {
    const context = await browser.newContext({
      viewport: { width: 320, height: 740 },
    });
    const page = await context.newPage();
    await page.goto(`http://127.0.0.1:4315/?lang=fr&theme=${theme}`);
    await page.evaluate(() => document.fonts.ready);
    await page.getByRole("checkbox").check();
    await expect(page.locator(".troc-google-signin-button")).toBeEnabled();
    assert.ok(
      await page.evaluate(() =>
        document.fonts.check('500 14px "TROC Google Sans"'),
      ),
    );
    const result = await new AxeBuilder({ page })
      .include(".troc-google-signin")
      .analyze();
    assert.equal(
      result.violations.length,
      0,
      JSON.stringify(result.violations.map((v) => v.id)),
    );
    results.push({ theme, violations: 0, fontLoaded: true });
    await context.close();
  }
  await fs.writeFile(
    "verification/google-signin-accessibility.json",
    JSON.stringify(results, null, 2),
  );
  console.log(results);
} finally {
  await browser.close();
}
