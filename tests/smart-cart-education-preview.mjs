import { chromium, expect } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";
import assert from "node:assert/strict";
import fs from "node:fs/promises";
const browser = await chromium.launch({ channel: "chrome", headless: true });
const evidence = [];
try {
  for (const [width, lang, theme] of [
    [1440, "en", "dark"],
    [834, "fr", "light"],
    [390, "en", "light"],
    [320, "fr", "dark"],
  ]) {
    const context = await browser.newContext({
      viewport: { width, height: 1000 },
      reducedMotion: "reduce",
    });
    const page = await context.newPage();
    let writes = 0;
    page.on("request", (r) => {
      if (!["GET", "HEAD"].includes(r.method())) writes++;
    });
    await page.goto(`http://127.0.0.1:4316/?lang=${lang}&theme=${theme}`);
    const exercise = page.locator(".troc-collection-exercise");
    await exercise.scrollIntoViewIfNeeded();
    const before = await page.evaluate(() => ({
      local: { ...globalThis.localStorage },
      session: { ...globalThis.sessionStorage },
    }));
    const money = (cents) =>
      new Intl.NumberFormat(`${lang}-CA`, {
        style: "currency",
        currency: "CAD",
      }).format(cents / 100);
    assert.equal(await page.getByRole("heading", { level: 1 }).count(), 1);
    await expect(exercise.getByRole("checkbox").first()).toBeChecked();
    await expect(exercise.getByRole("checkbox").first()).toBeDisabled();
    assert.equal(await exercise.locator("[data-missing=true]").count(), 3);
    const choose = exercise.getByRole("button", {
      name:
        lang === "fr"
          ? "Choisir un exemple adapté au budget"
          : "Choose an example within budget",
    });
    await choose.focus();
    await page.keyboard.press("Enter");
    await expect(exercise.locator("[data-exercise-total]")).toHaveText(
      money(420),
    );
    assert.equal(await exercise.locator("[data-selected=true]").count(), 2);
    const unchecked = exercise.getByRole("checkbox", { checked: false });
    await unchecked.focus();
    await page.keyboard.press("Space");
    await expect(exercise.locator("[data-exercise-total]")).toHaveText(
      money(495),
    );
    await expect(
      exercise.locator(".troc-collection-exercise-result"),
    ).toContainText(money(45));
    const slider = exercise.getByRole("slider");
    await slider.focus();
    await page.keyboard.press("Home");
    await choose.click();
    await expect(exercise.locator("[data-exercise-total]")).toHaveText(
      money(0),
    );
    assert.equal(await exercise.locator("[data-selected=true]").count(), 0);
    await slider.focus();
    await page.keyboard.press("End");
    await expect(
      exercise.locator(".troc-collection-exercise-result"),
    ).toHaveText(
      lang === "fr"
        ? "Sélectionnez des cartes manquantes ou essayez le budget."
        : "Select missing cards or try the budget.",
    );
    await choose.click();
    await expect(exercise.locator("[data-exercise-total]")).toHaveText(
      money(495),
    );
    assert.equal(await exercise.locator("[data-selected=true]").count(), 3);
    await exercise
      .getByRole("button", {
        name:
          lang === "fr" ? "Réinitialiser cet exemple" : "Reset this example",
      })
      .click();
    await expect(slider).toHaveValue("450");
    assert.equal(await exercise.locator("[data-selected=true]").count(), 0);
    await expect
      .poll(() =>
        exercise
          .locator("img")
          .evaluateAll((images) =>
            images.every((img) => img.complete && img.naturalWidth > 0),
          ),
      )
      .toBe(true);
    assert.equal(
      await page.evaluate(
        () => document.documentElement.scrollWidth > innerWidth,
      ),
      false,
    );
    await exercise.screenshot({
      path: `verification/smart-education-${width}-${lang}-${theme}.jpg`,
    });
    const axe = await new AxeBuilder({ page })
      .include(".troc-collection-exercise")
      .analyze();
    assert.equal(
      axe.violations.length,
      0,
      JSON.stringify(axe.violations.map((v) => v.id)),
    );
    assert.deepEqual(
      await page.evaluate(() => ({
        local: { ...globalThis.localStorage },
        session: { ...globalThis.sessionStorage },
      })),
      before,
    );
    assert.equal(writes, 0);
    evidence.push({
      width,
      lang,
      theme,
      arithmetic: [420, 495, 0, 495],
      reset: true,
      axe: 0,
      writes,
      storageUnchanged: true,
    });
    await context.close();
  }
  await fs.writeFile(
    "verification/smart-education.json",
    JSON.stringify(evidence, null, 2),
  );
  console.log(evidence);
} finally {
  await browser.close();
}
