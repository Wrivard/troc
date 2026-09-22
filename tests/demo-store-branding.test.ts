import { test } from "node:test";
import assert from "node:assert/strict";
import { commerceSellerName } from "../artifacts/marketplace/src/modules/brand/demo-store-branding";

test("demo store presentation requires an exact seller and exclusively demo lines", () => {
  const group = {
    seller: {
      id: "00000000-0000-4000-8006-000000000001",
      name: "Maple Singles",
    },
    lines: [{ listing: { demo: true } }],
  };
  const before = structuredClone(group);
  assert.equal(commerceSellerName(group), "Piko Trading Cards");
  assert.deepEqual(group, before);
  assert.equal(commerceSellerName({ ...group, lines: [] }), "Maple Singles");
  assert.equal(
    commerceSellerName({ ...group, lines: [{ listing: { demo: false } }] }),
    "Maple Singles",
  );
  assert.equal(
    commerceSellerName({
      ...group,
      lines: [...group.lines, { listing: { demo: false } }],
    }),
    "Maple Singles",
  );
  for (const id of ["unknown", "constructor", "toString"])
    assert.equal(
      commerceSellerName({ ...group, seller: { id, name: "Unchanged" } }),
      "Unchanged",
    );
});
