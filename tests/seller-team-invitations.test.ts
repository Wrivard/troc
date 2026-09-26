import { createRequire } from "node:module";
import type { Request, Response, NextFunction } from "express";
import { sellerPlatformRouter } from "../artifacts/api-server/src/routes/seller-platform";
import { DomainError } from "../artifacts/api-server/src/modules/shared/domain";
import { TeamInvitations } from "../artifacts/api-server/src/modules/seller-platform/team-invitations";
import { SellerPlatformService } from "../artifacts/api-server/src/modules/seller-platform/service";
import type { Sql } from "../artifacts/api-server/src/modules/commerce/data";
import type { TransactionStore } from "../artifacts/api-server/src/modules/commerce/checkout";
import type { Principal } from "../artifacts/api-server/src/modules/auth/permissions";
import test from "node:test";
import assert from "node:assert/strict";
import { readFile, readdir } from "node:fs/promises";
import { randomUUID } from "node:crypto";
import { PGlite } from "@electric-sql/pglite";
import { pg_trgm } from "@electric-sql/pglite/contrib/pg_trgm";
test("private team invitation constraints do not grant membership", async () => {
  const db = new PGlite({ extensions: { pg_trgm } });
  try {
    const dir = new URL("../lib/db/migrations/", import.meta.url);
    for (const file of (await readdir(dir))
      .filter((f) => f.endsWith(".sql"))
      .sort())
      await db.exec(await readFile(new URL(file, dir), "utf8"));
    const owner = randomUUID(),
      recipient = randomUUID(),
      seller = randomUUID();
    for (const id of [owner, recipient])
      await db.query("INSERT INTO troc.users(id,email) VALUES($1,$2)", [
        id,
        id + "@example.test",
      ]);
    await db.query(
      "INSERT INTO troc.seller_accounts(id,slug,display_name,seller_type,status) VALUES($1,'invite-test','Invite','individual','active')",
      [seller],
    );
    await db.exec("SET ROLE troc_backend");
    const insert =
      "INSERT INTO troc.seller_team_invitations(seller_id,recipient_user_id,invited_by,role) VALUES($1,$2,$3,$4) RETURNING id";
    for (const role of ["owner", "admin", "invalid"])
      await assert.rejects(
        () => db.query(insert, [seller, recipient, owner, role]),
        /check constraint/,
      );
    await assert.rejects(
      () => db.query(insert, [seller, owner, owner, "inventory"]),
      /check constraint/,
    );
    const id = (
      await db.query<{ id: string }>(insert, [
        seller,
        recipient,
        owner,
        "inventory",
      ])
    ).rows[0].id;
    assert.equal(
      (
        await db.query("SELECT * FROM troc.seller_members WHERE seller_id=$1", [
          seller,
        ])
      ).rows.length,
      0,
    );
    await assert.rejects(
      () => db.query(insert, [seller, recipient, owner, "manager"]),
      /unique constraint/,
    );
    await assert.rejects(
      () =>
        db.query(
          "UPDATE troc.seller_team_invitations SET status='accepted' WHERE id=$1",
          [id],
        ),
      /check constraint/,
    );
    await assert.rejects(
      () =>
        db.query(
          "UPDATE troc.seller_team_invitations SET expires_at=created_at WHERE id=$1",
          [id],
        ),
      /check constraint/,
    );
    await db.query(
      "UPDATE troc.seller_team_invitations SET status='revoked',resolved_at=now() WHERE id=$1",
      [id],
    );
    await db.query(insert, [seller, recipient, owner, "manager"]);
    await assert.rejects(
      () =>
        db.query("DELETE FROM troc.seller_team_invitations WHERE id=$1", [id]),
      /permission denied/,
    );
    await db.exec(
      "RESET ROLE; CREATE ROLE invitation_browser NOLOGIN; GRANT USAGE ON SCHEMA troc TO invitation_browser; SET ROLE invitation_browser",
    );
    await assert.rejects(
      () => db.query("SELECT * FROM troc.seller_team_invitations"),
      /permission denied/,
    );
    await db.exec("RESET ROLE");
    assert.equal(
      (
        await db.query(
          "SELECT relrowsecurity FROM pg_class WHERE oid='troc.seller_team_invitations'::regclass",
        )
      ).rows[0].relrowsecurity,
      true,
    );
  } finally {
    await db.close();
  }
});

test("invitation actions enforce fresh authority, replay and atomic grants", async () => {
  const db = new PGlite({ extensions: { pg_trgm } });
  try {
    const dir = new URL("../lib/db/migrations/", import.meta.url);
    for (const file of (await readdir(dir))
      .filter((f) => f.endsWith(".sql"))
      .sort())
      await db.exec(await readFile(new URL(file, dir), "utf8"));
    const owner = randomUUID(),
      recipient = randomUUID(),
      outsider = randomUUID(),
      seller = randomUUID();
    for (const id of [owner, recipient, outsider])
      await db.query("INSERT INTO troc.users(id,email) VALUES($1,$2)", [
        id,
        id + "@example.test",
      ]);
    await db.query(
      "INSERT INTO troc.seller_accounts(id,slug,display_name,seller_type,status) VALUES($1,'actions','Actions','individual','active')",
      [seller],
    );
    await db.query(
      "INSERT INTO troc.seller_members(seller_id,user_id,role) VALUES($1,$2,'owner')",
      [seller, owner],
    );
    const principal = (userId: string): Principal => ({
      userId,
      roles: [],
      memberships: [],
    });
    const p = principal(owner),
      r = principal(recipient),
      x = principal(outsider);
    let failAudit = false;
    const store: TransactionStore = {
      transaction: (work) =>
        db.transaction(async (tx) => {
          await tx.exec("SET LOCAL ROLE troc_backend");
          const sql: Sql = {
            query: (q, args) => {
              if (failAudit && q.startsWith("INSERT INTO troc.audit_events"))
                throw new Error("audit_failure");
              return tx.query(q, args);
            },
          };
          return work(sql);
        }),
    };
    const sql: Sql = {
      query: (q, args) => store.transaction((tx) => tx.query(q, args)),
    };
    const service = new SellerPlatformService(sql, store),
      invites = new TeamInvitations(store, service);
    const input = { email: recipient + "@example.test", role: "inventory" };
    await assert.rejects(() => invites.create(x, seller, input), /forbidden/);
    await assert.rejects(
      () => invites.create(p, seller, { ...input, role: "owner" }),
      /invalid_input/,
    );
    await assert.rejects(
      () => invites.create(p, seller, { ...input, extra: true }),
      /invalid_input/,
    );
    await assert.rejects(
      () =>
        invites.create(p, seller, { ...input, email: owner + "@example.test" }),
      /member_unavailable/,
    );
    failAudit = true;
    await assert.rejects(
      () => invites.create(p, seller, input),
      /audit_failure/,
    );
    failAudit = false;
    assert.equal(
      (
        await db.query(
          "SELECT 1 FROM troc.seller_team_invitations WHERE seller_id=$1",
          [seller],
        )
      ).rows.length,
      0,
    );
    const first = await invites.create(p, seller, input);
    assert.deepEqual(await invites.create(p, seller, input), first);
    await assert.rejects(
      () => invites.create(p, seller, { ...input, role: "manager" }),
      /invitation_pending/,
    );
    await assert.rejects(
      () => invites.resolve(x, seller, first.id, "accept"),
      /invitation_unavailable/,
    );
    await assert.rejects(
      () => invites.resolve(r, randomUUID(), first.id, "accept"),
      /invitation_unavailable/,
    );
    failAudit = true;
    await assert.rejects(
      () => invites.resolve(r, seller, first.id, "accept"),
      /audit_failure/,
    );
    failAudit = false;
    assert.equal(
      (
        await db.query("SELECT 1 FROM troc.seller_members WHERE user_id=$1", [
          recipient,
        ])
      ).rows.length,
      0,
    );
    assert.equal(
      (
        await db.query(
          "SELECT status FROM troc.seller_team_invitations WHERE id=$1",
          [first.id],
        )
      ).rows[0].status,
      "pending",
    );
    assert.equal(
      (await invites.resolve(r, seller, first.id, "accept")).status,
      "accepted",
    );
    assert.equal(
      (await invites.resolve(r, seller, first.id, "accept")).status,
      "accepted",
    );
    assert.equal(
      (
        await db.query(
          "SELECT count(*)::int AS n FROM troc.audit_events WHERE entity_id=$1",
          [first.id],
        )
      ).rows[0].n,
      2,
    );
    await service.member(p, seller, { userId: recipient, role: null });
    await invites.resolve(r, seller, first.id, "accept");
    assert.equal(
      (
        await db.query("SELECT 1 FROM troc.seller_members WHERE user_id=$1", [
          recipient,
        ])
      ).rows.length,
      0,
    );
    const revoked = await invites.create(p, seller, input);
    await assert.rejects(
      () => invites.resolve(r, seller, revoked.id, "revoke"),
      /forbidden/,
    );
    await invites.resolve(p, seller, revoked.id, "revoke");
    assert.equal(
      (await invites.resolve(p, seller, revoked.id, "revoke")).status,
      "revoked",
    );
    await assert.rejects(
      () => invites.resolve(r, seller, revoked.id, "accept"),
      /invitation_resolved/,
    );
    const declined = await invites.create(p, seller, input);
    assert.equal(
      (await invites.resolve(r, seller, declined.id, "decline")).status,
      "declined",
    );
    assert.equal(
      (await invites.resolve(r, seller, declined.id, "decline")).status,
      "declined",
    );
    const expired = await invites.create(p, seller, input);
    await db.query(
      "UPDATE troc.seller_team_invitations SET created_at=now()-interval '9 days',expires_at=now()-interval '2 days' WHERE id=$1",
      [expired.id],
    );
    assert.equal(
      (await invites.resolve(r, seller, expired.id, "accept")).status,
      "expired",
    );
    const oldPending = await invites.create(p, seller, input);
    await db.query(
      "UPDATE troc.seller_team_invitations SET created_at=now()-interval '9 days',expires_at=now()-interval '2 days' WHERE id=$1",
      [oldPending.id],
    );
    const stale = await invites.create(p, seller, input);
    assert.notEqual(stale.id, oldPending.id);
    assert.equal(
      (
        await db.query(
          "SELECT status FROM troc.seller_team_invitations WHERE id=$1",
          [oldPending.id],
        )
      ).rows[0].status,
      "expired",
    );
    await db.query(
      "UPDATE troc.seller_members SET role='manager' WHERE user_id=$1",
      [owner],
    );
    await assert.rejects(
      () => invites.resolve(r, seller, stale.id, "accept"),
      /forbidden/,
    );
    await db.query(
      "UPDATE troc.seller_members SET role='owner' WHERE user_id=$1",
      [owner],
    );
    await db.query("UPDATE troc.users SET status='suspended' WHERE id=$1", [
      recipient,
    ]);
    await assert.rejects(
      () => invites.resolve(r, seller, stale.id, "accept"),
      /unauthorized/,
    );
    await db.query("UPDATE troc.users SET status='active' WHERE id=$1", [
      recipient,
    ]);
    await service.member(p, seller, { userId: recipient, role: "manager" });
    await assert.rejects(
      () => invites.resolve(r, seller, stale.id, "accept"),
      /already_member/,
    );
    assert.equal(
      (
        await db.query(
          "SELECT role FROM troc.seller_members WHERE user_id=$1",
          [recipient],
        )
      ).rows[0].role,
      "manager",
    );

    await db.query(
      "INSERT INTO troc.seller_team_invitations(seller_id,recipient_user_id,invited_by,role,status,resolved_at,created_at,expires_at) SELECT $1,$2,$3,'inventory','declined',now(),'2026-01-01'::timestamptz+(g%3)*interval '1 microsecond','2026-01-08'::timestamptz FROM generate_series(1,61)g",
      [seller, recipient, owner],
    );
    const ids: string[] = [];
    let cursor: string | null = null;
    let firstCursor: string | null = null;
    do {
      const page = await invites.list(r, null, cursor ? { cursor } : {});
      assert.ok(page.invitations.length <= 25);
      for (const row of page.invitations) {
        assert.equal(row.recipientId, recipient);
        assert.equal(row.invitedBy, owner);
        ids.push(row.id);
      }
      cursor = page.nextCursor;
      firstCursor ??= cursor;
    } while (cursor);
    const expected = (
      await db.query<{ id: string }>(
        "SELECT id FROM troc.seller_team_invitations WHERE recipient_user_id=$1 ORDER BY created_at DESC,id DESC",
        [recipient],
      )
    ).rows.map((row) => row.id);
    assert.deepEqual(ids, expected);
    assert.equal(new Set(ids).size, ids.length);
    assert.ok(firstCursor);
    await assert.rejects(
      () => invites.list(x, null, { cursor: firstCursor }),
      /invalid_cursor/,
    );
    await assert.rejects(
      () => invites.list(p, seller, { cursor: firstCursor }),
      /invalid_cursor/,
    );
    await assert.rejects(
      () => invites.list(p, seller, { cursor: "broken" }),
      /invalid_cursor/,
    );
    await assert.rejects(
      () => invites.list(p, seller, { limit: "500" }),
      /invalid_input/,
    );
    await assert.rejects(() => invites.list(x, seller, {}), /forbidden/);
    assert.equal((await invites.list(x, null, {})).invitations.length, 0);
    assert.equal((await invites.list(p, seller, {})).invitations.length, 25);
    const require = createRequire(
      new URL("../artifacts/api-server/package.json", import.meta.url),
    );
    const express: typeof import("express") = require("express");
    const app = express();
    let actor = p;
    app.use(express.json());
    app.use(sellerPlatformRouter(sql, store, async () => actor));
    app.use(
      (error: unknown, _req: Request, res: Response, _next: NextFunction) =>
        res
          .status(error instanceof DomainError ? error.status : 500)
          .json({ code: error instanceof Error ? error.message : "error" }),
    );
    const server = app.listen(0, "127.0.0.1");
    await new Promise<void>((resolve) => server.once("listening", resolve));
    try {
      const address = server.address();
      assert.ok(address && typeof address !== "string");
      const root = "http://127.0.0.1:" + address.port;
      const url = root + "/seller/platform/" + seller + "/invitations";
      const send = (path: string, body: unknown = {}) =>
        fetch(path, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(body),
        });
      let response = await fetch(url);
      assert.equal(response.status, 200);
      assert.equal(response.headers.get("cache-control"), "no-store");
      assert.equal((await response.json()).invitations.length, 25);
      response = await send(url, {
        email: outsider + "@example.test",
        role: "inventory",
      });
      assert.equal(response.status, 200);
      const fresh = await response.json();
      actor = r;
      assert.equal((await send(url + "/" + fresh.id + "/accept")).status, 404);
      assert.equal((await fetch(url)).status, 403);
      actor = p;
      assert.equal((await send(url + "/" + fresh.id + "/revoke")).status, 200);
      const second = await (
        await send(url, {
          email: outsider + "@example.test",
          role: "inventory",
        })
      ).json();
      actor = x;
      response = await fetch(root + "/seller/invitations");
      assert.equal(response.status, 200);
      assert.equal((await response.json()).invitations.length, 2);
      response = await send(url + "/" + second.id + "/accept");
      assert.equal(response.status, 200);
      assert.equal((await response.json()).status, "accepted");
      assert.equal((await send(url + "/bad/accept")).status, 400);
    } finally {
      await new Promise<void>((resolve, reject) =>
        server.close((error) => (error ? reject(error) : resolve())),
      );
    }

    await db.query(
      "INSERT INTO troc.user_roles(user_id,role) VALUES($1,'admin')",
      [outsider],
    );
    await db.query("UPDATE troc.users SET status='suspended' WHERE id=$1", [
      owner,
    ]);
    await assert.rejects(
      () => service.member(p, seller, { userId: recipient, role: "owner" }),
      /unauthorized/,
    );
    await service.member(x, seller, { userId: recipient, role: "owner" });
    // Removing an inactive former owner must not be mistaken for removing the sole active owner.
    await service.member(r, seller, { userId: owner, role: null });
    await assert.rejects(
      () => service.member(r, seller, { userId: recipient, role: null }),
      /last_owner/,
    );
    assert.equal(
      (
        await db.query(
          "SELECT count(*)::int AS n FROM troc.seller_members m JOIN troc.users u ON u.id=m.user_id WHERE m.seller_id=$1 AND m.role='owner' AND u.status='active'",
          [seller],
        )
      ).rows[0].n,
      1,
    );
  } finally {
    await db.close();
  }
});
