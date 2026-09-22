import { chromium, expect } from "@playwright/test";
import assert from "node:assert/strict";
import AxeBuilder from "@axe-core/playwright";
import { writeFile } from "node:fs/promises";
const b = await chromium.launch({ channel: "msedge", headless: true });
const results = [];
try {
  for (const width of [390, 768, 1440])
    for (const lang of ["en", "fr"])
      for (const theme of ["light", "dark"]) {
        const context = await b.newContext({
          viewport: { width, height: 844 },
          reducedMotion: "reduce",
        });
        const p = await context.newPage();
        await p.goto(
          `http://localhost:4313/store/cartes-du-nord?lang=${lang}&theme=${theme}`,
        );
        const action = p.locator(".troc-store-profile-actions a");
        await expect(action).toBeVisible();
        const box = await action.boundingBox();
        assert.ok(box.y + box.height <= 844, `CTA ${width}/${lang}: ${box.y}`);
        await p.screenshot({
          path: `verification/ux-05-store-${width}-${lang}-${theme}.png`,
        });
        await action.focus();
        await action.press("Enter");
        await expect(p.locator("#catalog-results")).toBeFocused();
        await expect(p.locator("#catalog-results")).toBeInViewport();
        await p
          .getByRole("button", {
            name: lang === "fr" ? "À propos" : "About",
            exact: true,
          })
          .click();
        await action.click();
        await expect(p.locator("#catalog-results")).toBeFocused();
        await p.getByRole("button", { name: /under|moins/i }).click();
        await expect(p).toHaveURL(/max=99/);
        await expect(p).toHaveURL(/sort=price/);
        await expect(p).toHaveURL(new RegExp(`lang=${lang}`));
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
        for (const route of ["sign-in", "sign-up"]) {
          await p.goto(
            `http://localhost:4313/${route}?lang=${lang}&theme=${theme}`,
          );
          await expect(p.locator("input[name=password]")).toBeVisible();
          await expect(p.locator("#password-hint")).toHaveCount(
            route === "sign-up" ? 1 : 0,
          );
        }
        results.push({
          width,
          lang,
          theme,
          status: "passed",
          ctaBottom: box.y + box.height,
        });
        await context.close();
      }
  await writeFile(
    "verification/ux-store-account-browser.json",
    JSON.stringify({ results }, null, 2),
  );
  console.log(JSON.stringify(results));
} finally {
  await b.close();
}
