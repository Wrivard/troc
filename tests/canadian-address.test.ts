import test from "node:test";
import assert from "node:assert/strict";
import { canadianAddress } from "../artifacts/api-server/src/modules/auth/canadian-address";
const valid = {
  street: "123 Example Street",
  city: "Ottawa",
  province: "ON",
  postalCode: "k1a0b1",
  country: "CA",
};
test("normalizes Canadian address and accepts every province/territory prefix", () => {
  assert.equal(canadianAddress(valid).postalCode, "K1A 0B1");
  for (const [province, prefix] of Object.entries({
    AB: "T",
    BC: "V",
    MB: "R",
    NB: "E",
    NL: "A",
    NS: "B",
    NT: "X",
    NU: "X",
    ON: "K",
    PE: "C",
    QC: "H",
    SK: "S",
    YT: "Y",
  }))
    assert.equal(
      canadianAddress({ ...valid, province, postalCode: prefix + "1A 1A1" })
        .province,
      province,
    );
});
test("rejects absent, foreign, malformed, province mismatch and oversized address values", () => {
  for (const value of [
    null,
    {},
    { ...valid, country: "US" },
    { ...valid, province: "BC" },
    { ...valid, postalCode: "90210" },
    { ...valid, postalCode: "D1A 1A1" },
    { ...valid, postalCode: "K1D 1A1" },
    { ...valid, city: " " },
    { ...valid, street: "x".repeat(161) },
  ])
    assert.throws(() => canadianAddress(value));
});
