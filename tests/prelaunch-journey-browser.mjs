import { chromium } from "@playwright/test";
import assert from "node:assert/strict";
const browser = await chromium.launch({ headless: true, channel: "chrome" });
import process from "node:process";
const origin = process.env.PRELAUNCH_ORIGIN || "http://127.0.0.1:5312";
try {
  for (const locale of ["en", "fr"]) {
    const context = await browser.newContext({
      viewport: { width: 390, height: 850 },
      extraHTTPHeaders: {
        "X-Forwarded-For": locale === "en" ? "198.51.100.1" : "198.51.100.2",
      },
    });
    await context.addInitScript(
      (locale) => globalThis.localStorage.setItem("troc.locale", locale),
      locale,
    );
    const page = await context.newPage();
    let sessions = 0;
    const observations = [];
    page.on("request", (request) => {
      if (request.url().endsWith("/sessions")) sessions++;
      if (request.url().endsWith("/events"))
        observations.push(request.postDataJSON());
    });
    await page.goto(origin + "/early-access?source=event");
    await page.locator("h1").waitFor();
    assert.equal(sessions, 0);
    await page.locator("[name=analytics]").check();
    await page.locator("[name=analytics]").uncheck();
    await page.locator("[name=analytics]").check();
    await page.locator('a[href*="/early-access/collector"]').click();
    await page.locator("[name=email]").fill(`journey-${locale}@example.test`);
    await page.locator("[name=analytics]").uncheck();
    await page.locator("[name=analytics]").check();
    await page.locator("[name=province]").selectOption("QC");
    await page.locator("[name=country]").check();
    await page.locator("[name=consent]").check();
    await page.locator("form button[type=submit]").click();
    await page.locator("[role=status] code").waitFor();
    assert.equal(sessions, 1, "toggles/navigation must retain one session");
    const tokens = new Set(observations.map((e) => e.token));
    assert.equal(tokens.size, 1);
    assert.ok(observations.some((e) => e.name === "landing_visit"));
    assert.ok(observations.some((e) => e.name === "cta"));
    assert.ok(observations.some((e) => e.name === "form_start"));
    const counts = await (
      await context.request.get(origin + "/api/prelaunch/admin/metrics")
    ).json();
    for (const name of ["landing_visit", "cta", "form_start", "completion"]) {
      const row = counts.events.find(
        (e) => e.kind === "collector" && e.name === name,
      );
      assert.equal(row.count, locale === "en" ? 1 : 2, `dedup ${name}`);
    }
    await context.close();
  }
  const context = await browser.newContext({
      extraHTTPHeaders: { "X-Forwarded-For": "198.51.100.3" },
    }),
    page = await context.newPage(),
    events = [];
  page.on("request", (r) => {
    if (r.url().endsWith("/events")) events.push(r.postDataJSON().name);
  });
  await page.goto(origin + "/early-access");
  await page.locator('a[href*="/early-access/seller"]').click();
  await page.locator("[name=analytics]").check();
  await page.locator("[name=analytics]").uncheck();
  assert.equal(events.includes("landing_visit"), false);
  assert.equal(events.includes("cta"), false);
  assert.ok(events.includes("form_start"));
  await context.close();
  console.log(
    "EN/FR journey identity, consent toggles, real landing/CTA events and no retroactive tracking passed.",
  );
} finally {
  await browser.close();
}
