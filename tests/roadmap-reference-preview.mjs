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
    [600, "fr", "light"],
    [601, "fr", "dark"],
    [1199, "fr", "light"],
    [1200, "fr", "dark"],
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
    const columns = width >= 1200 ? 4 : width > 600 ? 2 : 1;
    const rows = [];
    for (const item of layout) {
      const row = rows.find((row) => Math.abs(row.y - item.cardY) < 1);
      if (row) row.count++;
      else rows.push({ y: item.cardY, count: 1 });
    }
    assert.deepEqual(
      rows.map((row) => row.count),
      columns === 4
        ? [4, 3]
        : columns === 2
          ? [2, 2, 2, 1]
          : [1, 1, 1, 1, 1, 1, 1],
    );
    for (let i = 1; i < layout.length; i++) {
      const row = Math.floor(i / columns);
      if (i % columns !== 0)
        assert.ok(
          row % 2
            ? layout[i].cardX < layout[i - 1].cardX
            : layout[i].cardX > layout[i - 1].cardX,
          "Wrong snake direction",
        );
      else if (columns > 1)
        assert.ok(
          Math.abs(layout[i].cardX - layout[i - 1].cardX) < 1,
          "Row turn not aligned",
        );
    }
    await expect(root.locator(".troc-roadmap-connections path")).toHaveCount(6);
    await expect
      .poll(() =>
        root
          .locator(".troc-roadmap-connections")
          .evaluate(
            (svg) =>
              Math.abs(
                svg.viewBox.baseVal.width -
                  svg.parentElement.getBoundingClientRect().width,
              ) < 1,
          ),
      )
      .toBe(true);
    const connectors = await root
      .locator(".troc-roadmap-timeline-wrap")
      .evaluate((wrap) => {
        const base = wrap.getBoundingClientRect();
        const points = Array.from(wrap.querySelectorAll("path")).map((p) =>
          JSON.parse(p.dataset.points),
        );
        const cards = Array.from(wrap.querySelectorAll("article")).map((c) => {
          const r = c.getBoundingClientRect();
          return {
            x: r.x - base.x,
            y: r.y - base.y,
            right: r.right - base.x,
            bottom: r.bottom - base.y,
          };
        });
        const markers = Array.from(
          wrap.querySelectorAll(".troc-roadmap-marker"),
        ).map((m) => {
          const r = m.getBoundingClientRect();
          return {
            x: r.x + r.width / 2 - base.x,
            y: r.y + r.height / 2 - base.y,
          };
        });
        return { points, cards, markers };
      });
    connectors.points.forEach((points, index) => {
      assert.ok(
        Math.hypot(
          points[0][0] - connectors.markers[index].x,
          points[0][1] - connectors.markers[index].y,
        ) < 1,
      );
      const last = points.at(-1);
      assert.ok(
        Math.hypot(
          last[0] - connectors.markers[index + 1].x,
          last[1] - connectors.markers[index + 1].y,
        ) < 1,
      );
      for (let j = 1; j < points.length; j++) {
        const [x1, y1] = points[j - 1],
          [x2, y2] = points[j];
        for (const card of connectors.cards) {
          const crosses =
            Math.abs(y1 - y2) < 0.1
              ? y1 > card.y + 1 &&
                y1 < card.bottom - 1 &&
                Math.max(x1, x2) > card.x + 1 &&
                Math.min(x1, x2) < card.right - 1
              : x1 > card.x + 1 &&
                x1 < card.right - 1 &&
                Math.max(y1, y2) > card.y + 1 &&
                Math.min(y1, y2) < card.bottom - 1;
          assert.equal(crosses, false, "Connector crosses card");
        }
      }
    });
    if (columns > 1)
      assert.ok(
        connectors.points.some((points) => points.length === 4),
        "Missing snake row connector",
      );
    else
      assert.ok(
        connectors.points.every(
          (points) => points.length === 2 && points[0][0] === points[1][0],
        ),
      );
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
    if (width >= 1200)
      await root.screenshot({
        path: `verification/roadmap-${width}-${lang}-${theme}.jpg`,
      });
    else {
      await root.locator("header").screenshot({
        path: `verification/roadmap-${width}-${lang}-${theme}-heading.jpg`,
      });
      await root
        .locator(".troc-roadmap-timeline>li")
        .nth(2)
        .screenshot({
          path: `verification/roadmap-${width}-${lang}-${theme}-current.jpg`,
        });
      await root.locator(".troc-roadmap-closing").screenshot({
        path: `verification/roadmap-${width}-${lang}-${theme}-closing.jpg`,
      });
    }
    if (width === 1440 || width === 768) {
      await root.locator(".troc-roadmap-timeline-wrap").screenshot({
        path: `verification/roadmap-return-${width}-${lang}-${theme}.jpg`,
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
