import { chromium, expect } from "@playwright/test";
import assert from "node:assert/strict";
const browser = await chromium.launch({ channel: "chrome", headless: true });
try {
  for (const [width, lang, theme] of [
    [1672, "en", "dark"],
    [1440, "fr", "dark"],
    [1440, "en", "light"],
    [834, "en", "dark"],
    [390, "fr", "dark"],
    [320, "en", "light"],
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
    await page.goto(`http://127.0.0.1:4313/?lang=${lang}`);
    const hero = page.locator(".troc-cinematic-hero");
    await hero.waitFor();
    await page.evaluate(() =>
      Promise.all(
        [...document.querySelectorAll(".troc-cinematic-hero img")].map(
          (image) => image.decode().catch(() => {}),
        ),
      ),
    );
    await expect(hero.locator(".troc-stack-card")).toHaveCount(3);
    await expect(hero.locator(".troc-hero-benefits > div")).toHaveCount(4);
    await expect(hero.locator("h1")).toHaveText(
      lang === "fr"
        ? "Une recherche.Tous les vendeurs."
        : "One search.Every seller.",
    );
    assert.equal(
      await page.evaluate(
        () => document.documentElement.scrollWidth > globalThis.innerWidth,
      ),
      false,
    );
    assert.equal(
      await hero.evaluate(
        (el) => globalThis.getComputedStyle(el).backgroundColor,
      ),
      "rgb(8, 8, 9)",
    );
    const images = await hero
      .locator(".troc-stack-card img")
      .evaluateAll((elements) =>
        elements.map((el) => ({
          src: el.currentSrc,
          loaded: el.naturalWidth > 0,
          alt: el.alt,
        })),
      );
    assert.equal(images.length, 3);
    assert.equal(
      images.every((image) => image.loaded),
      true,
    );
    await hero.screenshot({
      path: `verification/hero-cinematic-${width}-${lang}-${theme}.png`,
    });
    const links = hero.locator(".troc-hero-actions a");
    await expect(links.nth(0)).toHaveAttribute("href", `/search?lang=${lang}`);
    await expect(links.nth(1)).toHaveAttribute(
      "href",
      `/founding-sellers?lang=${lang}`,
    );
    if (width === 1672) {
      await page.evaluate(() => globalThis.scrollTo(0, 0));
      const bounds = await hero.boundingBox();
      await page.screenshot({
        clip: {
          x: 0,
          y: 0,
          width,
          height: Math.ceil(bounds.y + bounds.height),
        },
        path: "verification/hero-cinematic-with-header.png",
      });
    }
    const input = hero.getByRole("textbox");
    await input.fill("Pidgey");
    await input.press("Enter");
    await page.waitForURL(/\/search\?/);
    const url = new URL(page.url());
    assert.equal(url.searchParams.get("q"), "Pidgey");
    assert.equal(url.searchParams.get("lang"), lang);
    console.log({ width, lang, theme, result: "PASS", images });
    await page.close();
  }
} finally {
  await browser.close();
}
