import { chromium, expect } from "@playwright/test";
import assert from "node:assert/strict";
import AxeBuilder from "@axe-core/playwright";
const b = await chromium.launch({ channel: "msedge", headless: true });
try {
  for (const width of [390, 1440])
    for (const lang of ["en", "fr"]) {
      const context = await b.newContext({
        viewport: { width, height: 900 },
        reducedMotion: "reduce",
      });
      const p = await context.newPage();
      await p.goto(`http://localhost:4313/collection?lang=${lang}`);
      await expect(
        p.locator(".troc-preview-binder-grid img").first(),
      ).toBeVisible();
      const names = await p
        .locator(".troc-preview-binder-grid img")
        .evaluateAll((imgs) => imgs.map((i) => i.alt));
      assert.ok(!names.some((n) => /Amoonguss|Bellossom/.test(n)));
      await p.goto(`http://localhost:4313/want-lists?lang=${lang}`);
      await expect(p.locator(".troc-preview-binder h3").first()).toBeVisible();
      await expect(p.locator(".troc-preview-binder progress")).toHaveCount(0);
      await expect(p.locator(".troc-preview-binder")).not.toContainText(
        "162 / 207",
      );
      await expect(p.locator('main a[href^="/collection"]')).toBeVisible();
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
        path: `verification/ux-info-want-${width}-${lang}.png`,
        fullPage: true,
      });
      await p.goto(`http://localhost:4313/?lang=${lang}`);
      await p.locator('footer a[href*="#demo"]').click();
      await expect(p.locator("#demo")).toBeFocused();
      await expect(p.locator("#demo")).toBeInViewport();
      await context.close();
    }
  console.log(
    "4 information cases pass: scoped binder art, distinct planned want list, contextual link, accessibility and footer deep link",
  );
} finally {
  await b.close();
}
