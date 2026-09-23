import { chromium, expect } from "@playwright/test";
import assert from "node:assert/strict";
import fs from "node:fs/promises";
const browser = await chromium.launch({ channel: "chrome", headless: true });
const results = [];
try {
  for (const [width, height, lang, theme] of [
    [1440, 1000, "en", "dark"],
    [834, 1000, "fr", "light"],
    [390, 844, "fr", "dark"],
    [320, 740, "en", "light"],
  ]) {
    const page = await browser.newPage({
      viewport: { width, height },
      reducedMotion: "reduce",
    });
    await page.goto(`http://127.0.0.1:4314/?lang=${lang}&theme=${theme}`);
    const input = page.getByRole("combobox");
    await input.focus();
    await expect(page.getByRole("listbox")).toBeVisible();
    assert.equal(await page.getByRole("dialog").count(), 0);
    const geometry = await page
      .locator(".troc-search-presentation-popup")
      .evaluate((el) => {
        const r = el.getBoundingClientRect();
        const i = document
          .querySelector("[role=combobox]")
          .getBoundingClientRect();
        return {
          left: r.left - inputLeft(i),
          width: r.width - inputWidth(i),
          gap: r.top - i.bottom,
          bottom: r.bottom,
          overflow: document.documentElement.scrollWidth > innerWidth,
        };
        function inputLeft(i) {
          return i.left;
        }
        function inputWidth(i) {
          return i.width;
        }
      });
    assert.ok(
      Math.abs(geometry.left) < 1 &&
        Math.abs(geometry.width) < 1 &&
        geometry.gap >= 7 &&
        geometry.gap <= 9,
    );
    assert.ok(geometry.bottom <= height && !geometry.overflow);
    await expect
      .poll(() =>
        page
          .locator(".troc-search-presentation-thumb img")
          .first()
          .evaluate((img) => img.complete && img.naturalWidth > 0),
      )
      .toBe(true);
    await page.screenshot({
      path: `verification/search-${width}-${lang}-${theme}.jpg`,
    });
    const links = await page
      .getByRole("option")
      .evaluateAll((rows) => rows.map((row) => row.getAttribute("href")));
    await input.press("ArrowDown");
    await expect(input).toHaveAttribute(
      "aria-activedescendant",
      await page.getByRole("option").first().getAttribute("id"),
    );
    await input.press("ArrowDown");
    await input.press("ArrowDown");
    await input.press("Enter");
    await expect(page.locator("[data-last-navigation]")).toHaveText(links[2]);
    await expect(input).toHaveAttribute("aria-expanded", "false");
    await input.fill("#123/167");
    await expect(input).toHaveValue("#123/167");
    await input.press("Enter");
    await expect(page.locator("[data-last-navigation]")).toContainText(
      "q=%23123%2F167",
    );
    await input.fill("BP02-EN179");
    await input.press("Escape");
    await expect(input).toHaveAttribute("aria-expanded", "false");
    await expect(input).toBeFocused();
    await input.press("ArrowDown");
    await input.press("Tab");
    await page.keyboard.press("Tab");
    await expect(page.getByRole("option").first()).toBeFocused();
    await page.keyboard.press("Escape");
    await expect(input).toBeFocused();
    await expect(input).toHaveAttribute("aria-expanded", "false");
    for (const state of ["loading", "empty", "error"]) {
      await input.press("Escape");
      await page.getByRole("button", { name: state, exact: true }).click();
      await input.focus();
      await expect(
        page.locator(".troc-search-presentation-state"),
      ).toBeVisible();
      assert.equal(
        await page.locator(".troc-search-presentation-group").count(),
        0,
      );
      await page.screenshot({
        path: `verification/search-${width}-${state}.jpg`,
      });
    }
    await input.press("Escape");
    await page.getByRole("button", { name: "results", exact: true }).click();
    await input.focus();
    await page
      .getByRole("button", {
        name: lang === "fr" ? "Effacer la recherche" : "Clear search",
        exact: true,
      })
      .click();
    await expect(input).toHaveValue("");
    assert.equal(
      await page.locator(".troc-search-presentation-group").count(),
      0,
    );
    await expect(input).toBeFocused();
    await page.locator(".search-harness-header > a:last-child").click();
    await expect(input).toHaveAttribute("aria-expanded", "false");
    results.push({
      width,
      height,
      lang,
      theme,
      geometry,
      options: links.length,
      keyboard: true,
      states: true,
    });
    await page.close();
  }
  await fs.writeFile(
    "verification/global-search-presentation.json",
    JSON.stringify(results, null, 2),
  );
  console.log(results);
} finally {
  await browser.close();
}
