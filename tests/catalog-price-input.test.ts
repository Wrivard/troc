import test from "node:test";
import assert from "node:assert/strict";
import {
  priceInputCents,
  priceInputValue,
} from "../artifacts/marketplace/src/modules/catalog/price-input";
test("Canadian price input converts exact cents and rejects invalid or overflowing values", () => {
  for (const [value, cents] of [
    ["0.99", 99],
    ["0,99", 99],
    ["12.3", 1230],
    [" 0 ", 0],
    ["21474836.47", 2147483647],
  ] as const)
    assert.equal(priceInputCents(value), cents);
  assert.equal(priceInputCents(""), null);
  for (const invalid of [
    "-1",
    "1e2",
    "1.234",
    "Infinity",
    "21474836.48",
    "1,234.56",
  ])
    assert.equal(priceInputCents(invalid), undefined);
  assert.equal(priceInputValue(99), "0.99");
  assert.equal(priceInputValue(null), "");
});
