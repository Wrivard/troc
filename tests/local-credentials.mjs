import { chromium, expect } from "@playwright/test";
import assert from "node:assert/strict";
const browser = await chromium.launch({ channel: "chrome", headless: true });
try {
  for (const role of ["buyer", "seller", "admin"]) {
    const password = process.env["TEST_" + role.toUpperCase() + "_PASSWORD"];
    assert.ok(password, "Missing test credential env");
    const c = await browser.newContext();
    const p = await c.newPage();
    await p.goto("http://127.0.0.1:4313/sign-in?lang=en");
    const r = await c.request.post("http://127.0.0.1:4313/api/auth/sign-in", {
      headers: { Origin: "http://127.0.0.1:4313" },
      data: { email: role + "@troc.test", password },
    });
    assert.equal(r.status(), 200);
    const get = (path) => c.request.get("http://127.0.0.1:4313/api/" + path);
    assert.equal((await get("account")).status(), 200);
    assert.equal(
      (await get("commerce/orders")).status(),
      200,
      "All roles retain buyer orders",
    );
    const seller = "00000000-0000-4000-8000-000000000010";
    assert.equal(
      (await get("seller/platform/" + seller + "/dashboard")).status(),
      role === "buyer" ? 403 : 200,
    );
    assert.equal(
      (await get("inventory/" + seller + "/listings")).status(),
      role === "buyer" ? 403 : 200,
    );
    assert.equal(
      (await get("onboarding/admin/profiles")).status(),
      role === "admin" ? 200 : 403,
    );
    if (role === "admin")
      assert.equal((await (await get("inventory/sellers")).json()).length, 1);
    await p.goto("http://127.0.0.1:4313/account?lang=en");
    if (role === "buyer")
      await expect(
        p.getByRole("link", { name: "Seller workspace", exact: true }),
      ).toHaveCount(0);
    else
      await expect(
        p.getByRole("link", { name: "Seller workspace", exact: true }),
      ).toBeVisible();
    await c.close();
    console.log(
      role + ": password, buyer access, seller scope, admin data verified",
    );
  }
  const c = await browser.newContext();
  const p = await c.newPage();
  await p.goto("http://127.0.0.1:4313/sign-in?lang=en");
  await p.locator("input[type=email]").fill("seller@troc.test");
  await p
    .locator("input[type=password]")
    .fill(process.env.TEST_SELLER_PASSWORD);
  await p
    .locator("form")
    .getByRole("button", { name: "Sign in", exact: true })
    .click();
  await p.waitForURL("**/account");
  await expect(
    p.getByRole("link", { name: "Seller workspace", exact: true }),
  ).toBeVisible();
  console.log("Real sign-in form PASS");
  await c.close();
} finally {
  await browser.close();
}
