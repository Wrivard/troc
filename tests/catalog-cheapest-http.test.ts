import test from "node:test";
import assert from "node:assert/strict";
import process from "node:process";
import { once } from "node:events";
import app from "../artifacts/api-server/src/app";
import { publicDemoCatalog } from "../artifacts/api-server/src/modules/catalog/public-demo";
test("fresh selection HTTP endpoint is uncached and validates malformed input", async () => {
  const previous = process.env.CATALOG_MODE;
  process.env.CATALOG_MODE = "demo";
  const server = app.listen(0, "127.0.0.1");
  await once(server, "listening");
  try {
    const address = server.address();
    assert.ok(address && typeof address !== "string");
    const url = "http://127.0.0.1:" + address.port + "/api/catalog/cheapest";
    const data = publicDemoCatalog(),
      product = data.products.find((p) =>
        data.offers.some((o) => o.variantId === p.variants[0].id),
      )!;
    const response = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        path: "/product/" + product.slug,
        selection: "variantId=" + product.variants[0].id,
        cart: [],
      }),
    });
    assert.equal(response.status, 200);
    assert.equal(response.headers.get("cache-control"), "no-store");
    const result = await response.json();
    assert.equal(result.offer.variantId, product.variants[0].id);
    const invalid = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ cart: [{ listingId: "a", quantity: -1 }] }),
    });
    assert.equal(invalid.status, 400);
    assert.equal(invalid.headers.get("cache-control"), "no-store");
  } finally {
    server.closeAllConnections();
    await new Promise<void>((resolve, reject) =>
      server.close((error) => (error ? reject(error) : resolve())),
    );
    if (previous === undefined) delete process.env.CATALOG_MODE;
    else process.env.CATALOG_MODE = previous;
  }
});
