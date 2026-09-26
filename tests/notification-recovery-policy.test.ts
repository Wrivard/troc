import { test } from "node:test";
import assert from "node:assert/strict";
import {
  planEmailRecovery,
  type EmailReceiptSnapshot,
} from "../artifacts/api-server/src/modules/notifications/recovery-policy";
const start = 1_000_000;
const pending: EmailReceiptSnapshot = {
  source: "live",
  state: "pending",
  payloadDigest: "a".repeat(64),
  attempts: 0,
};
const attempted: EmailReceiptSnapshot = {
  ...pending,
  state: "attempted",
  attempts: 1,
  firstAttemptAt: start,
  attemptedPayloadDigest: pending.payloadDigest,
};
test("simulation and unapproved live sources cannot become delivery candidates", () => {
  assert.equal(planEmailRecovery(pending, start), "blocked_source");
  assert.equal(
    planEmailRecovery({ ...pending, source: "simulation" }, start, true),
    "blocked_source",
  );
  assert.equal(planEmailRecovery(pending, start, true), "first_attempt");
});
test("ambiguous delivery retries preserve the original payload inside a conservative provider window", () => {
  assert.equal(
    planEmailRecovery(attempted, start + 1, true),
    "retry_same_request",
  );
  assert.equal(
    planEmailRecovery(attempted, start + 23 * 3600000 - 1, true),
    "retry_same_request",
  );
  assert.equal(
    planEmailRecovery(attempted, start + 23 * 3600000, true),
    "reconcile",
  );
  assert.equal(
    planEmailRecovery(
      { ...attempted, payloadDigest: "b".repeat(64) },
      start + 1,
      true,
    ),
    "reconcile",
  );
  assert.equal(
    planEmailRecovery({ ...attempted, attempts: 8 }, start + 1, true),
    "reconcile",
  );
});
test("accepted receipts remain terminal beyond provider retention; malformed snapshots fail closed", () => {
  assert.equal(
    planEmailRecovery(
      { ...attempted, state: "accepted", providerMessageId: "fixture-message" },
      start + 7 * 86400000,
      true,
    ),
    "already_accepted",
  );
  assert.equal(
    planEmailRecovery({ ...attempted, state: "accepted" }, start, true),
    "invalid_receipt",
  );
  assert.equal(
    planEmailRecovery({ ...attempted, state: "dead" }, start, true),
    "dead_letter",
  );
  for (const r of [
    { ...attempted, firstAttemptAt: start + 1 },
    { ...attempted, attempts: 0 },
    { ...pending, firstAttemptAt: start },
    { ...attempted, attempts: 1.5 },
    { ...attempted, attemptedPayloadDigest: undefined },
  ]) {
    assert.equal(planEmailRecovery(r, start, true), "invalid_receipt");
  }
  assert.equal(
    planEmailRecovery(attempted, Number.NaN, true),
    "invalid_receipt",
  );
});
