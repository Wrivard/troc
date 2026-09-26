import { test } from "node:test";
import assert from "node:assert/strict";
import { randomBytes, randomUUID } from "node:crypto";
import { readFile, readdir } from "node:fs/promises";
import { PGlite } from "@electric-sql/pglite";
import { pg_trgm } from "@electric-sql/pglite/contrib/pg_trgm";
import { PrelaunchService } from "../artifacts/api-server/src/modules/prelaunch/service";
import {
  onboardingContract,
  onboardingSignup,
  summarizeOnboarding,
  summaryWindow,
} from "../artifacts/api-server/src/modules/prelaunch/onboarding";
import { DomainError } from "../artifacts/api-server/src/modules/shared/domain";
import { consentVersion } from "../artifacts/api-server/src/modules/prelaunch/validation";
import { prelaunchRouter } from "../artifacts/api-server/src/routes/prelaunch";
import type { Sql } from "../artifacts/api-server/src/modules/commerce/data";
import type { Principal } from "../artifacts/api-server/src/modules/auth/permissions";
import express from "../artifacts/api-server/node_modules/express/index.js";

const payload = (email = "both@example.test") => ({
  email,
  contact: "Local Test",
  intent: "both",
  country: "CA",
  locale: "fr",
  province: "QC",
  games: ["pokemon"],
  consent: true,
  consentVersion: onboardingContract.consentVersion,
  marketingConsent: false,
  withdrawal: randomBytes(32).toString("base64url"),
  buyer: {
    frequency: "monthly",
    monthlySpend: "25_99",
    channels: ["lgs"],
    desiredFeatures: ["combined_shipping"],
  },
  seller: {
    adult: true,
    sellerType: "individual",
    inventory: "10000_49999",
    initialListings: "100_999",
    readiness: "within_1_month",
    channels: ["ebay"],
    software: ["spreadsheet"],
  },
});
const window = {
  from: "2020-01-01T00:00:00.000Z",
  to: "2020-12-31T00:00:00.000Z",
};
const currentWindow = () => ({
  from: new Date(Date.now() - 86400000).toISOString(),
  to: new Date(Date.now() + 86400000).toISOString(),
});

test("D37 validates role branches, bounded fields, separate optional consent and range semantics", () => {
  const p = payload(),
    parsed = onboardingSignup(p);
  assert.equal(parsed.seller?.inventory, "10000_49999");
  assert.equal(parsed.seller?.initialListings, "100_999");
  assert.equal(parsed.buyer?.marketingConsent, false);
  assert.equal(parsed.seller?.monthlySales, "not_specified");
  for (const patch of [
    { intent: "buyer" },
    { intent: "seller" },
    { intent: "both", buyer: undefined },
    { consent: false },
    { consentVersion },
    { marketingConsent: undefined },
    { marketingConsent: "true" },
    { games: [] },
    { games: ["fake"] },
    { country: "US" },
    { province: "XX" },
    { email: "bad" },
    { contact: " " },
    { withdrawal: "short" },
    { website: "spam" },
    { seller: { ...p.seller, adult: false } },
    { seller: { ...p.seller, initialListings: "50000" } },
    { seller: { ...p.seller, storeUrl: "javascript:alert(1)" } },
    { seller: { ...p.seller, storeUrl: "https://user:secret@example.test" } },
    { buyer: { ...p.buyer, monthlySpend: 50 } },
    { buyer: { ...p.buyer, wishlist: "x".repeat(1001) } },
  ])
    assert.throws(() => onboardingSignup({ ...p, ...patch }));
  assert.equal(
    onboardingSignup({ ...p, intent: "buyer", seller: undefined }).seller,
    null,
  );
  assert.equal(
    onboardingSignup({ ...p, intent: "seller", buyer: undefined }).buyer,
    null,
  );
  assert.equal(
    onboardingSignup({ ...p, email: " BOTH@EXAMPLE.TEST " }).email,
    p.email,
  );
  assert.throws(() =>
    summaryWindow({ ...window, to: "2022-01-01T00:00:00.000Z" }),
  );
  assert.throws(() => summaryWindow({ ...window, source: "__proto__" }));
  assert.throws(() => summaryWindow({ ...window, to: window.from }));
  assert.throws(() =>
    summaryWindow({ ...window, from: "2020-02-30T00:00:00.000Z" }),
  );
});

test("D37 runtime-role transactions: both dedupe, rollback, legacy preservation, reporting and HTTP guards", async (t) => {
  const db = new PGlite({ extensions: { pg_trgm } });
  const dir = new URL("../lib/db/migrations/", import.meta.url);
  try {
    for (const file of (await readdir(dir))
      .filter((f) => f.endsWith(".sql"))
      .sort())
      await db.exec(await readFile(new URL(file, dir), "utf8"));
    const actor = randomUUID();
    await db.query(
      "INSERT INTO troc.users(id,email) VALUES($1,'admin@example.test')",
      [actor],
    );
    const admin: Principal = {
      userId: actor,
      roles: ["admin"],
      memberships: [],
    };
    const store = {
      transaction: <T>(work: (sql: Sql) => Promise<T>) =>
        db.transaction(async (tx) => {
          await tx.exec("SET LOCAL ROLE troc_backend");
          return work(tx as Sql);
        }),
    };
    const sql: Sql = {
      query: (q, params) => store.transaction((tx) => tx.query(q, params)),
    };
    const key = "local-test-signing-key-at-least-32-chars";
    const service = new PrelaunchService(sql, store, key);
    const session = () =>
      service.session({
        kind: "landing",
        source: "event",
        analyticsConsent: true,
      });
    const p = payload();
    const { token } = await session();
    await t.test(
      "persist both atomically, retry response-loss without overwrite or duplicate events",
      async () => {
        const first = await service.captureOnboarding({
          ...p,
          token,
          source: "partner",
        });
        assert.deepEqual(first, {
          ok: true,
          status: "received_unverified",
          emailVerified: false,
        });
        const before = (
          await db.query(
            "SELECT email,details,acquisition,withdrawal_hash,consented_at FROM troc.buyer_waitlist UNION ALL SELECT email,details,acquisition,withdrawal_hash,consented_at FROM troc.founding_seller_leads",
          )
        ).rows;
        assert.equal(before.length, 2);
        const rows = before as {
          details: Record<string, unknown>;
          acquisition: Record<string, unknown>;
          withdrawal_hash: string;
        }[];
        assert.equal(
          rows[0].acquisition.submissionId,
          rows[1].acquisition.submissionId,
        );
        assert.equal(rows[0].withdrawal_hash, rows[1].withdrawal_hash);
        assert.equal(rows[0].acquisition.source, "event");
        assert.equal(rows[0].details.marketingConsentedAt, null);
        const repeated = await service.captureOnboarding({
          ...p,
          token,
          email: p.email.toUpperCase(),
          marketingConsent: true,
          contact: "Cannot overwrite",
        });
        assert.deepEqual(repeated, first);
        assert.deepEqual(
          (
            await db.query(
              "SELECT email,details,acquisition,withdrawal_hash,consented_at FROM troc.buyer_waitlist UNION ALL SELECT email,details,acquisition,withdrawal_hash,consented_at FROM troc.founding_seller_leads",
            )
          ).rows,
          before,
        );
        assert.equal(
          (
            await db.query(
              "SELECT count(*)::int AS n FROM troc.prelaunch_events WHERE name='completion'",
            )
          ).rows[0].n,
          1,
        );
      },
    );
    await t.test(
      "rollback first role when second insert fails; explicit retry succeeds",
      async () => {
        let fail = true;
        const failingStore = {
          transaction: <T>(work: (sql: Sql) => Promise<T>) =>
            store.transaction((tx) =>
              work({
                query: async (q, params) => {
                  if (
                    fail &&
                    q.includes("INSERT INTO troc.founding_seller_leads")
                  )
                    throw new Error("injected_failure");
                  return tx.query(q, params);
                },
              }),
            ),
        };
        const failing = new PrelaunchService(sql, failingStore, key),
          data = payload("rollback@example.test");
        await assert.rejects(failing.captureOnboarding({ ...data, token }));
        assert.equal(
          (
            await db.query(
              "SELECT id FROM troc.buyer_waitlist WHERE email=$1",
              [data.email],
            )
          ).rows.length,
          0,
        );
        fail = false;
        await failing.captureOnboarding({ ...data, token });
        assert.equal(
          (
            await db.query(
              "SELECT id FROM troc.founding_seller_leads WHERE email=$1",
              [data.email],
            )
          ).rows.length,
          1,
        );
      },
    );
    await t.test(
      "existing legacy or withdrawn lead cannot be upgraded/reconsented by email",
      async () => {
        const legacy = await service.session({
          kind: "collector",
          source: "direct",
          analyticsConsent: false,
        });
        const old = {
          email: "legacy@example.test",
          locale: "en",
          consent: true,
          consentVersion,
          country: "CA",
          province: "ON",
          games: [],
          channels: [],
          frequency: "monthly",
          withdrawal: randomBytes(32).toString("base64url"),
        };
        await service.capture({ ...old, token: legacy.token });
        await service.withdraw({
          kind: "collector",
          withdrawal: old.withdrawal,
        });
        await service.captureOnboarding({
          ...payload(old.email),
          token,
          marketingConsent: true,
        });
        assert.equal(
          (
            await db.query(
              "SELECT id FROM troc.founding_seller_leads WHERE email=$1",
              [old.email],
            )
          ).rows.length,
          0,
        );
        assert.ok(
          (
            await db.query(
              "SELECT unsubscribed_at FROM troc.buyer_waitlist WHERE email=$1",
              [old.email],
            )
          ).rows[0].unsubscribed_at,
        );
        await assert.rejects(
          service.captureOnboarding({
            ...payload("wrong-session@example.test"),
            token: legacy.token,
          }),
          /session_conflict/,
        );
      },
    );
    await t.test(
      "aggregates unique email segments with windows/source, no PII or precise forecasts",
      async () => {
        const buyer = payload("buyer@example.test");
        await service.captureOnboarding({
          ...buyer,
          intent: "buyer",
          seller: undefined,
          marketingConsent: true,
          token,
        });
        const seller = payload("seller@example.test");
        await service.captureOnboarding({
          ...seller,
          intent: "seller",
          buyer: undefined,
          token,
        });
        const result = await service.onboardingSummary(admin, currentWindow());
        assert.equal(result.uniqueEmailLeads, 4);
        assert.deepEqual(result.segments, {
          buyerOnly: 1,
          sellerOnly: 1,
          both: 2,
        });
        assert.equal(result.marketingOptIn, 1);
        assert.equal(
          result.distributions["seller.inventory"]["10000_49999"],
          3,
        );
        assert.equal(
          result.distributions["seller.initialListings"]["100_999"],
          3,
        );
        const output = JSON.stringify(result);
        for (const sensitive of [
          "@example.test",
          "Local Test",
          "withdrawal",
          "submissionId",
          "sessionId",
        ])
          assert.ok(!output.includes(sensitive));
        assert.equal(
          (
            await service.onboardingSummary(admin, {
              ...currentWindow(),
              source: "social",
            })
          ).uniqueEmailLeads,
          0,
        );
        assert.equal(
          (await service.onboardingSummary(admin, window)).uniqueEmailLeads,
          0,
        );
        for (const principal of [null, { ...admin, roles: [] }])
          await assert.rejects(
            service.onboardingSummary(principal, currentWindow()),
          );
        await service.withdraw({ kind: "both", withdrawal: p.withdrawal });
        assert.deepEqual(
          (await service.onboardingSummary(admin, currentWindow())).segments,
          { buyerOnly: 1, sellerOnly: 1, both: 1 },
        );
      },
    );
    await t.test(
      "HTTP preserves unavailable/origin/body/auth guards and no-store generic confirmation",
      async () => {
        const app = express();
        const config = {
          enabled: true,
          databaseReady: true,
          appOrigin: "http://localhost",
          signingKey: key,
        };
        app.use(
          "/api",
          prelaunchRouter(
            sql,
            store,
            async () => {
              throw new DomainError("unauthorized", 401);
            },
            config,
          ),
        );
        app.use(
          "/off",
          prelaunchRouter(sql, store, async () => admin, {
            ...config,
            enabled: false,
          }),
        );
        app.use(
          "/fail",
          prelaunchRouter(
            sql,
            {
              transaction: async () => {
                throw new Error("private database failure");
              },
            },
            async () => admin,
            config,
          ),
        );
        const server = app.listen(0, "127.0.0.1");
        await new Promise<void>((resolve) => server.once("listening", resolve));
        try {
          const address = server.address();
          assert.ok(address && typeof address !== "string");
          const base = `http://127.0.0.1:${address.port}`;
          const post = (
            path: string,
            body: unknown,
            origin = "http://localhost",
          ) =>
            fetch(base + path, {
              method: "POST",
              headers: { "Content-Type": "application/json", Origin: origin },
              body: JSON.stringify(body),
            });
          assert.equal(
            (await fetch(base + "/off/onboarding/contract")).status,
            503,
          );
          const contract = await fetch(base + "/api/onboarding/contract");
          assert.equal(contract.headers.get("cache-control"), "no-store");
          assert.equal(
            (await contract.json()).consentVersion,
            onboardingContract.consentVersion,
          );
          assert.equal(
            (
              await post(
                "/api/onboarding/leads",
                { ...payload(), token },
                "https://other.test",
              )
            ).status,
            403,
          );
          assert.equal(
            (await post("/api/onboarding/leads", { pad: "x".repeat(13000) }))
              .status,
            413,
          );
          assert.equal(
            (
              await post("/api/onboarding/leads", {
                ...payload(),
                token,
                consent: false,
              })
            ).status,
            400,
          );
          const fresh = { ...payload("http-persisted@example.test"), token };
          const persisted = await post("/api/onboarding/leads", fresh);
          assert.equal(persisted.status, 202);
          assert.equal(
            (
              await db.query(
                "SELECT id FROM troc.buyer_waitlist WHERE email=$1",
                [fresh.email],
              )
            ).rows.length,
            1,
          );
          assert.deepEqual(
            await persisted.json(),
            await (await post("/api/onboarding/leads", fresh)).json(),
          );
          const failed = await post("/fail/onboarding/leads", {
            ...payload("failed-http@example.test"),
            token,
          });
          assert.equal(failed.status, 503);
          assert.deepEqual(await failed.json(), {
            code: "prelaunch_unavailable",
          });
          const ok = await post("/api/onboarding/leads", {
            ...payload(),
            token,
          });
          assert.equal(ok.status, 202);
          assert.deepEqual(await ok.json(), {
            ok: true,
            status: "received_unverified",
            emailVerified: false,
          });
          assert.equal(
            (
              await fetch(
                base +
                  "/api/admin/onboarding-summary?" +
                  new URLSearchParams(currentWindow()),
              )
            ).status,
            401,
          );
        } finally {
          await new Promise<void>((resolve, reject) =>
            server.close((err) => (err ? reject(err) : resolve())),
          );
        }
      },
    );
    await t.test(
      "real SQL row cap fails closed; active window includes exact boundaries and deduplicates legacy rows",
      async () => {
        await db.query(`INSERT INTO troc.buyer_waitlist(email,locale,consent_version,consented_at,created_at,details)
        VALUES('duplicate@example.test','en','legacy',now(),'2020-01-01T00:00:00Z','{"frequency":"weekly"}'),
              (' DUPLICATE@EXAMPLE.TEST ','fr','legacy',now(),'2020-02-01T00:00:00Z','{"frequency":"monthly"}'),
              ('excluded@example.test','en','legacy',now(),'2020-12-31T00:00:00Z','{}')`);
        const old = await service.onboardingSummary(admin, window);
        assert.equal(old.uniqueEmailLeads, 1);
        assert.equal(old.distributions["buyer.frequency"].weekly, 1);
        assert.equal(old.distributions["buyer.frequency"].monthly, undefined);
        await db.query(`INSERT INTO troc.buyer_waitlist(email,locale,consent_version,consented_at,created_at)
        SELECT 'cap-'||n||'@example.test','en','legacy',now(),'2020-06-01T00:00:00Z' FROM generate_series(1,9998) n`);
        assert.equal(
          (await service.onboardingSummary(admin, window)).uniqueEmailLeads,
          9999,
        );
        await db.query(`INSERT INTO troc.buyer_waitlist(email,locale,consent_version,consented_at,created_at)
        VALUES('over-cap@example.test','en','legacy',now(),'2020-06-01T00:00:00Z')`);
        await assert.rejects(
          service.onboardingSummary(admin, window),
          /capacity_exceeded/,
        );
      },
    );
  } finally {
    await db.close();
  }
});

test("D37 summary caps and legacy/prototype-safe categorical reporting", () => {
  const row = {
    role: "buyer" as const,
    email: "A@example.test",
    details: {
      province: "__proto__",
      frequency: "constructor",
      games: ["pokemon"],
      contact: "private",
    },
    acquisition: { source: "secret" },
  };
  const summary = summarizeOnboarding([
    row,
    { ...row, email: " a@EXAMPLE.test " },
  ]);
  assert.equal(summary.uniqueEmailLeads, 1);
  assert.equal(summary.distributions.province.not_specified, 1);
  assert.equal(summary.distributions["buyer.frequency"].not_specified, 1);
  assert.equal(summary.marketingOptIn, 0);
  assert.equal(
    summarizeOnboarding(Array.from({ length: 10000 }, () => row))
      .uniqueEmailLeads,
    1,
  );
  assert.throws(
    () => summarizeOnboarding(Array.from({ length: 10001 }, () => row)),
    /capacity_exceeded/,
  );
});

test("precise listing ranges retain conditional integration context and legacy answers", () => {
  const p = payload();
  for (const range of onboardingContract.initialListings) {
    const parsed = onboardingSignup({
      ...p,
      seller: {
        ...p.seller,
        initialListings: range,
        initialListingsScenario: "one_click_if_available",
      },
    });
    assert.equal(parsed.seller?.initialListings, range);
    assert.equal(
      parsed.seller?.initialListingsScenario,
      "one_click_if_available",
    );
  }
  assert.equal(
    onboardingSignup(p).seller?.initialListingsScenario,
    "unspecified",
  );
  assert.throws(() =>
    onboardingSignup({
      ...p,
      seller: { ...p.seller, initialListingsScenario: "available_now" },
    }),
  );
});
