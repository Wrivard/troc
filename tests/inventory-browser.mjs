import { chromium } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";
import assert from "node:assert/strict";
import process from "node:process";
import { Buffer } from "node:buffer";
import { mkdir, writeFile } from "node:fs/promises";
const origin = process.env.INVENTORY_ORIGIN || "http://127.0.0.1:5185";
const browser = await chromium.launch({ headless: true, channel: "chrome" });
const evidence = [];
await mkdir("verification", { recursive: true });
try {
  for (const width of [390, 768, 1280])
    for (const locale of ["en", "fr"])
      for (const theme of ["light", "dark"]) {
        const context = await browser.newContext({
          viewport: { width, height: 900 },
        });
        await context.addInitScript(
          ({ locale, theme }) => {
            globalThis.localStorage.setItem("troc.locale", locale);
            globalThis.localStorage.setItem("troc.theme", theme);
          },
          { locale, theme },
        );
        const page = await context.newPage(),
          errors = [];
        page.on("pageerror", (e) => errors.push(e.message));
        await page.goto(origin + "/seller/inventory");
        await page
          .getByRole("heading", {
            name: locale === "fr" ? "Annonces" : "Listings",
            exact: true,
          })
          .waitFor();
        await page.locator(".inventory-list li").first().waitFor();
        assert.equal(
          await page.evaluate(
            () => document.documentElement.scrollWidth > innerWidth,
          ),
          false,
        );
        const axe = await new AxeBuilder({ page })
          .include("main")
          .withTags(["wcag2a", "wcag2aa"])
          .analyze();
        assert.deepEqual(
          axe.violations.map((v) => v.id),
          [],
        );
        await page
          .getByRole("button", {
            name: locale === "fr" ? "Importer un CSV" : "Import CSV",
            exact: true,
          })
          .click();
        await page.locator("input[type=file]").setInputFiles({
          name: "inventory.csv",
          mimeType: "text/csv",
          buffer: Buffer.from(
            "variant_id,condition,price,quantity,seller_sku\n00000000-0000-4000-8000-000000000001,NM,0.25,2,browser-" +
              width +
              locale +
              theme,
          ),
        });
        await page
          .getByRole("button", {
            name: locale === "fr" ? "Voir l’aperçu" : "Preview import",
            exact: true,
          })
          .click();
        await page
          .getByRole("heading", {
            name:
              locale === "fr" ? "Résultats de vérification" : "Review results",
          })
          .waitFor();
        assert.equal(
          await page
            .getByRole("button", {
              name:
                locale === "fr"
                  ? "Publier toutes les lignes vérifiées"
                  : "Publish all reviewed rows",
            })
            .isDisabled(),
          true,
        );
        if (
          await page.evaluate(
            () => document.documentElement.scrollWidth > innerWidth,
          )
        ) {
          console.log(
            await page.locator("main *").evaluateAll((els) =>
              els
                .filter((el) => el.getBoundingClientRect().right > innerWidth)
                .map((el) => ({
                  tag: el.tagName,
                  cls: el.className,
                  text: el.textContent.slice(0, 80),
                  width: el.getBoundingClientRect().width,
                })),
            ),
          );
          await page.screenshot({
            path: "verification/inventory-overflow.png",
            fullPage: true,
          });
        }
        assert.equal(
          await page.evaluate(
            () => document.documentElement.scrollWidth > innerWidth,
          ),
          false,
        );
        assert.deepEqual(errors, []);
        if (width === 390 && locale === "en" && theme === "dark")
          await page.screenshot({
            path: "verification/inventory-mobile.png",
            fullPage: true,
          });
        evidence.push({
          width,
          locale,
          theme,
          checked:
            "inventory, CSV review blocks unmatched publish, accessibility, overflow, JS errors",
        });
        await context.close();
      }
  const page = await browser.newPage();
  await page.goto(origin + "/seller/inventory");
  await page
    .getByRole("button", { name: "Add a listing", exact: true })
    .click();
  await page.getByLabel("Card name", { exact: true }).fill("Pikachu");
  await page
    .locator("main")
    .getByRole("button", { name: "Search", exact: true })
    .click();
  await page
    .locator("select[required] option")
    .nth(1)
    .waitFor({ state: "attached" });
  const variant = await page
    .locator("select[required] option")
    .nth(1)
    .getAttribute("value");
  await page.locator("select[required]").selectOption(variant);
  await page.getByLabel("Your unique SKU").fill("manual-browser-" + Date.now());
  await page.getByLabel("Price (CAD)", { exact: true }).fill("0.35");
  await page.getByLabel("Quantity", { exact: true }).fill("3");
  await page
    .getByRole("button", { name: "Publish listing", exact: true })
    .click();
  await page
    .getByRole("status")
    .filter({ hasText: "Listing saved." })
    .waitFor();
  await page.getByRole("button", { name: "Import CSV", exact: true }).click();
  const sku = "csv-browser-" + Date.now();
  await page.locator("input[type=file]").setInputFiles({
    name: "good.csv",
    mimeType: "text/csv",
    buffer: Buffer.from(
      `variant_id,condition,price,quantity,seller_sku\n${variant},NM,0.25,2,${sku}`,
    ),
  });
  await page
    .getByRole("button", { name: "Preview import", exact: true })
    .click();
  await page.getByRole("button", { name: "Publish all reviewed rows" }).click();
  await page.getByRole("status").filter({ hasText: "Import saved." }).waitFor();
  await page.getByRole("button", { name: "Inventory", exact: true }).click();
  await page.getByLabel("Search name or SKU").fill(sku);
  await page.locator(".inventory-list li").filter({ hasText: sku }).waitFor();
  await page.getByLabel("Quantity", { exact: true }).fill("0");
  await page.getByRole("button", { name: "Save", exact: true }).click();
  await page
    .getByRole("status")
    .filter({ hasText: "Inventory saved." })
    .waitFor();
  await page
    .locator(".inventory-list li")
    .filter({ hasText: "Sold out" })
    .waitFor();
  await page.screenshot({
    path: "verification/inventory-desktop.png",
    fullPage: true,
  });
  await page
    .context()
    .addCookies([{ name: "inventory_denied", value: "1", url: origin }]);
  await page.reload();
  await page.getByRole("heading", { name: "Seller access required" }).waitFor();
  evidence.push({
    flow: "manual publish → CSV preview/publish → stock update → unauthorized state",
    passed: true,
  });
  await writeFile(
    "verification/inventory-browser.json",
    JSON.stringify(evidence, null, 2),
  );
  console.log(`${evidence.length} inventory browser cases passed`);
} finally {
  await browser.close();
}
