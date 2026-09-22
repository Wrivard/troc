import { chromium, expect } from "@playwright/test";
import assert from "node:assert/strict";
const browser = await chromium.launch({ channel: "chrome", headless: true });
try {
  for (const width of [390, 1440])
    for (const lang of ["en", "fr"])
      for (const theme of ["light", "dark"]) {
        const page = await browser.newPage({
          viewport: { width, height: 900 },
          reducedMotion: "reduce",
        });
        await page.addInitScript(
          ({ lang, theme }) => {
            globalThis.localStorage.setItem("troc.locale", lang);
            globalThis.localStorage.setItem("troc.theme", theme);
          },
          { lang, theme },
        );
        await page.goto(`http://127.0.0.1:4313/?lang=${lang}`);
        const stats = page.locator(".troc-marketplace-stats");
        await stats.waitFor();
        assert.equal(
          await stats.evaluate((el) =>
            el.previousElementSibling.classList.contains("troc-home-hero"),
          ),
          true,
        );
        await expect(stats.locator(".troc-metric")).toHaveCount(4);
        await expect(stats.locator(".troc-metric-value")).toHaveText([
          "—",
          "—",
          "—",
          "—",
        ]);
        await expect(stats).toContainText(
          lang === "fr"
            ? "ne représente pas l’activité réelle"
            : "does not represent live marketplace activity",
        );
        assert.equal(
          await page
            .locator(".troc-home-hero")
            .evaluate((el) => globalThis.getComputedStyle(el).backgroundColor),
          "rgba(0, 0, 0, 0)",
        );
        await expect(page.locator(".troc-value-rail")).toHaveCount(0);
        await expect(page.locator(".troc-canada-edit")).toHaveCount(0);
        await expect(page.locator(".troc-about-home h3")).toHaveCount(4);
        await expect(page.locator("h1")).toHaveCount(1);
        assert.equal(
          await page.evaluate(
            () => document.documentElement.scrollWidth > globalThis.innerWidth,
          ),
          false,
        );
        assert.equal(
          await stats.evaluate(
            (el) =>
              globalThis
                .getComputedStyle(el.querySelector(".troc-stats-grid"))
                .gridTemplateColumns.split(" ").length,
          ),
          width === 390 ? 2 : 4,
        );
        await stats.scrollIntoViewIfNeeded();
        await page.screenshot({
          path: `verification/stats-${width}-${lang}-${theme}.png`,
        });
        await page.locator(".troc-about-home").screenshot({
          path: `verification/about-${width}-${lang}-${theme}.png`,
        });
        const aboutLink = page.locator(".troc-about-home a");
        await aboutLink.focus();
        await expect(aboutLink).toBeFocused();
        await expect(aboutLink).toHaveAttribute("href", `/about?lang=${lang}`);
        console.log({
          width,
          lang,
          theme,
          result: "PASS",
          state: "unavailable aggregates",
        });
        await page.close();
      }
  for (const lang of ["en", "fr"]) {
    const page = await browser.newPage({
      viewport: { width: 320, height: 900 },
    });
    await page.addInitScript((lang) => {
      globalThis.localStorage.setItem("troc.locale", lang);
      globalThis.localStorage.setItem(
        "troc.theme",
        lang === "fr" ? "dark" : "light",
      );
    }, lang);
    await page.goto(`http://127.0.0.1:4313/style-guide#page=editorial`);
    const stats = page.locator(".troc-marketplace-stats");
    await stats.waitFor();
    await expect(stats.locator(".troc-metric-value")).toHaveText([
      new Intl.NumberFormat(lang === "fr" ? "fr-CA" : "en-CA").format(12345),
      "0",
      "—",
      "24",
    ]);
    await expect(stats).toContainText(
      lang === "fr" ? "chiffres fictifs" : "fictional figures",
    );
    assert.equal(
      await stats.evaluate((el) => el.scrollWidth > el.clientWidth),
      false,
    );
    assert.equal(
      await stats
        .locator(".troc-stats-grid")
        .evaluate((el) => globalThis.getComputedStyle(el).borderTopWidth),
      "1px",
    );
    await stats.screenshot({
      path: `verification/stats-guide-320-${lang}.png`,
    });
    console.log({
      guide: true,
      width: 320,
      lang,
      result: "PASS",
      states: "formatted/zero/null",
    });
    await page.close();
  }
} finally {
  await browser.close();
}
