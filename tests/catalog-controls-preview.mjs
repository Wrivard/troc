import { chromium, expect } from "@playwright/test";
import assert from "node:assert/strict";
import fs from "node:fs/promises";
const browser = await chromium.launch({ channel: "chrome", headless: true });
const page = await browser.newPage({ viewport: { width: 1440, height: 1000 } });
const evidence = [];
try {
  await page.goto("http://127.0.0.1:4313/search?lang=en");
  const setGroup = page
    .locator(".troc-browse-group")
    .filter({ has: page.locator("summary", { hasText: /^Set$/ }) });
  await setGroup.locator("summary").click();
  await setGroup
    .getByRole("button", { name: "Show more", exact: true })
    .click();
  assert.ok((await setGroup.getByRole("radio").count()) > 8);
  await setGroup.getByRole("textbox").fill("Battle Pack");
  assert.ok((await setGroup.getByRole("radio").count()) > 1);
  await setGroup.getByRole("radio").nth(1).click();
  const selected = await page.locator("input[name=set]").inputValue();
  assert.ok(selected);
  await page.setViewportSize({ width: 390, height: 844 });
  await page.getByRole("button", { name: "Filters", exact: true }).click();
  await expect(
    page.getByRole("dialog").getByRole("textbox", { name: "Search sets" }),
  ).toHaveValue("Battle Pack");
  assert.equal(await page.locator("input[name=set]").inputValue(), selected);
  const price = page
    .getByRole("dialog")
    .locator(".troc-browse-group")
    .filter({ has: page.locator("summary", { hasText: "Price (CAD)" }) });
  await price.locator("summary").click();
  await price.getByRole("spinbutton").first().fill("-1");
  const before = page.url();
  await page
    .getByRole("dialog")
    .getByRole("button", { name: "Apply filters", exact: true })
    .click();
  assert.equal(page.url(), before);
  assert.equal(
    await price
      .getByRole("spinbutton")
      .first()
      .evaluate((el) => el.validity.valid),
    false,
  );
  evidence.push({
    case: "set-search-show-more-responsive-draft-native-validation",
    passed: true,
  });
  await page.close();
  for (const view of ["large", "compact", "list"]) {
    const p = await browser.newPage({ viewport: { width: 390, height: 844 } });
    await p.addInitScript(
      (view) => globalThis.localStorage.setItem("troc.catalog.view", view),
      view,
    );
    let release;
    const gate = new Promise((resolve) => {
      release = resolve;
    });
    await p.route("**/api/catalog/page?**", async (route) => {
      await gate;
      await route.continue();
    });
    await p.goto("http://127.0.0.1:4313/search?lang=en");
    await expect(p.locator(".troc-browse-loading")).toHaveAttribute(
      "data-view",
      view,
    );
    await expect(p.getByRole("status")).toHaveAttribute("aria-busy", "true");
    await p.screenshot({ path: `verification/catalog-loading-${view}.jpg` });
    release();
    await expect(p.locator(".troc-browse-results")).toBeVisible();
    evidence.push({ case: `loading-${view}`, passed: true });
    await p.close();
  }
  await fs.writeFile(
    "verification/catalog-controls.json",
    JSON.stringify(evidence, null, 2),
  );
  console.log(evidence);
} finally {
  await browser.close();
}
