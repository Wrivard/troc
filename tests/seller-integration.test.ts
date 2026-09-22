import { test } from "node:test";
import assert from "node:assert/strict";
import { createRequire } from "node:module";
const require = createRequire(
  new URL("../artifacts/api-server/package.json", import.meta.url),
);
const express: typeof import("express") = require("express");

test("production seller wiring preserves origin, auth, no-store and submission rate limits", async () => {
  const previous = {
    origin: process.env.APP_ORIGIN,
    url: process.env.SUPABASE_URL,
  };
  process.env.APP_ORIGIN = "https://troc.example";
  delete process.env.SUPABASE_URL;
  const { default: foundation } =
    await import("../artifacts/api-server/src/routes/foundation");
  const app = express();
  app.use(express.json({ limit: "16kb" }));
  app.use("/api", foundation);
  const server = app.listen(0, "127.0.0.1");
  await new Promise<void>((resolve) => server.once("listening", resolve));
  const address = server.address() as { port: number };
  const origin = `http://127.0.0.1:${address.port}`;
  try {
    for (const path of [
      "/seller/applications",
      "/seller/platform/sellers",
      "/admin/seller-applications",
      "/seller/platform/00000000-0000-4000-8000-000000000001/dashboard",
      "/seller/platform/00000000-0000-4000-8000-000000000001/team",
    ]) {
      const response = await fetch(origin + "/api" + path);
      assert.equal(response.status, 503, path);
      assert.equal(response.headers.get("cache-control"), "no-store");
      assert.deepEqual(await response.json(), { code: "service_unavailable" });
    }
    const post = (site: string) =>
      fetch(origin + "/api/seller/applications", {
        method: "POST",
        headers: { origin: site, "content-type": "application/json" },
        body: "{}",
      });
    assert.equal((await post("https://foreign.example")).status, 403);
    // Five requests above share the limiter; all remaining allowed requests fail closed.
    for (let i = 0; i < 55; i++)
      assert.equal((await post("https://troc.example")).status, 503);
    assert.equal((await post("https://troc.example")).status, 429);
  } finally {
    await new Promise<void>((resolve, reject) =>
      server.close((error) => (error ? reject(error) : resolve())),
    );
    if (previous.origin === undefined) delete process.env.APP_ORIGIN;
    else process.env.APP_ORIGIN = previous.origin;
    if (previous.url === undefined) delete process.env.SUPABASE_URL;
    else process.env.SUPABASE_URL = previous.url;
  }
});
