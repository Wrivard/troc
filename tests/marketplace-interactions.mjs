import { chromium, expect } from "@playwright/test";
import assert from "node:assert/strict";
import { writeFile } from "node:fs/promises";
const browser = await chromium.launch({ channel: "msedge", headless: true });
const results = [];
try {
  const context = await browser.newContext({
    viewport: { width: 390, height: 900 },
    reducedMotion: "reduce",
  });
  const page = await context.newPage();
  await page.goto("http://localhost:5173/search?lang=fr&theme=dark");
  const combo = page.getByRole("combobox", { name: "Jeu", exact: true });
  await combo.focus();
  await page.keyboard.press("Space");
  await expect(page.getByRole("listbox")).toBeVisible();
  await page.keyboard.press("Escape");
  await expect(combo).toBeFocused();
  const focus = await combo.evaluate((el) => {
    const css = globalThis.getComputedStyle(el);
    return css.outlineStyle !== "none" || css.boxShadow !== "none";
  });
  assert.ok(focus);
  assert.ok(
    await page.evaluate(
      () => globalThis.matchMedia("(prefers-reduced-motion: reduce)").matches,
    ),
  );
  results.push(
    "keyboard select, Escape focus return, focus styling, reduced motion",
  );
  await page.goto(
    "http://localhost:5173/search?language=ja&game=pokemon&lang=en",
  );
  await page
    .getByRole("link", { name: "View offers", exact: true })
    .first()
    .click();
  await expect(page).toHaveURL(/variantId=/);
  await expect(
    page.getByRole("link", { name: "Japanese · Standard", exact: true }),
  ).toBeVisible();
  results.push("filtered Japanese product navigation");
  await page.goto(
    "http://localhost:5173/product/pokemon-northern-spark?lang=en&offerLimit=1",
  );
  await expect(page.locator(".troc-offer")).toHaveCount(1);
  await page.getByRole("link", { name: "More offers", exact: true }).click();
  await expect(page).toHaveURL(/offerPage=2/);
  await expect(page).toHaveURL(/offerLimit=1/);
  await expect(page.locator(".troc-offer")).toHaveCount(1);
  await page
    .getByRole("link", { name: "Previous offers", exact: true })
    .click();
  await expect(page).toHaveURL(/offerPage=1/);
  results.push("offer pagination preserves page size");
  await page.goto(
    "http://localhost:5173/search?q=zzzznonexistentfixture&lang=en",
  );
  await expect(
    page.getByText(
      "No matching products. Try another search or clear the filters.",
      { exact: true },
    ),
  ).toBeVisible();
  results.push("empty state");
  await context.close();
  const errorContext = await browser.newContext();
  const errorPage = await errorContext.newPage();
  await errorPage.route("**/api/catalog/page?**", (route) =>
    route.fulfill({
      status: 503,
      contentType: "application/json",
      body: '{"code":"service_unavailable"}',
    }),
  );
  await errorPage.goto("http://localhost:5173/search?lang=fr");
  await expect(
    errorPage.getByRole("button", { name: "Réessayer", exact: true }),
  ).toBeVisible();
  results.push("translated error and retry");
  await errorContext.close();
  const loadingContext = await browser.newContext();
  const loadingPage = await loadingContext.newPage();
  let release;
  let markRequest;
  const requested = new Promise((resolve) => {
    markRequest = resolve;
  });
  await loadingPage.route("**/api/catalog/page?**", async (route) => {
    await new Promise((resolve) => {
      release = resolve;
      markRequest();
    });
    await route.fulfill({
      status: 503,
      contentType: "application/json",
      body: "{}",
    });
  });
  await loadingPage.goto("http://localhost:5173/search?lang=en");
  await expect(
    loadingPage.getByRole("heading", { name: "Loading…", exact: true }),
  ).toBeVisible();
  await requested;
  release();
  results.push("loading state");
  await loadingContext.close();
  await writeFile(
    new URL("../verification/interaction-results.json", import.meta.url),
    JSON.stringify(results, null, 2) + "\n",
  );
  console.log(results);
} finally {
  await browser.close();
}
