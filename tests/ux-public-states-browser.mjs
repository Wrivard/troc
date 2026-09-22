import { chromium, expect } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";
import assert from "node:assert/strict";
const b = await chromium.launch({ channel: "msedge", headless: true });
try {
  for (const width of [390, 1440])
    for (const lang of ["en", "fr"])
      for (const status of [404, 503]) {
        const c = await b.newContext({
          viewport: { width, height: 844 },
          reducedMotion: "reduce",
        });
        const p = await c.newPage();
        await p.route("**/api/catalog/page?**", (r) =>
          r.fulfill({ status, json: { error: "fixture" } }),
        );
        await p.goto(`http://localhost:4313/search?lang=${lang}`);
        await expect(p.getByRole("alert")).toBeVisible();
        await expect(p.locator("main h1")).toBeVisible();
        await expect(p.locator("header")).toBeVisible();
        await expect(p.locator("footer")).toBeVisible();
        const home = p.getByRole("alert").locator("a");
        await expect(home).toHaveAttribute("href", `/?lang=${lang}`);
        assert.equal(
          await p.evaluate(
            () => document.documentElement.scrollWidth <= innerWidth,
          ),
          true,
        );
        assert.deepEqual(
          (
            await new AxeBuilder({ page: p })
              .withTags(["wcag2a", "wcag2aa", "wcag21aa"])
              .analyze()
          ).violations.map((v) => v.id),
          [],
        );
        await p.screenshot({
          path: `verification/ux-public-${status}-${width}-${lang}.png`,
        });
        await p.unrouteAll();
        await p.getByRole("alert").getByRole("button").click();
        await expect(p.locator(".troc-market-card").first()).toBeVisible();
        await c.close();
      }
  const c = await b.newContext({ viewport: { width: 390, height: 844 } });
  const p = await c.newPage();
  let release;
  const gate = new Promise((r) => (release = r));
  await p.route("**/api/catalog/page?**", async (r) => {
    await gate;
    await r.continue();
  });
  await p.goto("http://localhost:4313/search?lang=fr");
  await expect(p.getByRole("status")).toBeVisible();
  await expect(p.locator("header").getByRole("searchbox")).toBeDisabled();
  await expect(p.locator("header")).toBeVisible();
  release();
  await expect(p.locator(".troc-market-card").first()).toBeVisible();
  await c.close();
  console.log("8 error/retry/shell/axe cases and slow-loading recovery pass");
} finally {
  await b.close();
}
