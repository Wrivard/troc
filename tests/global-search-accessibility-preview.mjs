import { chromium, expect } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";
import assert from "node:assert/strict";
import fs from "node:fs/promises";
const browser = await chromium.launch({ channel: "chrome", headless: true });
try {
  const context = await browser.newContext({
    viewport: { width: 390, height: 844 },
  });
  const page = await context.newPage();
  await page.goto("http://127.0.0.1:4314/?lang=fr");
  const input = page.getByRole("combobox");
  await input.focus();
  await input.press("ArrowUp");
  const last = page.getByRole("option").last();
  await expect(last).toHaveAttribute("aria-selected", "true");
  await expect(last).toBeInViewport();
  await page.screenshot({ path: "verification/search-seller-scroll.jpg" });
  const result = await new AxeBuilder({ page })
    .include(".troc-search-presentation")
    .analyze();
  await fs.writeFile(
    "verification/global-search-accessibility.json",
    JSON.stringify(result.violations, null, 2),
  );
  assert.equal(
    result.violations.length,
    0,
    JSON.stringify(
      result.violations.map((v) => ({
        id: v.id,
        nodes: v.nodes.map((n) => n.target),
      })),
    ),
  );
  const hrefs = await page
    .getByRole("option")
    .evaluateAll((rows) => rows.map((row) => row.getAttribute("href")));
  const destinations = [];
  for (const href of [...new Set(hrefs)]) {
    const url = new URL(href);
    const params = new globalThis.URLSearchParams(url.search);
    params.set("path", url.pathname);
    const response = await page.request.get(
      `http://127.0.0.1:4313/api/catalog/page?${params}`,
    );
    assert.ok(response.ok(), `${response.status()} ${href}`);
    const data = await response.json();
    assert.notEqual(data.kind, "not-found");
    destinations.push({ href, kind: data.kind });
  }
  await fs.writeFile(
    "verification/global-search-destinations.json",
    JSON.stringify(destinations, null, 2),
  );
  console.log({
    axeViolations: 0,
    realDestinations: destinations.length,
    lastRowKeyboardScroll: true,
  });
  await input.fill("123/167");
  await input.press("ArrowDown");
  await input.fill("BP02-EN179");
  await expect(input).not.toHaveAttribute("aria-activedescendant", /.+/);
  await input.press("Enter");
  await expect(page.locator("[data-last-navigation]")).toContainText(
    "q=BP02-EN179",
  );
  console.log("Changing query clears stale active selection");
} finally {
  await browser.close();
}

