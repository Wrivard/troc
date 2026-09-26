import test from "node:test";
import assert from "node:assert/strict";
import { once } from "node:events";
import app from "../artifacts/api-server/src/app";
import { commerceConfig } from "../artifacts/api-server/src/modules/commerce/config";
test("public seller fees expose only current simulation fee fields without DB or identity", async () => {
  const server = app.listen(0, "127.0.0.1");
  await once(server, "listening");
  try {
    const address = server.address();
    assert.ok(address && typeof address !== "string");
    const response = await fetch(
      "http://127.0.0.1:" + address.port + "/api/public/seller-fees",
    );
    assert.equal(response.status, 200);
    assert.equal(response.headers.get("cache-control"), "no-store");
    const data = await response.json();
    const keys = [
      "commissionBps",
      "shippingCommissionBps",
      "promotedBps",
      "processingBps",
      "processingFixedCents",
    ] as const;
    assert.deepEqual(Object.keys(data).sort(), ["mode", ...keys].sort());
    assert.equal(data.mode, "demo");
    for (const key of keys) assert.equal(data[key], commerceConfig[key]);
  } finally {
    server.closeAllConnections();
    await new Promise<void>((resolve) => server.close(() => resolve()));
  }
});
