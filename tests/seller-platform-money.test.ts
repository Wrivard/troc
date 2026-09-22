import { test } from "node:test";
import assert from "node:assert/strict";
import { formatCad } from "../artifacts/marketplace/src/modules/seller-platform/money";
test("CAD dashboard amounts preserve every integer cent in EN and FR", () => {
  assert.equal(formatCad("9007199254740993", "en"), "$90,071,992,547,409.93");
  assert.equal(formatCad("9007199254740993", "fr"), "90 071 992 547 409,93 $");
  assert.equal(formatCad("1", "en"), "$0.01");
  assert.equal(formatCad("0", "fr"), "0,00 $");
  for (const invalid of ["NaN", "1.3", "1e3", "-1", ""])
    assert.equal(formatCad(invalid, "en"), "—");
});
