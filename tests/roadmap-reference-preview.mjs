import { chromium, expect } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";
import assert from "node:assert/strict";
import fs from "node:fs/promises";
const b = await chromium.launch({ channel: "chrome", headless: true });
const results = [];
try {
  for (const [width, lang, theme] of [
    [1440, "en", "dark"],
    [1440, "fr", "dark"],
    [1672, "en", "dark"],
    [2540, "fr", "light"],
    [768, "fr", "light"],
    [1024, "en", "dark"],
    [320, "fr", "light"],
    [390, "en", "dark"],
  ]) {
    const c = await b.newContext({
      viewport: { width, height: 1050 },
      reducedMotion: "reduce",
    });
    const p = await c.newPage();
    const errors = [];
    p.on("pageerror", (e) => errors.push(e.message));
    await p.goto(`http://127.0.0.1:4313/roadmap?lang=${lang}&theme=${theme}`);
    const root = p.locator(".troc-roadmap-page");
    await expect(root).toBeVisible();
    await expect(p.locator("html")).toHaveAttribute(
      "data-theme",
      `troc-${theme}`,
    );
    await expect(p.getByRole("heading", { level: 1 })).toHaveCount(1);
    await expect(root.locator(".troc-roadmap-timeline>li")).toHaveCount(7);
    await expect(root.locator("[aria-current=step]")).toHaveCount(1);
    await expect(root.locator("[data-local=true]")).toHaveCount(8);
    assert.equal(
      await p.evaluate(() => document.documentElement.scrollWidth > innerWidth),
      false,
    );
    await expect
      .poll(() =>
        root
          .locator("img")
          .evaluateAll((images) =>
            images.every((i) => i.complete && i.naturalWidth > 0),
          ),
      )
      .toBe(true);
    const layout = await root
      .locator(".troc-roadmap-timeline>li")
      .evaluateAll((nodes) =>
        nodes.map((n) => {
          const r = n.getBoundingClientRect(),
            card = n.querySelector("article").getBoundingClientRect(),
            m = n.querySelector(".troc-roadmap-marker").getBoundingClientRect();
          return {
            cardX: card.x,
            cardY: card.y,
            cardW: card.width,
            cardH: card.height,
            markerX: m.x + m.width / 2,
            itemX: r.x,
          };
        }),
      );
    if (width >= 1300) {
      assert.ok(
        layout.every((r) => Math.abs(r.markerX - (r.cardX + r.cardW / 2)) < 1),
      );
      assert.ok(layout.every((r) => Math.abs(r.cardY - layout[0].cardY) < 1));
    } else {
      assert.ok(
        layout.every((r) => Math.abs(r.markerX - layout[0].markerX) < 1),
      );
      assert.ok(
        layout
          .slice(1)
          .every((r, i) => r.cardY > layout[i].cardY + layout[i].cardH),
      );
    }
    const link = root.getByRole("link", {
      name: lang === "fr" ? "Suivre notre parcours" : "Follow our journey",
    });
    await link.focus();
    await expect(link).toBeFocused();
    assert.equal(
      await link.evaluate((e) => globalThis.getComputedStyle(e).outlineStyle),
      "solid",
    );
    await expect(link).toHaveAttribute("href", `/about?lang=${lang}`);
    await expect(
      p
        .locator("footer")
        .last()
        .getByRole("link", {
          name: lang === "fr" ? "Feuille de route" : "Roadmap",
          exact: true,
        }),
    ).toHaveAttribute("href", `/roadmap?lang=${lang}`);
    const axe = await new AxeBuilder({ page: p })
      .include(".troc-roadmap-page")
      .analyze();
    assert.equal(
      axe.violations.length,
      0,
      JSON.stringify(
        axe.violations.map((v) => ({
          id: v.id,
          nodes: v.nodes.map((n) => n.target),
        })),
      ),
    );
    if (width >= 1300)
      await root.screenshot({
        path: `verification/roadmap-${width}-${lang}-${theme}.jpg`,
      });
    else {
      await root
        .locator("header")
        .screenshot({
          path: `verification/roadmap-${width}-${lang}-${theme}-heading.jpg`,
        });
      await root
        .locator(".troc-roadmap-timeline>li")
        .nth(2)
        .screenshot({
          path: `verification/roadmap-${width}-${lang}-${theme}-current.jpg`,
        });
      await root
        .locator(".troc-roadmap-closing")
        .screenshot({
          path: `verification/roadmap-${width}-${lang}-${theme}-closing.jpg`,
        });
    }
    if (width === 1672) {
      await link.press("Enter");
      await expect(p).toHaveURL(/\/about\?lang=en$/);
      await expect(p.getByRole("heading", { level: 1 })).toContainText(
        "Built here",
      );
    }
    assert.deepEqual(errors, []);
    results.push({
      width,
      lang,
      theme,
      orderedTimeline: true,
      axe: 0,
      leafLoaded: true,
    });
    await c.close();
  }
  await fs.writeFile(
    "verification/roadmap-responsive.json",
    JSON.stringify(results, null, 2),
  );
  console.log(results);
  const p = await b.newPage({ viewport: { width: 1440, height: 1000 } });
  await p.goto("http://127.0.0.1:4313/roadmap?lang=fr");
  await p.locator(".troc-roadmap-page").waitFor();
  const before = await p.evaluate(() => ({
    width: innerWidth,
    dpr: globalThis.devicePixelRatio,
    scale: globalThis.visualViewport.scale,
  }));
  await p.keyboard.press("Control+0");
  for (let i = 0; i < 4; i++) await p.keyboard.press("Control+Equal");
  const after = await p.evaluate(() => ({
    width: innerWidth,
    dpr: globalThis.devicePixelRatio,
    scale: globalThis.visualViewport.scale,
  }));
  console.log({
    zoomAttempt: {
      before,
      after,
      actual200:
        after.dpr / before.dpr === 2 &&
        Math.abs(after.width - before.width / 2) < 2,
    },
  });
  await fs.writeFile(
    "verification/roadmap-zoom-attempt.json",
    JSON.stringify({ before, after }, null, 2),
  );
  await p.close();
} finally {
  await b.close();
}
