import { chromium, expect } from "@playwright/test";
import assert from "node:assert/strict";
import fs from "node:fs/promises";
const browser = await chromium.launch({ channel: "chrome", headless: true });
const page = await browser.newPage({ viewport: { width: 1440, height: 1000 } });
const evidence = [];
try {
  await page.goto("http://127.0.0.1:4313/search?lang=en&max=99");
  await expect(page.locator(".troc-browse")).toBeVisible();
  await page
    .locator(".troc-browse")
    .getByRole("radio", { name: "Yu-Gi-Oh!", exact: true })
    .click();
  await page
    .locator(".troc-browse-group")
    .filter({ has: page.locator("summary", { hasText: "Condition" }) })
    .locator("summary")
    .click();
  await page.getByRole("radio", { name: "Near Mint", exact: true }).click();
  await page.locator("#catalog-browse-query").fill("Hero");
  await page.locator(".troc-browse-sort").getByRole("combobox").click();
  await page.getByRole("option", { name: "Lowest price", exact: true }).click();
  await page.locator(".troc-browse-apply").getByRole("button").click();
  await page.waitForURL((url) => url.searchParams.get("q") === "Hero");
  const params = new URL(page.url()).searchParams;
  for (const [k, v] of Object.entries({
    q: "Hero",
    max: "99",
    condition: "NM",
    game: "yu-gi-oh",
    sort: "price",
    lang: "en",
  }))
    assert.equal(params.get(k), v, k);
  await expect(
    page.locator(".troc-browse .troc-market-card").first(),
  ).toBeVisible();
  evidence.push({ case: "query+game+condition+max+sort", url: page.url() });
  await page.getByRole("button", { name: "Remove NM", exact: true }).click();
  await page.waitForURL((url) => !url.searchParams.has("condition"));
  assert.equal(new URL(page.url()).searchParams.get("max"), "99");
  await page.goBack();
  await expect(
    page.getByRole("button", { name: "Remove NM", exact: true }),
  ).toBeVisible();
  evidence.push({ case: "remove-one-and-browser-back", passed: true });
  await page.locator("#catalog-browse-query").fill("zzzz-no-match-unique");
  await page.locator("#catalog-browse-query").press("Enter");
  await expect(
    page.getByText("No cards match these filters", { exact: true }),
  ).toBeVisible();
  await page.getByRole("button", { name: "Edit search", exact: true }).click();
  await expect(page.locator("#catalog-browse-query")).toBeFocused();
  evidence.push({ case: "empty-search-recovery", passed: true });
  await page.goto("http://127.0.0.1:4313/search?lang=en");
  await expect(page.locator(".troc-browse")).toBeVisible();
  const next = page.locator(".troc-browse-pagination a").last();
  const nextHref = await next.getAttribute("href");
  assert.ok(nextHref.includes("cursor="));
  await next.click();
  await page.waitForURL((url) => url.searchParams.has("cursor"));
  await expect(page.locator(".troc-browse-pagination a").first()).toContainText(
    "First",
  );
  evidence.push({ case: "cursor-pagination", passed: true });
  await page.setViewportSize({ width: 390, height: 844 });
  await page.getByRole("button", { name: "Filters", exact: true }).click();
  const magic = page
    .getByRole("dialog")
    .getByRole("radio", { name: "Magic: The Gathering", exact: true });
  const magicSlug = await magic.getAttribute("value");
  await magic.click();
  await page
    .getByRole("dialog")
    .getByRole("button", { name: "Apply filters", exact: true })
    .click();
  await page.waitForURL((url) => url.searchParams.get("game") === magicSlug);
  assert.equal(new URL(page.url()).searchParams.has("cursor"), false);
  evidence.push({ case: "mobile-draft-submit-resets-cursor", passed: true });
  await fs.writeFile(
    "verification/catalog-interactions.json",
    JSON.stringify(evidence, null, 2),
  );
  console.log(evidence);
} finally {
  await browser.close();
}
