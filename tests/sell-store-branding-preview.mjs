import { chromium, expect } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";
import assert from "node:assert/strict";
import fs from "node:fs/promises";
const browser = await chromium.launch({ channel: "chrome", headless: true });
const results = [];
const identities = [
  ["Card Forge TCG", "cardforge", "50% 0%"],
  ["Piko Trading Cards", "pikocards", "50% 50%"],
  ["The Playground", "theplayground", "50% 50%"],
];
try {
  for (const [width, lang, theme] of [
    [1440, "en", "dark"],
    [390, "fr", "light"],
    [320, "fr", "dark"],
  ])
    for (let i = 0; i < 3; i++) {
      const context = await browser.newContext({
        viewport: { width, height: 1000 },
      });
      const page = await context.newPage();
      let canonical;
      await page.route("**/api/catalog/page?*", async (route) => {
        const response = await route.fetch();
        const body = await response.json();
        canonical = body.sellers[i];
        assert.ok(canonical);
        await route.fulfill({
          response,
          json: {
            ...body,
            sellers: [
              canonical,
              ...body.sellers.filter((s) => s.id !== canonical.id),
            ],
          },
        });
      });
      await page.goto(`http://127.0.0.1:4313/sell?lang=${lang}&theme=${theme}`);
      await expect(page.locator("html")).toHaveAttribute(
        "data-theme",
        `troc-${theme}`,
      );
      const preview = page.locator(".troc-seller-landing-preview");
      await expect(preview.getByRole("heading", { level: 2 })).toHaveText(
        identities[i][0],
      );
      const cover = preview.locator(".troc-store-cover > img");
      await expect(cover).toHaveAttribute(
        "src",
        `/demo-store-branding/${identities[i][1]}-cover.webp`,
      );
      await expect(preview.locator(".troc-seller-avatar img")).toHaveAttribute(
        "src",
        `/demo-store-branding/${identities[i][1]}-avatar.webp`,
      );
      await expect
        .poll(() =>
          preview
            .locator("img")
            .evaluateAll((images) =>
              images.every((image) => image.complete && image.naturalWidth > 0),
            ),
        )
        .toBe(true);
      await expect(preview.getByRole("link")).toHaveAttribute(
        "href",
        `/store/${canonical.slug}?lang=${lang}`,
      );
      await expect(preview.locator(".troc-seller-avatar")).toHaveAttribute(
        "aria-label",
        identities[i][0],
      );
      assert.equal(await preview.locator(".troc-store-cover-word").count(), 0);
      const frame = await preview.locator(".troc-store-cover").boundingBox();
      assert.ok(
        Math.abs(frame.width / frame.height - (width <= 600 ? 16 / 9 : 2.5)) <
          0.01,
      );
      assert.equal(
        await cover.evaluate(
          (el) => globalThis.getComputedStyle(el).objectPosition,
        ),
        identities[i][2],
      );
      assert.equal(
        await page.evaluate(
          () => document.documentElement.scrollWidth > innerWidth,
        ),
        false,
      );
      await preview.screenshot({
        path: `verification/sell-store-${i}-${width}-${lang}-${theme}.jpg`,
      });
      const axe = await new AxeBuilder({ page })
        .include(".troc-seller-landing-preview")
        .analyze();
      assert.equal(
        axe.violations.length,
        0,
        JSON.stringify(axe.violations.map((v) => v.id)),
      );
      results.push({
        width,
        lang,
        theme,
        id: canonical.id,
        slug: canonical.slug,
        brand: identities[i][0],
        ratio: frame.width / frame.height,
        axe: 0,
      });
      await context.close();
    }
  // Broken supplied assets must keep the seller name/link and established fallback.
  const page = await browser.newPage({ viewport: { width: 390, height: 900 } });
  await page.route("**/demo-store-branding/*", (route) => route.abort());
  await page.goto("http://127.0.0.1:4313/sell?lang=en");
  const preview = page.locator(".troc-seller-landing-preview");
  await expect(preview.getByRole("heading", { level: 2 })).toHaveText(
    "Card Forge TCG",
  );
  await expect(preview.locator(".troc-seller-avatar--fallback")).toBeVisible();
  await expect(preview.locator(".troc-store-cover-word")).toBeVisible();
  await expect(preview.locator(".troc-store-cover > img")).toHaveCount(0);
  await page.close();
  await fs.writeFile(
    "verification/sell-store-branding.json",
    JSON.stringify({ results, brokenAssetsFallback: true }, null, 2),
  );
  console.log({ cases: results.length, brokenAssetsFallback: true });
} finally {
  await browser.close();
}
