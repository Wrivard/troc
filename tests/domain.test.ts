import { test } from "node:test";
import assert from "node:assert/strict";
import {
  can,
  authorize,
  type Principal,
  type SellerRole,
} from "../artifacts/api-server/src/modules/auth/permissions";
import {
  money,
  preferences,
  launchPolicy,
} from "../artifacts/api-server/src/modules/shared/domain";
import { applicationInput } from "../artifacts/api-server/src/modules/sellers/domain";
import { demoProvenance } from "../artifacts/api-server/src/modules/demo/domain";
import { messages } from "../artifacts/marketplace/src/messages";
const buyer: Principal = { userId: "buyer", roles: [], memberships: [] };
test("anonymous and cross-account access fail closed", () => {
  assert.equal(can(null, "account:read", "buyer"), false);
  assert.equal(can(buyer, "account:read", "other"), false);
  assert.equal(can(buyer, "account:write", "buyer"), true);
  assert.throws(() => authorize(null, "seller:apply"));
});
test("buyer cannot approve applications or mutate catalog", () => {
  assert.equal(can(buyer, "seller:apply"), true);
  for (const p of ["seller:approve", "catalog:write", "demo:purge"] as const)
    assert.equal(can(buyer, p), false);
});
for (const role of [
  "owner",
  "manager",
  "inventory",
  "fulfillment",
  "customer_service",
] as SellerRole[]) {
  test(`${role} cannot cross seller boundaries or approve themselves`, () => {
    const principal: Principal = {
      ...buyer,
      memberships: [{ sellerId: "a", role, active: true }],
    };
    assert.equal(can(principal, "inventory:write", "b"), false);
    assert.equal(can(principal, "seller:approve", "a"), false);
    assert.equal(can(principal, "seller:manage", "a"), role === "owner");
  });
}
test("suspended membership cannot mutate seller", () => {
  assert.equal(
    can(
      {
        ...buyer,
        memberships: [{ sellerId: "a", role: "owner", active: false }],
      },
      "inventory:write",
      "a",
    ),
    false,
  );
});
test("support, moderator and admin have distinct permissions", () => {
  const support: Principal = { ...buyer, roles: ["support"] };
  const moderator: Principal = { ...buyer, roles: ["catalog_moderator"] };
  assert.equal(can(support, "support:read"), true);
  assert.equal(can(support, "catalog:write"), false);
  assert.equal(can(support, "seller:approve"), false);
  assert.equal(can(moderator, "catalog:write"), true);
  assert.equal(can(moderator, "demo:purge"), false);
  assert.equal(can({ ...buyer, roles: ["admin"] }, "seller:approve"), true);
  assert.equal(
    can({ ...buyer, roles: ["admin"] }, "account:write", "other"),
    false,
  );
});
test("one-cent singles and integer-only CAD money", () => {
  assert.deepEqual(money(1), { cents: 1, currency: "CAD" });
  for (const invalid of [-1, 0.1, NaN, Infinity, Number.MAX_SAFE_INTEGER + 1])
    assert.throws(() => money(invalid));
  assert.deepEqual(launchPolicy.minimumsCents, [0, 200, 500, 1000]);
});
test("seller application requires Canadian adult and known seller type", () => {
  const valid = {
    contactName: "Collector",
    province: "QC",
    country: "CA",
    sellerType: "individual",
    adultConfirmed: true,
  };
  assert.equal(applicationInput(valid).country, "CA");
  for (const changes of [
    { country: "US" },
    { adultConfirmed: false },
    { province: "XX" },
    { sellerType: "admin" },
    { contactName: "" },
  ])
    assert.throws(() => applicationInput({ ...valid, ...changes }));
});
test("preferences validate both locales and themes", () => {
  for (const locale of ["en", "fr"])
    for (const theme of ["dark", "light"])
      assert.deepEqual(preferences({ locale, theme }), { locale, theme });
  assert.throws(() => preferences({ locale: "de", theme: "dark" }));
});
test("all account messages have EN and FR copy", () => {
  for (const pair of Object.values(messages)) {
    assert.equal(pair.length, 2);
    assert.ok(pair.every((s) => s.trim().length > 0));
  }
});
test("real leads and canonical catalog cannot be marked purgeable", () => {
  const id = "11111111-1111-1111-1111-111111111111";
  for (const table of [
    "buyer_waitlist",
    "founding_seller_leads",
    "lgs_partner_leads",
    "partner_investor_leads",
    "variants",
    "external_catalog_mappings",
  ])
    assert.throws(() => demoProvenance(table, id, id));
  assert.equal(demoProvenance("listings", id, id).table, "listings");
});
