import AxeBuilder from "@axe-core/playwright";
import { chromium, expect } from "@playwright/test";
import { mkdir, writeFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import assert from "node:assert/strict";
const browser = await chromium.launch({ channel: "msedge", headless: true });
const directory = new URL("../verification/", import.meta.url);
await mkdir(directory, { recursive: true });
const results = [];
try {
  for (const width of [390, 768, 1280, 1920])
    for (const locale of ["en", "fr"])
      for (const theme of ["dark", "light"]) {
        const context = await browser.newContext({
          viewport: { width, height: 900 },
          locale: `${locale}-CA`,
          reducedMotion: "reduce",
        });
        const page = await context.newPage();
        const errors = [];
        const accessibility = [];
        page.on("pageerror", (e) => errors.push(e.message));
        const routes = [
          "/",
          "/search?game=pokemon&max=99",
          "/games/pokemon",
          "/sets/pokemon-demo-set",
          "/product/pokemon-northern-spark",
          "/store/cartes-du-nord",
        ];
        for (const route of routes) {
          await page.goto(
            `http://localhost:5173${route}${route.includes("?") ? "&" : "?"}lang=${locale}&theme=${theme}`,
          );
          await page.locator(".troc-site-header").waitFor();
          await page.evaluate(() => document.fonts.ready);
          await expect(page.locator("html")).toHaveAttribute(
            "lang",
            `${locale}-CA`,
          );
          assert.ok(
            await page.evaluate(
              () => document.documentElement.scrollWidth <= innerWidth,
            ),
            `Overflow: ${route} ${width}/${locale}/${theme}`,
          );
          assert.ok(await page.locator("h1").textContent());
          assert.equal(await page.locator("h1").count(), 1);
          const scan = await new AxeBuilder({ page })
            .withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa"])
            .analyze();
          accessibility.push({
            route,
            violations: scan.violations.map((v) => ({
              id: v.id,
              impact: v.impact,
              nodes: v.nodes.map((n) => ({
                target: n.target,
                summary: n.failureSummary,
              })),
            })),
          });
          if (route === "/" || route.startsWith("/product/"))
            await page.screenshot({
              path: fileURLToPath(
                new URL(
                  `market-${route === "/" ? "home" : "product"}-${width}-${locale}-${theme}.png`,
                  directory,
                ),
              ),
              fullPage: true,
            });
        }
        results.push({
          width,
          locale,
          theme,
          routes: routes.length,
          errors,
          accessibility,
        });
        console.log(`Audited ${width}/${locale}/${theme}`);
        assert.deepEqual(errors, []);
        await context.close();
      }
  const page = await browser.newPage();
  await page.goto("http://localhost:5173/search?lang=en");
  await page.locator(".troc-site-header").waitFor();
  await page.getByRole("combobox", { name: "Game", exact: true }).click();
  await page.getByRole("option", { name: "Pokémon", exact: true }).click();
  await page
    .getByRole("button", { name: "Apply filters", exact: true })
    .click();
  await expect(page).toHaveURL(/game=pokemon/);
  await page.locator(".troc-product").first().waitFor();
  assert.equal(await page.locator(".troc-product").count(), 3);
  await page.goto(
    "http://localhost:5173/product/pokemon-northern-spark?lang=en",
  );
  await page.locator(".troc-offer").first().waitFor();
  await page
    .getByRole("link", { name: "Japanese · Standard", exact: true })
    .click();
  await expect(page).toHaveURL(/variantId=/);
  await page.locator(".troc-offer").first().waitFor();
  assert.equal(await page.locator(".troc-offer").count(), 3);
  assert.equal(
    await page
      .getByRole("button", { name: "Buying coming soon", exact: true })
      .first()
      .isDisabled(),
    true,
  );
  await page.getByRole("button", { name: "Français", exact: true }).click();
  await expect(page.locator("html")).toHaveAttribute("lang", "fr-CA");
  await page.reload();
  await expect(page.locator("html")).toHaveAttribute("lang", "fr-CA");
  await writeFile(
    new URL("marketplace-browser-results.json", directory),
    JSON.stringify(results, null, 2),
  );
  assert.ok(
    results.every((r) =>
      r.accessibility.every((a) => a.violations.length === 0),
    ),
    "Accessibility violations: see verification/marketplace-browser-results.json",
  );
  console.log(
    "Passed 96 public-route locale/theme/viewport checks, filters, exact-variant navigation, disabled purchasing and locale persistence.",
  );
} finally {
  await browser.close();
}
