import { once } from "node:events";
import express from "../artifacts/api-server/node_modules/express/index.js";
import cookieParser from "../artifacts/api-server/node_modules/cookie-parser/index.js";
import { accountOnboardingRouter } from "../artifacts/api-server/src/routes/account-onboarding";
import { DomainError } from "../artifacts/api-server/src/modules/shared/domain";
import type { Request, Response, NextFunction } from "express";
import test from "node:test";
import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import { readFile, readdir } from "node:fs/promises";
import { PGlite } from "@electric-sql/pglite";
import { pg_trgm } from "@electric-sql/pglite/contrib/pg_trgm";
import {
  AccountOnboarding,
  draftPayload,
  validateComplete,
} from "../artifacts/api-server/src/modules/prelaunch/account-onboarding";
import type { Sql } from "../artifacts/api-server/src/modules/commerce/data";
const payload = () => ({
  intent: "both",
  locale: "en",
  step: "account",
  values: {
    contact: "Test Person",
    street: "123 Example Street",
    city: "Ottawa",
    province: "ON",
    postalCode: "K1A 0B1",
    sellerType: "individual",
    inventory: "under_1000",
    initialListings: "100_249",
    readiness: "at_launch",
  },
  sets: { games: ["pokemon"], software: ["none"] },
  checks: { canada: true, adult: true, consent: true, marketing: false },
});
test("draft allowlist excludes credentials and rejects incomplete readiness and conflicting tools", () => {
  const p = payload();
  const parsed = draftPayload({
    ...p,
    password: "never store",
    values: {
      ...p.values,
      password: "secret",
      email: "not-identity@test.invalid",
    },
  });
  assert.equal("password" in parsed.values, false);
  validateComplete(parsed);
  assert.throws(() =>
    validateComplete(
      draftPayload({ ...p, checks: { ...p.checks, consent: false } }),
    ),
  );
  assert.throws(() =>
    validateComplete(
      draftPayload({
        ...p,
        sets: { ...p.sets, software: ["none", "sortswift"] },
      }),
    ),
  );
  assert.throws(() =>
    validateComplete(
      draftPayload({ ...p, values: { ...p.values, province: "BC" } }),
    ),
  );
});
test("real SQL runtime-role drafts: ownership, revision, atomic linkage, retries, profile edits, rollback and expiry", async () => {
  const db = new PGlite({ extensions: { pg_trgm } });
  try {
    const dir = new URL("../lib/db/migrations/", import.meta.url);
    for (const file of (await readdir(dir))
      .filter((f) => f.endsWith(".sql"))
      .sort())
      await db.exec(await readFile(new URL(file, dir), "utf8"));
    const a = randomUUID(),
      b = randomUUID();
    for (const id of [a, b]) {
      await db.query("INSERT INTO troc.users(id,email)VALUES($1,$2)", [
        id,
        id + "@example.test",
      ]);
      await db.query("INSERT INTO troc.user_profiles(user_id)VALUES($1)", [id]);
    }
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
    const service = new AccountOnboarding(sql, store);

    const app = express();
    app.use(express.json());
    app.use(cookieParser());
    let actor: string | null = null,
      admin = false;
    app.use(
      accountOnboardingRouter({
        db: sql,
        service,
        enabled: true,
        authenticate: async () => {
          if (!actor) throw new DomainError("unauthorized", 401);
          return {
            userId: actor,
            roles: admin ? ["admin"] : [],
            memberships: [],
          };
        },
      }),
    );
    app.use(
      (error: unknown, _req: Request, res: Response, _next: NextFunction) => {
        res
          .status(error instanceof DomainError ? error.status : 503)
          .json({
            code: error instanceof DomainError ? error.code : "unavailable",
          });
      },
    );
    const server = app.listen(0, "127.0.0.1");
    await once(server, "listening");
    const address = server.address();
    assert.ok(address && typeof address !== "string");
    const base = "http://127.0.0.1:" + address.port;
    let cookie = "";
    const call = (path: string, method = "GET", body?: unknown) =>
      fetch(base + path, {
        method,
        headers: { "content-type": "application/json", cookie },
        body: body ? JSON.stringify(body) : undefined,
      });
    try {
      assert.equal((await call("/onboarding/profile")).status, 401);
      assert.equal((await call("/onboarding/admin/summary")).status, 401);
      const saved = await call("/onboarding/draft", "PUT", {
        payload: payload(),
        revision: 0,
        ready: true,
      });
      assert.equal(saved.status, 200);
      cookie = saved.headers.getSetCookie()[0].split(";")[0];
      assert.match(saved.headers.getSetCookie()[0], /HttpOnly/);
      assert.equal(
        (await call("/onboarding/finalize", "POST", {})).status,
        401,
      );
      actor = b;
      assert.equal(
        (await call("/onboarding/finalize", "POST", { userId: a })).status,
        200,
      );
      assert.ok(await service.profile(b));
      assert.equal(await service.profile(a), null);
      actor = null;
      assert.equal((await call("/onboarding/draft")).status, 401);
      actor = a;
      assert.equal((await call("/onboarding/draft")).status, 403);
      assert.equal((await call("/onboarding/admin/profiles")).status, 403);
      admin = true;
      const summary = await (await call("/onboarding/admin/summary")).json();
      assert.equal(summary.unit, "verified_account");
      const profiles = await (await call("/onboarding/admin/profiles")).json();
      assert.equal(profiles.items[0].answers.street, undefined);
      assert.equal(profiles.items[0].answers.postalCode, undefined);
      actor = b;
      admin = false;
      assert.equal(
        (await call("/onboarding/withdraw", "POST", {})).status,
        200,
      );
    } finally {
      server.closeAllConnections();
      await new Promise<void>((resolve) => server.close(() => resolve()));
    }
    const one = await service.save(null, payload(), 0, true);
    await service.awaitingEmail(one.token, one.revision);
    assert.equal((await service.read(one.token)).awaiting_email, true);
    const row = await service.read(one.token);
    assert.equal(row.revision, 1);
    await assert.rejects(() => service.read(one.token.slice(0, -2) + "zz"));
    await assert.rejects(() => service.save(one.token, payload(), 0, true));
    await service.finalize(one.token, a);
    await service.finalize(one.token, a);
    await assert.rejects(() => service.finalize(one.token, b));
    const profile = await service.profile(a);
    assert.equal(profile?.status, "waitlisted");
    assert.equal(
      (
        await db.query(
          "SELECT count(*)::int n FROM troc.onboarding_profiles WHERE status='waitlisted'",
        )
      ).rows[0].n,
      1,
    );
    assert.equal(
      (
        await db.query(
          "SELECT count(*)::int n FROM troc.audit_events WHERE action='onboarding.completed' AND actor_id='" +
            a +
            "'",
        )
      ).rows[0].n,
      1,
    );
    const unowned = await service.save(null, payload(), 0, true);
    await assert.rejects(() => service.finalize(unowned.token, a));
    const edit = await service.save(
      null,
      { ...payload(), intent: "buyer" },
      0,
      true,
      a,
    );
    const otherEdit = await service.save(
      null,
      { ...payload(), intent: "seller" },
      0,
      true,
      a,
    );
    await assert.rejects(() => service.save(edit.token, payload(), 1, true, b));
    await service.finalize(edit.token, a);
    await assert.rejects(() => service.finalize(otherEdit.token, a));
    assert.equal((await service.profile(a))?.payload.intent, "buyer");
    const foreign = await service.save(null, payload(), 0, true);
    await assert.rejects(() => service.finalize(foreign.token, randomUUID()));
    assert.equal((await service.read(foreign.token)).completed_by, null);
    await service.withdraw(a);
    await assert.rejects(()=>service.finalize(edit.token,a));
    assert.equal((await service.profile(a))?.status, "withdrawn");
    const expired = await service.save(null, payload(), 0, true);
    await db.query(
      "UPDATE troc.onboarding_drafts SET expires_at=now()-interval '1 day' WHERE id=$1",
      [expired.token.split(".")[0]],
    );
    await assert.rejects(() => service.ready(expired.token));
    await service.save(null, payload(), 0, false);
    assert.equal(
      (
        await db.query(
          "SELECT count(*)::int n FROM troc.onboarding_drafts WHERE expires_at<=now()",
        )
      ).rows[0].n,
      0,
    );
  } finally {
    await db.close();
  }
});
