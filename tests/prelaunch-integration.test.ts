import { test } from "node:test";
import assert from "node:assert/strict";

test("production prelaunch mount fails closed before foundation and never enables from demo mode", async () => {
  process.env.PRELAUNCH_ENABLED = "true";
  delete process.env.PRELAUNCH_SCHEMA_READY;
  delete process.env.DATABASE_URL;
  process.env.CATALOG_MODE = "demo";
  const { default: app } = await import("../artifacts/api-server/src/app");
  const server = app.listen(0, "127.0.0.1");
  await new Promise<void>((resolve) => server.once("listening", resolve));
  const { port } = server.address() as { port: number };
  try {
    for (const [method, path] of [
      ["POST", "sessions"],
      ["POST", "session-preferences"],
      ["POST", "leads"],
      ["POST", "withdraw"],
      ["GET", "admin/leads"],
      ["GET", "admin/metrics"],
    ]) {
      const response = await fetch(
        `http://127.0.0.1:${port}/api/prelaunch/${path}`,
        {
          method,
          ...(method === "POST"
            ? { headers: { "content-type": "application/json" }, body: "{}" }
            : {}),
        },
      );
      assert.equal(response.status, 503, path);
      assert.equal(response.headers.get("cache-control"), "no-store");
      assert.equal(response.headers.get("referrer-policy"), "no-referrer");
      assert.deepEqual(await response.json(), {
        code: "prelaunch_unavailable",
      });
    }
    const account = await fetch(`http://127.0.0.1:${port}/api/account`);
    assert.equal(account.status, 503);
    assert.deepEqual(await account.json(), { code: "service_unavailable" });
  } finally {
    await new Promise<void>((resolve, reject) =>
      server.close((error) => (error ? reject(error) : resolve())),
    );
  }
});
