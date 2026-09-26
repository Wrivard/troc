import { test } from "node:test";
import assert from "node:assert/strict";
import express from "../artifacts/api-server/node_modules/express/index.js";
import {
  requestRateLimit,
  type LimitEngine,
} from "../artifacts/api-server/src/modules/security/rate-limit";
async function serve(
  handler: ReturnType<typeof requestRateLimit>,
  work: (url: string) => Promise<void>,
) {
  const app = express();
  app.use(handler);
  app.get("/", (_req, res) => res.json({ ok: true }));
  const server = app.listen(0, "127.0.0.1");
  await new Promise<void>((resolve) => server.once("listening", resolve));
  const addr = server.address();
  if (!addr || typeof addr === "string") throw Error("no address");
  try {
    await work("http://127.0.0.1:" + addr.port);
  } finally {
    await new Promise<void>((resolve, reject) =>
      server.close((e) => (e ? reject(e) : resolve())),
    );
  }
}
const policy = { namespace: "test-onboarding", limit: 2, windowMs: 60000 };
const config = {
  backend: "upstash",
  production: true,
  keySecret: "fixture-secret-with-at-least-32-characters",
};
test("distributed limiter shares identity, hashes IP and ignores untrusted forwarded spoofing", async () => {
  const keys: string[] = [];
  let count = 0;
  const engine: LimitEngine = {
    async limit(key) {
      keys.push(key);
      count++;
      return {
        success: count <= 2,
        limit: 2,
        remaining: Math.max(0, 2 - count),
        reset: Date.now() + 30000,
      };
    },
  };
  await serve(requestRateLimit(policy, config, engine), async (url) => {
    assert.equal((await fetch(url)).status, 200);
    assert.equal(
      (await fetch(url, { headers: { "X-Forwarded-For": "8.8.8.8" } })).status,
      200,
    );
    const blocked = await fetch(url, {
      headers: { "X-Forwarded-For": "1.1.1.1" },
    });
    assert.equal(blocked.status, 429);
    assert.equal(blocked.headers.get("ratelimit-remaining"), "0");
    assert.ok(Number(blocked.headers.get("retry-after")) > 0);
  });
  assert.equal(new Set(keys).size, 1);
  assert.match(keys[0], /^[0-9a-f]{64}$/);
});
test("missing production configuration, SDK timeout-success and transport errors fail closed", async () => {
  for (const handler of [
    requestRateLimit(policy, { production: true }),
    requestRateLimit(policy, config, {
      async limit() {
        return {
          success: true,
          limit: 2,
          remaining: 2,
          reset: Date.now() + 1000,
          reason: "timeout",
        };
      },
    }),
    requestRateLimit(policy, config, {
      async limit() {
        throw Error("private upstream detail");
      },
    }),
  ])
    await serve(handler, async (url) => {
      const r = await fetch(url);
      assert.equal(r.status, 503);
      assert.equal(r.headers.get("retry-after"), "5");
      assert.deepEqual(await r.json(), { code: "rate_limit_unavailable" });
    });
});
test("local development retains bounded memory limiting", async () => {
  await serve(
    requestRateLimit({ ...policy, limit: 1 }, { production: false }),
    async (url) => {
      assert.equal((await fetch(url)).status, 200);
      assert.equal((await fetch(url)).status, 429);
    },
  );
});
