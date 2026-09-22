import { chromium, expect } from "@playwright/test";
import assert from "node:assert/strict";
import { writeFile } from "node:fs/promises";
const data = await (
  await globalThis.fetch("http://localhost:4313/api/catalog/page?path=/")
).json();
const b = await chromium.launch({ channel: "msedge", headless: true });
const evidence = [];
try {
  for (const width of [390, 1440])
    for (const theme of ["light", "dark"]) {
      const p = await b.newPage({
        viewport: { width, height: 900 },
        reducedMotion: "reduce",
      });
      for (const game of data.games) {
        await p.goto(
          `http://localhost:4313/games/${game.slug}?lang=fr&theme=${theme}`,
        );
        await expect(p.locator(".troc-game-hero h1")).toHaveText(game.name.fr);
        await expect(p.locator(".troc-market-card").first()).toBeVisible();
        if (game.slug === "riftbound") {
          await expect(p.locator(".troc-game-hero-art")).toHaveCount(0);
        }
        assert.equal(
          await p.evaluate(
            () => document.documentElement.scrollWidth <= innerWidth,
          ),
          true,
        );
        const labels = await p.locator(".troc-market-card").allTextContents();
        evidence.push({
          width,
          theme,
          game: game.slug,
          renderedCards: labels.length,
        });
        await p.screenshot({
          path: `verification/ux-game-coverage-${game.slug}-${width}-${theme}.png`,
        });
      }
      await p.goto(
        `http://localhost:4313/style-guide?lang=fr&theme=${theme}#page=editorial`,
      );
      await expect(
        p.getByRole("heading", {
          name: "Compositions éditoriales",
          exact: true,
        }),
      ).toBeVisible();
      await p.screenshot({
        path: `verification/ux-guide-current-${width}-${theme}.png`,
      });
      await p.close();
    }
  await writeFile(
    "verification/ux-game-coverage.json",
    JSON.stringify(evidence, null, 2),
  );
  console.log(
    `${evidence.length} game render checks and4 style-guide entries passed`,
  );
} finally {
  await b.close();
}
