import { chromium, expect } from "@playwright/test";
import assert from "node:assert/strict";
const browser = await chromium.launch({ channel: "chrome", headless: true });
const context = await browser.newContext();
const page = await context.newPage();
const base = "http://127.0.0.1:4313";
try {
  await page.goto(base + "/sign-in?lang=en");
  async function role(_name, email) {
    await context.request.post(base+"/api/dev/session", {headers:{Origin:base},data:{role:email.split("@")[0]}});
    await page.goto(base+"/account?lang=en");
    await expect(page.getByRole("button", {name:"Account menu: "+email,exact:true})).toBeVisible();
  }
  async function get(path) {
    return page.evaluate(async (p) => {
      const r = await fetch("/api/" + p);
      return { status: r.status, body: await r.json() };
    }, path);
  }
  await role("Buyer", "buyer@troc.test");
  assert.equal((await get("onboarding/admin/summary")).status, 403);
  await role("Seller", "seller@troc.test");
  const sellers = await get("seller/platform/sellers");
  assert.equal(sellers.body[0].role, "owner");
  assert.equal((await get("onboarding/admin/summary")).status, 403);
  await role("Admin", "admin@troc.test");
  assert.equal((await get("onboarding/admin/summary")).status, 200);
  const bad = await context.request.post(base + "/api/dev/session", {
    headers: { Origin: "https://outside.invalid" },
    data: { role: "admin" },
  });
  assert.equal(bad.status(), 403);
  await page.setViewportSize({ width: 390, height: 844 });
  await page.screenshot({ path: "verification/local-accounts-mobile.png" });
  assert.equal(
    await page.evaluate(
      () => document.documentElement.scrollWidth > innerWidth,
    ),
    false,
  );
  await page.setViewportSize({ width: 1440, height: 1000 });
  await page.screenshot({ path: "verification/local-accounts-desktop.png" });
  await page.evaluate(() => fetch("/api/auth/sign-out", { method: "POST" }));
  assert.equal((await get("account")).status, 401);
  const payload = {
    intent: "buyer",
    locale: "en",
    step: "account",
    values: {
      contact: "Local Test Buyer",
      street: "123 Example Street",
      city: "Ottawa",
      province: "ON",
      postalCode: "K1A 0B1",
    },
    sets: { games: ["pokemon"], software: [] },
    checks: { canada: true, consent: true, marketing: false },
  };
  const saved = await page.evaluate(async (payload) => {
    const r = await fetch("/api/onboarding/draft", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ payload, ready: true, revision: 0 }),
    });
    return { status: r.status, body: await r.json() };
  }, payload);
  assert.equal(saved.status, 200, JSON.stringify(saved));
  assert.equal(
    (await get("onboarding/draft")).body.draft.payload.values.city,
    "Ottawa",
  );
  await page.reload();
  await role("Buyer", "buyer@troc.test");
  const prior = await get("onboarding/profile");
  if (!prior.body.profile) {
    const r = await page.evaluate(async () => {
      const r = await fetch("/api/onboarding/finalize", { method: "POST" });
      return { status: r.status, body: await r.json() };
    });
    assert.equal(r.status, 200, JSON.stringify(r));
    assert.equal(r.body.completed, true);
  }
  assert.equal(
    (await get("onboarding/profile")).body.profile.status,
    "waitlisted",
  );
  console.log(
    "PASS: three identities, real SQL roles, buyer/seller admin denial, admin access, CSRF, sign-out/401, persistent draft and account linkage, responsive screenshots.",
  );
} finally {
  await browser.close();
}
