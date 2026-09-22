import { chromium, expect } from "@playwright/test";
import assert from "node:assert/strict";
import AxeBuilder from "@axe-core/playwright";
const origin = "http://localhost:4313";
const data = await (
  await globalThis.fetch(origin + "/api/catalog/page?path=/games/pokemon")
).json();
const set = "/sets/" + data.sets.find((s) => s.name.en === "151").slug;
const b = await chromium.launch({ channel: "msedge", headless: true });
try {
  for (const width of [390, 1440])
    for (const lang of ["en", "fr"]) {
      const context = await b.newContext({
        viewport: { width, height: 844 },
        reducedMotion: "reduce",
      });
      const p = await context.newPage();
      for (const path of ["/games/pokemon", "/games/magic", set]) {
        await p.goto(`${origin}${path}?lang=${lang}`);
        const jump = p.locator('.troc-game-hero a[href="#catalog-results"]');
        await jump.focus();
        await jump.press("Enter");
        const count = p.locator("#catalog-results");
        await expect(count).toBeFocused();
        await expect(count).toBeInViewport();
        await expect(p.locator(".troc-market-card").first()).toBeInViewport();
        await expect(
          p.getByRole("heading", { name: /Explorer les séries|Browse sets/ }),
        ).toHaveCount(0);
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
      }
      await p.goto(`${origin}${set}?lang=${lang}&q=zznomatch`);
      await expect(p.locator(".troc-search-empty")).toBeVisible();
      await expect(p.locator('main a[href^="/collection"]')).toHaveCount(0);
      await p.locator(".troc-search-empty a").click();
      assert.equal(new URL(p.url()).pathname, set);
      assert.equal(new URL(p.url()).searchParams.get("lang"), lang);
      await expect(p.locator(".troc-market-card").first()).toBeVisible();
      await p.screenshot({
        path: `verification/ux-game-set-after-${width}-${lang}.png`,
      });
      await context.close();
    }
  console.log(
    "12 game/set keyboard+axe cases and4 set no-results reset cases pass",
  );
} finally {
  await b.close();
}
