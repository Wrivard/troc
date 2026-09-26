import AxeBuilder from "@axe-core/playwright";
import { chromium, expect } from "@playwright/test";
import assert from "node:assert/strict";
import { mkdir, writeFile } from "node:fs/promises";
const base = "http://127.0.0.1:4313";
const out = "verification/onboarding-integrated";
await mkdir(out, { recursive: true });
const browser = await chromium.launch({ channel: "chrome", headless: true });
const results = [];
try {
  for (const [width, lang, intent] of [
    [1440, "en", "both"],
    [768, "fr", "both"],
    [390, "en", "buyer"],
    [320, "fr", "seller"],
  ]) {
    const context = await browser.newContext({
      viewport: { width, height: 1000 },
      reducedMotion: "reduce",
    });
    const page = await context.newPage();
    await page.addInitScript(
      (theme) => globalThis.localStorage.setItem("troc.theme", theme),
      width === 768 || width === 320 ? "light" : "dark",
    );
    let fail = true;
    const payloads = [];
    await page.route("**/api/**", async (route) => {
      const p = new URL(route.request().url()).pathname;
      if (p === "/api/account") return route.fulfill({json:{id:"test-user",email:"preview@example.test"}});
      if (p === "/api/prelaunch/sessions")
        return route.fulfill({ status: 201, json: { token: "test-session" } });
      if (p === "/api/prelaunch/onboarding/leads") {
        payloads.push(route.request().postDataJSON());
        return route.fulfill({
          status: fail ? 503 : 202,
          json: fail
            ? { code: "unavailable" }
            : { ok: true, status: "received_unverified", emailVerified: false },
        });
      }
      return route.fulfill({ json: {} });
    });
    await page.goto(`${base}/early-access?lang=${lang}`);
    await page.locator(".wl-form").waitFor();
    await page.locator(`.wl-intents [role=radio][value=${intent}]`).check();
    await page.screenshot({
      path: `${out}/${width}-intent.png`,
      fullPage: true,
    });
    const choose = async (name, value) => {
      await page.locator(`#wl-${name}`).click();
      await page.locator(`[role=option][data-value="${value}"]`).click();
    };
    const next = () => page.locator(".wl-actions button[type=submit]").click();
    await next();
    await page.screenshot({
      path: `${out}/${width}-checkbox.png`,
      fullPage: true,
    });
    const geometry = await page
      .locator(".wl-check")
      .first()
      .evaluate((el) => {
        const a = el.querySelector("[role=checkbox]").getBoundingClientRect(),
          b = el.querySelector("span").getBoundingClientRect();
        return { gap: b.left - a.right, dy: Math.abs(a.top - b.top) };
      });
    assert.ok(geometry.gap >= 8 && geometry.gap <= 12 && geometry.dy < 8);
    assert.equal(await page.locator(".wl-language").count(), 0);
    await choose("province", "QC");
    await page.locator(".wl-check [role=checkbox]").check();
    await next();
    await expect(page.locator(".wl-error")).toBeVisible();
    await page.locator(".wl-choices [role=checkbox]").first().check();
    await choose("province", "QC");
    await page.locator(".wl-check [role=checkbox]").check();
    await next();
    if (intent !== "seller") {
      await choose("frequency", "monthly");
      await next();
    }
    if (intent !== "buyer") {
      await expect(page.locator(".wl-scenario")).toBeVisible();
      await page.screenshot({
        path: `${out}/${width}-seller.png`,
        fullPage: true,
      });
      for (const [name, value] of [
        ["sellerType", "individual"],
        ["inventory", "1000_9999"],
        ["initialListings", "100_249"],
        ["readiness", "at_launch"],
      ])
        await choose(name, value);
      await page.locator(".wl-check [role=checkbox]").check();
      await next();
    }
    await page.locator("input[name=contact]").fill("Preview Tester");
    await expect(page.locator("input[name=email]")).toHaveValue("preview@example.test");
    await expect(page.locator("input[name=email]")).toHaveAttribute("readonly","");
    await page.locator(".wl-check [role=checkbox]").first().check();
    await next();
    await expect(page.locator(".wl-review")).toHaveCount(
      intent === "both" ? 5 : 4,
    );
    await page.locator(".wl-review").last().getByRole("button").click();
    await page.locator("input[name=contact]").fill("Updated Tester");
    await next();
    await expect(page.locator(".wl-review").last()).toContainText(
      "Updated Tester",
    );
    assert.equal(
      (await new AxeBuilder({ page }).include(".wl-page").analyze()).violations
        .length,
      0,
    );
    await page.screenshot({
      path: `${out}/${width}-review.png`,
      fullPage: true,
    });
    assert.equal(
      await page.evaluate(
        () => document.documentElement.scrollWidth > innerWidth,
      ),
      false,
    );
    await page.locator(".wl-form").evaluate((form) => {
      form.requestSubmit();
      form.requestSubmit();
    });
    await expect(page.locator(".wl-error")).toBeVisible();
    assert.equal(payloads.length, 1);
    assert.equal(payloads[0].intent, intent);
    assert.equal(payloads[0].marketingConsent, false);
    if (intent !== "buyer")
      assert.equal(
        payloads[0].seller.initialListingsScenario,
        "one_click_if_available",
      );
    assert.equal(Boolean(payloads[0].buyer), intent !== "seller");
    assert.equal(Boolean(payloads[0].seller), intent !== "buyer");
    fail = false;
    await next();
    await expect(page.locator(".wl-success")).toBeVisible();
    await expect(page.locator(".wl-account")).toHaveCount(0);
    await expect(page.locator(".wl-success > a.wl-primary")).toHaveAttribute("href",/account/);
    assert.equal(payloads[0].withdrawal, payloads[1].withdrawal);
    await page.evaluate(() =>
      Object.defineProperty(globalThis.navigator, "clipboard", {
        configurable: true,
        value: { writeText: () => Promise.reject(new Error("denied")) },
      }),
    );
    await page.locator(".wl-copy").click();
    await expect(page.locator(".wl-copy-feedback")).toBeVisible();
    await expect(page.locator("#wl-withdrawal-code")).toBeFocused();
    assert.ok(
      await page
        .locator("#wl-withdrawal-code")
        .evaluate(
          (e) => e.selectionEnd === e.value.length && e.selectionStart === 0,
        ),
    );
    assert.equal(
      (await new AxeBuilder({ page }).include(".wl-success").analyze())
        .violations.length,
      0,
    );
    await page.evaluate(() =>
      Object.defineProperty(globalThis.navigator, "clipboard", {
        configurable: true,
        value: { writeText: () => Promise.resolve() },
      }),
    );
    await page.locator(".wl-copy").click();
    await expect(page.locator(".wl-copy-feedback")).toHaveCount(0);
    await page.screenshot({
      path: `${out}/${width}-success.png`,
      fullPage: true,
    });
    results.push({
      width,
      lang,
      intent,
      status: "PASS",
      checks:
        "role flow, required game, edit-review, duplicate-submit guard, scoped axe0, unavailable/retry, stable secret, no overflow",
    });
    await context.close();
  }
  await writeFile(`${out}/results.json`, JSON.stringify(results, null, 2));
  console.log(JSON.stringify(results));
} finally {
  await browser.close();
}
