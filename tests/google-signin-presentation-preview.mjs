import { chromium, expect } from "@playwright/test";
import assert from "node:assert/strict";
import fs from "node:fs/promises";
const browser = await chromium.launch({ channel: "chrome", headless: true });
const results = [];
try {
  for (const [width, lang, theme] of [
    [1440, "en", "dark"],
    [834, "fr", "light"],
    [390, "en", "dark"],
    [320, "fr", "light"],
  ]) {
    const page = await browser.newPage({
      viewport: { width, height: 1000 },
      reducedMotion: "reduce",
    });
    let authRequests = 0;
    page.on("request", (request) => {
      if (request.url().includes("/api/auth")) authRequests++;
    });
    await page.goto(`http://127.0.0.1:4315/?lang=${lang}&theme=${theme}`);
    await page.evaluate(() => document.fonts.ready);
    const button = page.locator(".troc-google-signin-button"),
      consent = page
        .locator(".troc-google-signin-consent")
        .getByRole("checkbox");
    await expect(button).toBeDisabled();
    await expect(consent).toBeEnabled();
    const consentGeometry = await page
      .locator(".troc-google-signin-consent")
      .evaluate((el) => {
        const box = el.querySelector("button").getBoundingClientRect(),
          text = el.querySelector("span").getBoundingClientRect();
        return {
          delta: Math.abs(box.y - text.y),
          separate: box.right <= text.left,
        };
      });
    assert.ok(consentGeometry.delta < 3 && consentGeometry.separate);
    await page.locator("input[name=email]").fill("demo@example.test");
    await consent.focus();
    await page.keyboard.press("Space");
    await expect(consent).toBeChecked();
    await expect(button).toBeEnabled();
    await page.keyboard.press("Tab");
    await expect(button).toBeFocused();
    const style = await button.evaluate((el) => ({
      outline: globalThis.getComputedStyle(el).outlineWidth,
      font: globalThis.getComputedStyle(el).fontFamily,
      transition: globalThis.getComputedStyle(el).transitionDuration,
      width: el.getBoundingClientRect().width,
      overflow: document.documentElement.scrollWidth > innerWidth,
    }));
    assert.notEqual(style.outline, "0px");
    assert.ok(style.font.includes("TROC Google Sans"));
    assert.ok(parseFloat(style.transition) <= 0.001);
    assert.equal(style.overflow, false);
    const img = button.locator("img");
    await expect
      .poll(() => img.evaluate((el) => el.complete && el.naturalWidth === 80))
      .toBe(true);
    assert.equal((await img.boundingBox()).width, 20);
    await page.screenshot({
      path: `verification/google-${width}-${lang}-${theme}-ready.jpg`,
      fullPage: true,
    });
    await page.keyboard.press("Enter");
    await expect(button).toBeDisabled();
    await expect(consent).toBeDisabled();
    await expect(page.locator("[data-starts]")).toHaveText("1");
    await button.evaluate((el) => el.click());
    await expect(page.locator("[data-starts]")).toHaveText("1");
    await expect(page.locator("input[name=email]")).toHaveValue(
      "demo@example.test",
    );
    await page.screenshot({
      path: `verification/google-${width}-busy.jpg`,
      fullPage: true,
    });
    for (const state of ["error", "checking", "unavailable"]) {
      await page.getByRole("button", { name: state, exact: true }).click();
      if (state !== "error") {
        await expect(consent).toBeDisabled();
        await expect(button).toBeDisabled();
        await expect(page.locator(".troc-google-signin-status")).toBeVisible();
      } else {
        await expect(button).toBeEnabled();
        await expect(
          page.locator(".troc-signin-form-slot > p[role=status]"),
        ).toBeVisible();
      }
      await page.screenshot({
        path: `verification/google-${width}-${state}.jpg`,
        fullPage: true,
      });
    }
    await page.getByRole("button", { name: "available", exact: true }).click();
    await expect(button).toBeEnabled();
    await expect(consent).toBeChecked();
    assert.equal(authRequests, 0);
    results.push({
      width,
      lang,
      theme,
      style,
      authRequests,
      states: true,
      keyboard: true,
    });
    await page.close();
  }
  await fs.writeFile(
    "verification/google-signin-presentation.json",
    JSON.stringify(results, null, 2),
  );
  console.log(results);
} finally {
  await browser.close();
}
