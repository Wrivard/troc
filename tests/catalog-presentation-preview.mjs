import { chromium, expect } from "@playwright/test";
import assert from "node:assert/strict";
import fs from "node:fs/promises";
const browser = await chromium.launch({ channel: "chrome", headless: true });
const results = [];
try {
  for (const [width, lang, theme, max] of [
    [1440, "en", "dark", false],
    [1920, "fr", "light", true],
    [834, "en", "dark", false],
    [390, "fr", "light", true],
    [320, "fr", "dark", false],
  ]) {
    const page = await browser.newPage({
      viewport: { width, height: 1000 },
      reducedMotion: "reduce",
    });
    await page.addInitScript(
      ({ lang, theme }) => {
        globalThis.localStorage.setItem("troc.locale", lang);
        globalThis.localStorage.setItem("troc.theme", theme);
      },
      { lang, theme },
    );
    await page.goto(
      `http://127.0.0.1:4313/search?lang=${lang}${max ? "&max=99" : ""}`,
    );
    await expect(page.locator(".troc-browse")).toBeVisible();
    await expect
      .poll(() =>
        page
          .locator(".troc-browse .troc-market-card img")
          .first()
          .evaluate(
            (img) =>
              img.complete &&
              img.naturalWidth > 0 &&
              img.getBoundingClientRect().width > 50,
          ),
      )
      .toBe(true);
    const links = await page
      .locator(".troc-browse .troc-market-card")
      .evaluateAll((cards) =>
        cards.map((c) => ({
          href: c.getAttribute("href"),
          text: c.textContent,
        })),
      );
    assert.ok(links.length > 0);
    const views = [];
    for (const [view, label] of [
      ["large", lang === "fr" ? "Grande grille" : "Large grid"],
      ["compact", lang === "fr" ? "Grille compacte" : "Compact grid"],
      ["list", lang === "fr" ? "Liste" : "List view"],
    ]) {
      await page.getByRole("button", { name: label, exact: true }).click();
      await expect(page.locator(".troc-browse")).toHaveAttribute(
        "data-view",
        view,
      );
      const g = await page
        .locator(".troc-browse .troc-editorial-catalog")
        .evaluate((el) => ({
          columns: globalThis.getComputedStyle(el).gridTemplateColumns,
          overflow: document.documentElement.scrollWidth > innerWidth,
        }));
      assert.equal(g.overflow, false, `${width} ${view} overflow`);
      assert.deepEqual(
        await page
          .locator(".troc-browse .troc-market-card")
          .evaluateAll((cards) =>
            cards.map((c) => ({
              href: c.getAttribute("href"),
              text: c.textContent,
            })),
          ),
        links,
      );
      await expect
        .poll(() =>
          page
            .locator(".troc-browse .troc-market-card img")
            .evaluateAll((images) =>
              images
                .filter((img) => {
                  const r = img.getBoundingClientRect();
                  return r.top < globalThis.innerHeight && r.bottom > 0;
                })
                .every((img) => img.complete && img.naturalWidth > 0),
            ),
        )
        .toBe(true);
      await page.screenshot({
        path: `verification/catalog-${width}-${lang}-${theme}-${view}.jpg`,
        fullPage: false,
      });
      views.push({ view, ...g });
    }
    await page.reload();
    await expect(page.locator(".troc-browse")).toHaveAttribute(
      "data-view",
      "list",
    );
    if (width < 1024) {
      await page
        .getByRole("button", {
          name: lang === "fr" ? "Filtres" : "Filters",
          exact: true,
        })
        .click();
      const dialog = page.getByRole("dialog");
      await expect(dialog).toBeVisible();
      for (let i = 0; i < 15; i++) {
        await page.keyboard.press("Tab");
        assert.ok(
          await dialog.evaluate((el) => el.contains(document.activeElement)),
          "focus stays in drawer",
        );
      }
      await expect
        .poll(() =>
          page
            .locator(".troc-browse .troc-market-card img")
            .evaluateAll((images) =>
              images
                .filter((img) => {
                  const r = img.getBoundingClientRect();
                  return r.top < globalThis.innerHeight && r.bottom > 0;
                })
                .every((img) => img.complete && img.naturalWidth > 0),
            ),
        )
        .toBe(true);
      await page.screenshot({
        path: `verification/catalog-${width}-drawer.jpg`,
      });
      await page.keyboard.press("Escape");
      await expect(dialog).not.toBeVisible();
      await expect(
        page.getByRole("button", {
          name: lang === "fr" ? "Filtres" : "Filters",
          exact: true,
        }),
      ).toBeFocused();
    }
    results.push({ width, lang, theme, max, products: links.length, views });
    await page.close();
  }
  await fs.writeFile(
    "verification/catalog-presentation.json",
    JSON.stringify(results, null, 2),
  );
  console.log(JSON.stringify(results));
} finally {
  await browser.close();
}
