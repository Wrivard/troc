import { chromium } from "@playwright/test";
import assert from "node:assert/strict";
import { writeFile } from "node:fs/promises";
import process from "node:process";
const origin =
  process.env.TROC_LIVE_ORIGIN || "https://troc-api-server-psi.vercel.app";
const browser = await chromium.launch({ channel: "chrome", headless: true });
const results = [];
try {
  for (const width of [390, 1280])
    for (const lang of ["en", "fr"]) {
      const page = await browser.newPage({ viewport: { width, height: 900 } });
      const errors = [];
      page.on("pageerror", (e) => errors.push(e.message));
      for (const route of [
        "/",
        "/search",
        "/cart",
        "/smart-cart",
        "/seller/inventory",
      ]) {
        const response = await page.goto(
          `${origin}${route}?lang=${lang}&theme=dark`,
        );
        assert.equal(response.status(), 200);
        await page.getByRole("heading", { level: 1 }).waitFor();
        if (route === "/seller/inventory") {
          await page
            .getByRole("heading", {
              name:
                lang === "fr"
                  ? "Accès vendeur requis"
                  : "Seller access required",
            })
            .waitFor();
          assert.match(
            await page.locator("main").innerText(),
            lang === "fr"
              ? /indisponible|Connectez-vous/
              : /unavailable|Sign in/,
          );
        }
        assert.equal(
          await page.evaluate(
            () => document.documentElement.scrollWidth > innerWidth,
          ),
          false,
          `${route} ${width} overflow`,
        );
        results.push({
          route,
          width,
          lang,
          status: response.status(),
          heading: await page.getByRole("heading", { level: 1 }).innerText(),
        });
      }
      assert.deepEqual(errors, []);
      await page.close();
    }
  await writeFile(
    "verification/inventory-live.json",
    JSON.stringify(
      {
        origin,
        checkedAt: new Date().toISOString(),
        inventoryActivation:
          "Hosted authentication/database unavailable; confirmed fail-closed state",
        results,
      },
      null,
      2,
    ),
  );
  console.log(
    `${results.length} live page checks passed; hosted inventory activation remains unavailable`,
  );
} finally {
  await browser.close();
}
