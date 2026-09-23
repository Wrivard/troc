import { chromium, expect } from "@playwright/test";
const browser = await chromium.launch({ channel: "chrome", headless: true });
try {
  for (const lang of ["en", "fr"]) {
    const page = await browser.newPage();
    let release;
    const gate = new Promise((resolve) => {
      release = resolve;
    });
    await page.route("**/catalog-art/**", async (route) => {
      await gate;
      await route.continue();
    });
    await page.goto(
      `http://127.0.0.1:4313/product/magic-angel-s-feather-60304a35?lang=${lang}`,
      { waitUntil: "domcontentloaded" },
    );
    await expect(
      page.locator(".troc-card-image-skeleton").first(),
    ).toBeVisible();
    release();
    const image = page.locator(".troc-card-image img").first();
    await image.evaluate((e) => e.decode());
    await expect(
      image.locator("..").locator(".troc-card-image-skeleton"),
    ).toHaveCount(0);
    await expect(image).toHaveAttribute("alt", /Angel/);
    await page.close();
    const broken = await browser.newPage();
    await broken.route("**/catalog-art/**", (route) => route.abort());
    await broken.goto(
      `http://127.0.0.1:4313/product/magic-angel-s-feather-60304a35?lang=${lang}`,
      { waitUntil: "domcontentloaded" },
    );
    await expect(
      broken.locator(".troc-card-image--missing").first(),
    ).toHaveAttribute(
      "aria-label",
      lang === "fr" ? /Visuel à venir/ : /Artwork coming soon/,
    );
    await broken.close();
  }
  console.log(
    "PASS actual product loading, loaded, broken fallback and alt EN/FR",
  );
} finally {
  await browser.close();
}
