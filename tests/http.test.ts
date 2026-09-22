import { test } from "node:test";
import assert from "node:assert/strict";
import app from "../artifacts/api-server/src/app";
test("HTTP authorization fails closed without configuration and blocks foreign origins", async () => {
  delete process.env.SUPABASE_URL;
  delete process.env.DATABASE_URL;
  process.env.APP_ORIGIN = "http://localhost:5173";
  const server = app.listen(0, "127.0.0.1");
  await new Promise<void>((resolve) => server.once("listening", resolve));
  const address = server.address();
  assert.ok(address && typeof address !== "string");
  const url = `http://127.0.0.1:${address.port}/api`;
  try {
    const account = await fetch(`${url}/account`, {
      headers: { "x-user-id": "fake-admin", "x-role": "admin" },
    });
    assert.equal(account.status, 503);
    assert.deepEqual(await account.json(), { code: "service_unavailable" });
    const foreign = await fetch(`${url}/auth/sign-in`, {
      method: "POST",
      headers: {
        origin: "https://evil.invalid",
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        email: "test@example.invalid",
        password: "password123",
      }),
    });
    assert.equal(foreign.status, 403);
    const missingOrigin = await fetch(`${url}/account/preferences`, {
      method: "PATCH",
    });
    assert.equal(missingOrigin.status, 403);
    const inventoryPath = `${url}/inventory/11111111-1111-4111-8111-111111111111/imports`;
    const inventoryBody = JSON.stringify({ csv: "x".repeat(20000) });
    const inventoryForeign = await fetch(inventoryPath, {
      method: "POST",
      headers: {
        origin: "https://evil.invalid",
        "Content-Type": "application/json",
      },
      body: inventoryBody,
    });
    assert.equal(inventoryForeign.status, 403);
    const inventoryUnconfigured = await fetch(inventoryPath, {
      method: "POST",
      headers: {
        origin: "http://localhost:5173",
        "Content-Type": "application/json",
        "x-role": "admin",
      },
      body: inventoryBody,
    });
    // The bounded CSV route accepts >16 KB but still fails closed on real identity.
    assert.equal(inventoryUnconfigured.status, 503);
  } finally {
    await new Promise<void>((resolve, reject) =>
      server.close((error) => (error ? reject(error) : resolve())),
    );
  }
});
