import { test } from "node:test";
import assert from "node:assert/strict";
import { canHydrateCart } from "../artifacts/marketplace/src/modules/commerce/cart-storage";
test("account cart hydrates only when local state is confirmed absent", () => {
  const original = Object.getOwnPropertyDescriptor(globalThis, "localStorage");
  let value: string | null = null;
  try {
    Object.defineProperty(globalThis, "localStorage", {
      configurable: true,
      value: { getItem: () => value },
    });
    assert.equal(canHydrateCart(), true);
    for (const stored of [
      "[]",
      '[{"listingId":"legacy","quantity":1}]',
      "malformed",
      "{}",
      "null",
    ]) {
      value = stored;
      assert.equal(canHydrateCart(), false);
    }
    value = null;
    assert.equal(canHydrateCart(), true);
    // An edit completed during the GET changes the response-time answer.
    value = "[]";
    assert.equal(canHydrateCart(), false);
    Object.defineProperty(globalThis, "localStorage", {
      configurable: true,
      value: {
        getItem: () => {
          throw new Error("Storage denied");
        },
      },
    });
    assert.equal(canHydrateCart(), false);
  } finally {
    if (original) Object.defineProperty(globalThis, "localStorage", original);
    else Reflect.deleteProperty(globalThis, "localStorage");
  }
});
