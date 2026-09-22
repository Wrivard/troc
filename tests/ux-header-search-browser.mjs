import { chromium, expect } from "@playwright/test";
import assert from "node:assert/strict";
const b = await chromium.launch({ channel: "msedge", headless: true });
try {
  for (const width of [390, 1440])
    for (const lang of ["en", "fr"]) {
      const p = await b.newPage({ viewport: { width, height: 900 } });
      await p.goto(`http://localhost:4313/?lang=${lang}`);
      await p.locator(".troc-home-hero").waitFor();
      const search = p.locator("header").getByRole("searchbox");
      await search.fill("Pidgey");
      await expect(search).not.toHaveAttribute("aria-expanded");
      await expect(search).not.toHaveAttribute("aria-controls");
      await expect(
        p.locator("header [role=listbox],header .troc-global-search-popup"),
      ).toHaveCount(0);
      await search.press("Enter");
      await p.waitForURL("**/search?**");
      await expect(p.locator(".troc-market-card").first()).toBeVisible();
      assert.equal(new URL(p.url()).searchParams.get("q"), "Pidgey");
      assert.equal(new URL(p.url()).searchParams.get("lang"), lang);
      await p.close();
    }
  const p = await b.newPage({ viewport: { width: 1440, height: 900 } });
  await p.goto("http://localhost:4313/style-guide?lang=en#page=global-search");
  const combo = p.getByRole("combobox").first();
  await combo.fill("Pika");
  await combo.press("ArrowDown");
  await expect(combo).toHaveAttribute("aria-expanded", "true");
  await expect(p.getByRole("option").first()).toContainText("Pikachu");
  await combo.press("Enter");
  await expect(combo).toHaveAttribute("aria-expanded", "false");
  const plain = p.getByRole("searchbox").last();
  await plain.fill("Pidgey");
  await expect(plain).not.toHaveAttribute("aria-expanded");
  await p.close();
  console.log(
    "4 plain-header search journeys and style-guide autocomplete/plain regressions pass",
  );
} finally {
  await b.close();
}
