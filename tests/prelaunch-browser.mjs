import { chromium } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";
import assert from "node:assert/strict";
const browser = await chromium.launch({ headless: true, channel: "chrome" });
let cases = 0;
try {
  for (const width of [390, 1280])
    for (const locale of ["en", "fr"])
      for (const theme of ["light", "dark"]) {
        const context = await browser.newContext({
          viewport: { width, height: 950 },
          extraHTTPHeaders: { "X-Forwarded-For": `192.0.2.${cases + 1}` },
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
        page.on("pageerror", (e) => {
          errors.push(e.message);
          console.log(e.message);
        });
        for (const path of [
          "",
          "/collector",
          "/seller",
          "/withdraw",
          "/admin",
        ]) {
          await page.goto("http://127.0.0.1:5312/early-access" + path);
          await page.locator("h1").waitFor();
          await page.waitForTimeout(350); // Let the existing persisted-theme transition settle.
          assert.equal(
            await page.evaluate(
              () => document.documentElement.scrollWidth > innerWidth,
            ),
            false,
          );
          const axe = await new AxeBuilder({ page })
            .withTags(["wcag2a", "wcag2aa"])
            .analyze();
          assert.deepEqual(
            axe.violations.map((v) => v.id),
            [],
            JSON.stringify({
              path,
              locale,
              theme,
              violations: axe.violations.map((v) => v.nodes),
            }),
          );
          if (path === "/collector" || path === "/seller") {
            await page
              .locator("[name=email]")
              .fill(
                `browser-${width}-${locale}-${theme}-${path.slice(1)}@example.test`,
              );
            await page.locator("[name=province]").selectOption("QC");
            await page.locator("[name=games][value=pokemon]").check();
            if (path === "/seller") {
              await page.locator("[name=contact]").fill("Local test seller");
              await page.locator("[name=inventory]").selectOption("1000_9999");
              await page
                .locator("[name=sellerType]")
                .selectOption("individual");
              await page.locator("[name=experience]").selectOption("1_3_years");
              await page.locator("[name=adult]").check();
            }
            await page.locator("[name=country]").check();
            await page.locator("[name=consent]").check();
            await page.locator("form button").last().click();
            await page.locator("[role=status] code").waitFor();
            const code = await page.locator("[role=status] code").textContent();
            assert.equal(code.length, 43);
            await page.goto("http://127.0.0.1:5312/early-access/withdraw");
            await page.locator("[name=kind]").selectOption(path.slice(1));
            await page.locator("[name=withdrawal]").fill(code);
            await page.locator("form button").click();
            await page.locator("[role=status]").waitFor();
          }
          cases++;
        }
        assert.deepEqual(errors, []);
        await context.close();
      }
  console.log(
    `${cases} prelaunch responsive EN/FR/theme cases and 16 capture/withdraw flows passed.`,
  );
} finally {
  await browser.close();
}
