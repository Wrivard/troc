import { chromium, expect } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";
import assert from "node:assert/strict";
import { writeFile } from "node:fs/promises";
const origin = "http://localhost:4313";
const b = await chromium.launch({ channel: "msedge", headless: true });
const results = [];
try {
  for (const width of [390, 1440])
    for (const lang of ["en", "fr"])
      for (const theme of ["dark", "light"]) {
        const c = await b.newContext({
          viewport: { width, height: 844 },
          reducedMotion: "reduce",
        });
        const p = await c.newPage();
        await p.goto(origin + `/search?lang=${lang}&theme=${theme}`);
        await p.locator(".troc-market-card").first().waitFor();
        await p
          .getByRole("button", {
            name: theme === "light" ? "TROC Light" : "TROC Dark",
            exact: true,
          })
          .click();
        await p.waitForTimeout(400);
        const card = p.locator(".troc-market-card").first();
        const price = await card
          .locator(".troc-market-card-price")
          .boundingBox();
        if (width === 390)
          assert.ok(
            price.y + price.height <= 844,
            JSON.stringify({ width, lang, price }),
          );
        await p.screenshot({
          path: `verification/ux-02-search-${width}-${lang}-${theme}.png`,
        });
        await p.goto(
          origin +
            `/search?lang=${lang}&theme=${theme}&q=Pidgey&max=99&condition=NM`,
        );
        await expect(p.locator(".troc-applied-filters")).toContainText(
          "Pidgey",
        );
        await expect(p.locator(".troc-applied-filters")).toContainText(
          lang === "fr" ? "0,99" : "0.99",
        );
        await p
          .locator(".troc-applied-filters button")
          .filter({ hasText: "" })
          .first()
          .click();
        await expect(p).not.toHaveURL(/[?&]q=/);
        await expect(p).toHaveURL(/max=99/);
        await expect(p).toHaveURL(/condition=NM/);
        await p.goBack();
        await expect(p.locator(".troc-applied-filters")).toContainText(
          "Pidgey",
        );
        await p.goto(
          origin + `/search?lang=${lang}&theme=${theme}&q=zzzauditintrouvable`,
        );
        await expect(p.locator(".troc-search-heading")).toContainText(
          "zzzauditintrouvable",
        );
        const empty = p.locator(".troc-search-empty");
        await expect(empty).toBeVisible();
        const edit = empty.getByRole("button");
        await expect(edit).toBeInViewport();
        await edit.click();
        await expect(p.locator('input[name="q"]')).toBeFocused();
        await expect(p.locator('input[name="q"]')).toHaveValue(
          "zzzauditintrouvable",
        );
        await empty.locator("a").click();
        await expect(p).not.toHaveURL(/[?&]q=/);
        await expect(p).toHaveURL(new RegExp("lang=" + lang));
        await expect(p.locator(".troc-market-card").first()).toBeVisible();
        await expect(p.locator("html")).toHaveAttribute(
          "data-theme",
          "troc-" + theme,
        );
        await p.waitForTimeout(400);
        assert.ok(
          await p.evaluate(
            () => document.documentElement.scrollWidth <= innerWidth,
          ),
        );
        const violations = (
          await new AxeBuilder({ page: p })
            .withTags(["wcag2a", "wcag2aa", "wcag21aa"])
            .analyze()
        ).violations;
        assert.deepEqual(
          violations.map((v) => ({
            id: v.id,
            targets: v.nodes.map((n) => n.target),
          })),
          [],
        );
        results.push({
          width,
          lang,
          theme,
          firstPriceY: price.y,
          passed: true,
        });
        await c.close();
      }
  await writeFile(
    "verification/ux-search-browser.json",
    JSON.stringify({ results }, null, 2),
  );
  console.log(
    `Passed ${results.length} search context, filter removal/back, recovery and accessibility cases`,
  );
} finally {
  await b.close();
}
