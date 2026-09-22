import { chromium, expect } from "@playwright/test";
import assert from "node:assert/strict";
import { mkdir, writeFile } from "node:fs/promises";
const browser = await chromium.launch({ channel: "msedge", headless: true });
const output = new URL("../verification/", import.meta.url);
await mkdir(output, { recursive: true });
const results = [];
try {
  for (const width of [390, 1280])
    for (const locale of ["en", "fr"])
      for (const theme of ["dark", "light"]) {
        const context = await browser.newContext({
          viewport: { width, height: 900 },
          locale: `${locale}-CA`,
          reducedMotion: "reduce",
        });
        const page = await context.newPage();
        const errors = [];
        page.on("pageerror", (error) => errors.push(error.message));
        await page.goto(
          `http://localhost:5173/sign-in?lang=${locale}&theme=${theme}`,
        );
        await page.getByRole("heading", { level: 1 }).waitFor();
        await page.evaluate(() => document.fonts.ready);
        assert.equal(
          await page.locator("html").getAttribute("lang"),
          `${locale}-CA`,
        );
        assert.equal(
          await page.locator("html").getAttribute("data-theme"),
          `troc-${theme}`,
        );
        assert.equal(
          await page.evaluate(
            () => document.documentElement.scrollWidth <= innerWidth,
          ),
          true,
        );
        await page.screenshot({
          path: new URL(
            `account-${width}-${locale}-${theme}.png`,
            output,
          ).pathname.replace(/^\/(\w:)/, "$1"),
          fullPage: true,
        });
        await page
          .getByRole("button", {
            name: locale === "en" ? "Français" : "English",
            exact: true,
          })
          .click();
        await page.reload();
        await expect(page.locator("html")).toHaveAttribute(
          "lang",
          `${locale === "en" ? "fr" : "en"}-CA`,
        );
        const nextTheme = theme === "dark" ? "light" : "dark";
        await page
          .getByRole("button", {
            name: nextTheme === "light" ? "TROC Light" : "TROC Dark",
            exact: true,
          })
          .click();
        await page.reload();
        await expect(page.locator("html")).toHaveAttribute(
          "data-theme",
          `troc-${nextTheme}`,
        );
        await page.goto(
          `http://localhost:5173/sign-up?lang=${locale}&theme=${theme}`,
        );
        await page.getByRole("checkbox").waitFor();
        assert.equal(
          await page.evaluate(
            () => document.documentElement.scrollWidth <= innerWidth,
          ),
          true,
        );
        // Same source guide served standalone and via the new consumer must render identically.
        const captures = [];
        for (const port of [5174, 5173]) {
          await page.goto(
            `http://localhost:${port}/style-guide?lang=${locale}&theme=${theme}`,
          );
          await page.locator(".ds-main h1").waitFor();
          await page.evaluate(() => document.fonts.ready);
          await page.waitForTimeout(400);
          captures.push(
            await page.screenshot({ animations: "disabled", fullPage: true }),
          );
        }
        await writeFile(
          new URL(`standalone-${width}-${locale}-${theme}.png`, output),
          captures[0],
        );
        await writeFile(
          new URL(`guide-${width}-${locale}-${theme}.png`, output),
          captures[1],
        );
        assert.ok(
          captures[0].equals(captures[1]),
          `Guide differs at ${width}/${locale}/${theme}`,
        );
        assert.deepEqual(errors, []);
        results.push({
          width,
          locale,
          theme,
          overflow: false,
          preferencePersistence: "passed",
          guidePixelComparison: "identical",
        });
        await context.close();
      }
  await writeFile(
    new URL("browser-results.json", output),
    JSON.stringify(results, null, 2),
  );
  console.log(
    `Passed ${results.length} mobile/desktop EN/FR theme combinations; standalone/integrated style guide screenshots identical.`,
  );
} finally {
  await browser.close();
}
