import { chromium, expect } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";
import assert from "node:assert/strict";
import { writeFile } from "node:fs/promises";
const browser = await chromium.launch({ channel: "msedge", headless: true });
const results = [];
try {
  for (const lang of ["en", "fr"])
    for (const theme of ["dark", "light"])
      for (const reducedMotion of ["reduce", "no-preference"]) {
        const context = await browser.newContext({
          viewport: { width: 1280, height: 900 },
          reducedMotion,
        });
        const page = await context.newPage();
        await page.goto(`http://localhost:5173/?lang=${lang}&theme=${theme}`);
        const display = page.locator(".troc-card-showcase--showroom");
        await expect(display.locator("img").first()).toHaveAttribute(
          "alt",
          "Bulbasaur",
        );
        await expect(display.locator("img").first()).not.toHaveJSProperty(
          "naturalWidth",
          0,
        );
        const box = await display.boundingBox();
        await page.mouse.move(
          box.x + box.width * 0.75,
          box.y + box.height * 0.5,
        );
        const style = await display.evaluate((el) => ({
          x: el.style.getPropertyValue("--showroom-x"),
          animation: globalThis.getComputedStyle(el).animationName,
          z: [...el.querySelectorAll(".troc-card-showcase-item")].map((card) =>
            Number(globalThis.getComputedStyle(card).zIndex),
          ),
        }));
        assert.ok(style.z[0] > style.z[1] && style.z[0] > style.z[2]);
        if (reducedMotion === "reduce") {
          assert.ok(!style.x || style.x === "0deg");
          assert.equal(style.animation, "none");
        } else {
          assert.ok(Math.abs(parseFloat(style.x)) <= 2);
          assert.notEqual(parseFloat(style.x), 0);
        }
        await page.goto(`http://localhost:5173/search?lang=${lang}&theme=${theme}`);
        const refinements=page.locator('details').filter({has:page.locator('input[name="max"]')}).last();
        await refinements.locator('summary').click();
        await page.locator('input[name="max"]').fill('99');
        await page.locator('form').filter({has:page.locator('input[name="max"]')}).locator('button[type="submit"]').click();
        await expect(page).toHaveURL(/max=99/);
        await expect(page.locator('input[name="max"]')).toBeVisible();
        await page.goto(
          `http://localhost:5173/style-guide?lang=${lang}&theme=${theme}#page=editorial`,
        );
        await expect(
          page.getByRole("heading", {
            name:
              lang === "en"
                ? "Editorial compositions"
                : "Compositions éditoriales",
            exact: true,
          }),
        ).toBeVisible();
        await page.waitForTimeout(400); // Let the approved theme transition settle before measuring contrast.
        const violations = (
          await new AxeBuilder({ page })
            .withTags(["wcag2a", "wcag2aa", "wcag21aa"])
            .analyze()
        ).violations;
        assert.deepEqual(
          violations.map((v) => ({
            id: v.id,
            nodes: v.nodes.map((n) => n.target),
          })),
          [],
        );
        results.push({ lang, theme, reducedMotion, passed: true });
        await context.close();
      }
  await writeFile(
    "verification/design-refinement-browser.json",
    JSON.stringify({ results }, null, 2),
  );
  console.log(
    `Passed ${results.length} lead-card, motion and style-guide checks`,
  );
} finally {
  await browser.close();
}
