import { test } from "node:test";
import assert from "node:assert/strict";
import {
  enquiryCreateSchema,
  enquiryReplySchema,
  sellerSettingsWriteSchema,
} from "../lib/api-zod/src/seller-writes";
import { StoreEnquiries } from "../artifacts/api-server/src/modules/seller-platform/enquiries";
import { SellerPlatformService } from "../artifacts/api-server/src/modules/seller-platform/service";
import type { Sql } from "../artifacts/api-server/src/modules/commerce/data";
const key = "00000000-0000-4000-8000-000000000001";
test("seller write schemas reject malformed values without coercing security-sensitive fields", () => {
  const settings = {
    displayName: " Cards ",
    version: "v1",
    minimumOrderCents: 200,
    handlingDays: 2,
  };
  assert.equal(sellerSettingsWriteSchema.parse(settings).displayName, "Cards");
  for (const bad of [
    null,
    [],
    { ...settings, minimumOrderCents: "200" },
    { ...settings, handlingDays: 2.5 },
    { ...settings, handlingDays: 31 },
    { ...settings, displayName: " ".repeat(51) + "A" },
    { ...settings, ownerId: key },
    { ...settings, version: "" },
  ])
    assert.equal(sellerSettingsWriteSchema.safeParse(bad).success, false);
  const create = { key, subject: " Question ", body: " Hello " };
  assert.deepEqual(enquiryCreateSchema.parse(create), {
    key,
    subject: "Question",
    body: "Hello",
  });
  for (const bad of [
    null,
    [],
    { ...create, key: "invalid" },
    { ...create, body: " ".repeat(8) },
    { ...create, body: "x".repeat(2001) },
    { ...create, subject: "x".repeat(121) },
    { ...create, buyerId: key },
    { ...create, body: { html: "bad" } },
  ])
    assert.equal(enquiryCreateSchema.safeParse(bad).success, false);
  assert.equal(
    enquiryReplySchema.safeParse({ key, body: "Plain <b>text</b>" }).success,
    true,
  );
  assert.equal(
    enquiryReplySchema.safeParse({ key, body: "Valid", author: "seller" })
      .success,
    false,
  );
});
test("invalid service writes fail before opening a transaction", async () => {
  let queries = 0,
    transactions = 0;
  const db: Sql = {
    query: async () => {
      queries++;
      throw Error("unexpected query");
    },
  };
  const store = {
    transaction: async <T>(_work: (sql: Sql) => Promise<T>): Promise<T> => {
      transactions++;
      throw Error("unexpected transaction");
    },
  };
  const service = new SellerPlatformService(db, store),
    enquiries = new StoreEnquiries(db, store, service),
    p = { userId: key, roles: [], memberships: [] };
  await assert.rejects(
    service.saveSettings(p, key, {
      displayName: "Shop",
      version: "v",
      minimumOrderCents: "0",
      handlingDays: 1,
    }),
    /invalid_input/,
  );
  await assert.rejects(
    enquiries.create(p, key, { key, subject: "Q", body: "B", buyerId: key }),
    /invalid_enquiry/,
  );
  await assert.rejects(
    enquiries.reply(p, key, key, { key: "bad", body: "B" }),
    /invalid_id/,
  );
  await assert.rejects(enquiries.reply(p, key, key, null), /invalid_message/);
  assert.equal(queries, 0);
  assert.equal(transactions, 0);
});
