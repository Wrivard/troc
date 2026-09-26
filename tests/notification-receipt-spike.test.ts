import { test } from "node:test";
import assert from "node:assert/strict";
import { mkdtemp, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { resolve, dirname, basename, join } from "node:path";
import { PGlite } from "@electric-sql/pglite";
import {
  planEmailRecovery,
  type EmailReceiptSnapshot,
} from "../artifacts/api-server/src/modules/notifications/recovery-policy";

// Isolated persistence experiment, NOT an application migration or a second job queue.
type Claim = { id: string; fence: number; key: string; digest: string };
type Row = {
  id: string;
  source: EmailReceiptSnapshot["source"];
  state: EmailReceiptSnapshot["state"] | "reconcile";
  digest: string;
  attempted_digest: string | null;
  first_attempt: number | null;
  provider_id: string | null;
  attempts: number;
  fence: number;
  lease_until: number | null;
  key: string;
};
class Receipts {
  constructor(readonly db: PGlite) {}
  async claim(
    id: string,
    now: number,
    approved = false,
  ): Promise<Claim | null> {
    return this.db.transaction(async (tx) => {
      const row = (
        await tx.query<Row>("SELECT * FROM receipt WHERE id=$1 FOR UPDATE", [
          id,
        ])
      ).rows[0];
      if (
        !row ||
        row.state === "reconcile" ||
        (row.lease_until !== null && Number(row.lease_until) > now)
      )
        return null;
      const decision = planEmailRecovery(
        {
          source: row.source,
          state: row.state,
          payloadDigest: row.digest,
          attemptedPayloadDigest: row.attempted_digest ?? undefined,
          firstAttemptAt:
            row.first_attempt === null ? undefined : Number(row.first_attempt),
          providerMessageId: row.provider_id ?? undefined,
          attempts: row.attempts,
        },
        now,
        approved,
      );
      if (decision === "reconcile") {
        await tx.query(
          "UPDATE receipt SET state='reconcile',lease_until=NULL WHERE id=$1",
          [id],
        );
        return null;
      }
      if (decision !== "first_attempt" && decision !== "retry_same_request")
        return null;
      const updated = (
        await tx.query<Row>(
          "UPDATE receipt SET state='attempted',fence=fence+1,attempts=attempts+1,first_attempt=coalesce(first_attempt,$2),attempted_digest=coalesce(attempted_digest,digest),lease_until=$2+30000 WHERE id=$1 RETURNING *",
          [id, now],
        )
      ).rows[0];
      return {
        id,
        fence: updated.fence,
        key: updated.key,
        digest: updated.digest,
      };
    });
  }
  async accept(claim: Claim, messageId: string, now: number) {
    const result = await this.db.query(
      "UPDATE receipt SET state='accepted',provider_id=$3,lease_until=NULL WHERE id=$1 AND fence=$2 AND state='attempted' AND lease_until>$4 RETURNING id",
      [claim.id, claim.fence, messageId, now],
    );
    return result.rows.length === 1;
  }
}
test("isolated SQL receipts: restart, ambiguous acceptance, stale fencing and retry expiry", async (t) => {
  const parent = resolve(tmpdir());
  const directory = await mkdtemp(join(parent, "troc-receipt-"));
  let db = new PGlite(directory);
  try {
    await db.exec(`CREATE TABLE receipt(
      id text PRIMARY KEY,event_id text NOT NULL,recipient_id text NOT NULL,channel text NOT NULL DEFAULT 'email',
      source text NOT NULL CHECK(source IN ('live','simulation')),
      state text NOT NULL DEFAULT 'pending' CHECK(state IN ('pending','attempted','accepted','dead','reconcile')),
      digest text NOT NULL,attempted_digest text,first_attempt bigint,provider_id text,
      attempts integer NOT NULL DEFAULT 0 CHECK(attempts>=0),fence integer NOT NULL DEFAULT 0,
      lease_until bigint,key text NOT NULL UNIQUE,
      UNIQUE(event_id,recipient_id,channel),
      CHECK(state<>'accepted' OR provider_id IS NOT NULL)
    );`);
    let store = new Receipts(db);
    const seed = async (id: string, source = "live") =>
      db.query(
        "INSERT INTO receipt(id,event_id,recipient_id,source,digest,key) VALUES($1,$1,'fictional-recipient',$2,$3,$4)",
        [id, source, "a".repeat(64), "receipt:" + id],
      );
    const accepted = new Map<string, { digest: string; id: string }>();
    let effects = 0;
    const fakeTransport = (claim: Claim) => {
      const existing = accepted.get(claim.key);
      if (existing) {
        assert.equal(existing.digest, claim.digest);
        return existing.id;
      }
      const id = "fake-provider-" + ++effects;
      accepted.set(claim.key, { digest: claim.digest, id });
      return id;
    };
    const at = 1_000_000;
    await t.test(
      "unique recipient receipt and source gates before any transport",
      async () => {
        await seed("simulation", "simulation");
        assert.equal(await store.claim("simulation", at, true), null);
        await seed("blocked");
        assert.equal(await store.claim("blocked", at), null);
        await assert.rejects(
          db.query(
            "INSERT INTO receipt(id,event_id,recipient_id,source,digest,key) VALUES('duplicate','blocked','fictional-recipient','live',$1,'different-key')",
            ["a".repeat(64)],
          ),
          /unique/,
        );
        assert.equal(effects, 0);
      },
    );
    await t.test(
      "competing embedded claims and accepted response lost before receipt commit",
      async () => {
        await seed("ambiguous");
        const claims = await Promise.all([
          store.claim("ambiguous", at, true),
          store.claim("ambiguous", at, true),
        ]);
        assert.equal(claims.filter(Boolean).length, 1);
        const first = claims.find(Boolean)!;
        const providerId = fakeTransport(first);
        // Crash point: provider accepted, but no durable accept() call occurred.
        await db.close();
        db = new PGlite(directory);
        store = new Receipts(db);
        assert.equal(await store.claim("ambiguous", at + 100, true), null);
        assert.equal(await store.accept(first, providerId, at + 30000), false);
        const retry = await store.claim("ambiguous", at + 30001, true);
        assert.ok(retry);
        assert.equal(retry.key, first.key);
        assert.equal(retry.digest, first.digest);
        assert.ok(retry.fence > first.fence);
        assert.equal(await store.accept(first, providerId, at + 30002), false);
        assert.equal(fakeTransport(retry), providerId);
        assert.equal(effects, 1);
        assert.equal(await store.accept(retry, providerId, at + 30003), true);
        await db.close();
        db = new PGlite(directory);
        store = new Receipts(db);
        assert.equal(
          await store.claim("ambiguous", at + 7 * 86400000, true),
          null,
        );
        assert.equal(effects, 1);
      },
    );
    await t.test(
      "pre-send crash retries; expired protection and payload drift require reconciliation",
      async () => {
        await seed("before-send");
        const first = await store.claim("before-send", at, true);
        assert.ok(first);
        const retry = await store.claim("before-send", at + 30001, true);
        assert.ok(retry);
        assert.equal(await store.accept(first, "stale", at + 30002), false);
        assert.equal(
          await store.accept(retry, fakeTransport(retry), at + 30002),
          true,
        );
        await seed("too-old");
        assert.ok(await store.claim("too-old", at, true));
        assert.equal(
          await store.claim("too-old", at + 23 * 3600000, true),
          null,
        );
        assert.equal(
          (await db.query<Row>("SELECT * FROM receipt WHERE id='too-old'"))
            .rows[0].state,
          "reconcile",
        );
        await seed("changed");
        assert.ok(await store.claim("changed", at, true));
        await db.query("UPDATE receipt SET digest=$1 WHERE id='changed'", [
          "b".repeat(64),
        ]);
        assert.equal(await store.claim("changed", at + 30001, true), null);
        assert.equal(
          (await db.query<Row>("SELECT * FROM receipt WHERE id='changed'"))
            .rows[0].state,
          "reconcile",
        );
        assert.equal(effects, 2);
      },
    );
  } finally {
    await db.close();
    const target = resolve(directory);
    if (
      dirname(target) !== parent ||
      !basename(target).startsWith("troc-receipt-")
    )
      assert.fail("Unexpected cleanup path");
    await rm(target, { recursive: true, force: true });
  }
});
