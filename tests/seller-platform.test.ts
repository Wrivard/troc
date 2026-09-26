import { test } from "node:test";
import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import { readFile, readdir } from "node:fs/promises";
import { PGlite } from "@electric-sql/pglite";
import { pg_trgm } from "@electric-sql/pglite/contrib/pg_trgm";
import { SellerPlatformService } from "../artifacts/api-server/src/modules/seller-platform/service";
import { StoreEnquiries } from "../artifacts/api-server/src/modules/seller-platform/enquiries";
import { application } from "../artifacts/api-server/src/modules/seller-platform/domain";
import type { Sql } from "../artifacts/api-server/src/modules/commerce/data";
import type { Principal } from "../artifacts/api-server/src/modules/auth/permissions";
const input = {
  contactName: "Seller",
  country: "CA",
  province: "QC",
  sellerType: "individual",
  adultConfirmed: true,
  displayName: "My store",
  games: ["Pokemon"],
  inventorySize: 200,
};
test("application reuses validation, bounds and rejects unsafe URLs", () => {
  assert.equal(application(input).profile.inventorySize, 200);
  assert.equal(
    application({ ...input, displayName: undefined }).profile.displayName,
    "Seller",
  );
  for (const bad of [
    { adultConfirmed: false },
    { country: "US" },
    { inventorySize: -1 },
    { channels: ["javascript:alert(1)"] },
    { games: Array(16).fill("game") },
  ])
    assert.throws(() => application({ ...input, ...bad }));
});
test("seller platform database authorization and transitions", async (t) => {
  const db = new PGlite({ extensions: { pg_trgm } });
  try {
    const dir = new URL("../lib/db/migrations/", import.meta.url);
    for (const file of (await readdir(dir))
      .filter((f) => f.endsWith(".sql"))
      .sort())
      await db.exec(await readFile(new URL(file, dir), "utf8"));
    const ids = Array.from({ length: 6 }, () => randomUUID()),
      [owner, admin, staff, other, support, inactive] = ids;
    for (const [i, id] of ids.entries())
      await db.query("INSERT INTO troc.users(id,email) VALUES($1,$2)", [
        id,
        `user${i}@example.test`,
      ]);
    await db.query(
      "INSERT INTO troc.user_roles(user_id,role) VALUES($1,'admin'),($2,'support')",
      [admin, support],
    );
    await db.query("UPDATE troc.users SET status='suspended' WHERE id=$1", [
      inactive,
    ]);
    const p = (id: string): Principal => ({
      userId: id,
      roles: ["admin"],
      memberships: [],
    }); // forged/stale principal claims never authorize writes
    const store = {
      transaction: <T>(work: (sql: Sql) => Promise<T>) =>
        db.transaction(async (tx) => {
          await tx.exec("SET LOCAL ROLE troc_backend");
          return work(tx as Sql);
        }),
    };
    const service = new SellerPlatformService(db as Sql, store);
    await t.test(
      "legacy applications can be approved without a profile display name",
      async () => {
        const legacy = await service.submit(p(other), input);
        await db.query(
          "UPDATE troc.seller_applications SET profile='{}' WHERE id=$1",
          [legacy.id],
        );
        const result = await service.review(p(admin), String(legacy.id), {
          decision: "approved",
          note: "Legacy review",
        });
        const row = (
          await db.query(
            "SELECT display_name FROM troc.seller_accounts WHERE id=$1",
            [result.sellerId],
          )
        ).rows[0];
        assert.equal(row.display_name, input.contactName);
        // Keep subsequent isolation assertions independent of this fixture.
        await db.query("DELETE FROM troc.seller_applications WHERE id=$1", [
          legacy.id,
        ]);
      },
    );
    const app = await service.submit(p(owner), input);
    await t.test("duplicates and applicant isolation", async () => {
      await assert.rejects(
        () => service.submit(p(owner), input),
        /application_exists/,
      );
      assert.equal((await service.applications(p(other))).length, 0);
      await assert.rejects(
        () => service.applications(p(support), true),
        /forbidden/,
      );
      await assert.rejects(
        () => service.submit(p(inactive), input),
        /unauthorized/,
      );
    });
    await t.test(
      "manual approval requires real admin and is atomic/idempotent conflict",
      async () => {
        for (const id of [owner, staff, support])
          await assert.rejects(
            () =>
              service.review(p(id), String(app.id), {
                decision: "approved",
                note: "reviewed",
              }),
            /forbidden/,
          );
      },
    );
    const approved = await service.review(p(admin), String(app.id), {
        decision: "approved",
        note: "Reviewed application",
      }),
      seller = approved.sellerId!;
    await t.test(
      "promotion drafts are scoped, retry-safe, versioned and cannot alter checkout",
      async () => {
        const initial = await service.promotionDrafts(p(owner), seller);
        const draft = {
          id: randomUUID(),
          name: "Collector weekend",
          percent: 10,
          minimum: 3,
          coupon: "CARDS10",
          start: "2026-09-25",
          end: "2026-09-27",
        };
        const write = {
          key: randomUUID(),
          version: initial.version,
          drafts: [draft],
        };
        await assert.rejects(
          service.savePromotionDrafts(p(other), seller, write),
          /forbidden/,
        );
        for (const bad of [
          { ...write, drafts: [{ ...draft, start: "2026-02-30" }] },
          { ...write, drafts: [draft, draft] },
          { ...write, activate: true },
          { ...write, drafts: [{ ...draft, percent: 101 }] },
        ])
          await assert.rejects(
            service.savePromotionDrafts(p(owner), seller, bad),
            /invalid_input/,
          );
        const before = await db.query(
          "SELECT promotions FROM troc.seller_settings WHERE seller_id=$1",
          [seller],
        );
        const saved = await service.savePromotionDrafts(
          p(owner),
          seller,
          write,
        );
        assert.deepEqual(
          await service.savePromotionDrafts(p(owner), seller, write),
          saved,
        );
        await assert.rejects(
          service.savePromotionDrafts(p(owner), seller, {
            ...write,
            drafts: [],
          }),
          /idempotency_conflict/,
        );
        await assert.rejects(
          service.savePromotionDrafts(p(owner), seller, {
            ...write,
            key: randomUUID(),
          }),
          /settings_changed/,
        );
        assert.deepEqual(
          (
            await db.query(
              "SELECT promotions FROM troc.seller_settings WHERE seller_id=$1",
              [seller],
            )
          ).rows,
          before.rows,
        );
        const cleared = await service.savePromotionDrafts(p(owner), seller, {
          key: randomUUID(),
          version: saved.version,
          drafts: [],
        });
        assert.equal(cleared.drafts.length, 0);
        assert.equal(cleared.version, saved.version + 1);
      },
    );
    await t.test(
      "storefront descriptions enforce owner scope, strict inputs and version conflict",
      async () => {
        const initial = await service.storefront(p(owner), seller);
        const write = {
          version: initial.version,
          storyEn: " Cards from Canada ",
          storyFr: " Cartes du Canada ",
        };
        await assert.rejects(
          service.saveStorefront(p(other), seller, write),
          /forbidden/,
        );
        await assert.rejects(
          service.saveStorefront(p(owner), seller, {
            ...write,
            bannerUrl: "https://example.test/x",
          }),
          /invalid_input/,
        );
        const saved = await service.saveStorefront(p(owner), seller, write);
        assert.equal(saved.storyEn, "Cards from Canada");
        assert.equal(
          (await service.storefront(p(owner), seller)).storyFr,
          "Cartes du Canada",
        );
        await assert.rejects(
          service.saveStorefront(p(owner), seller, write),
          /settings_changed/,
        );
        await assert.rejects(
          store.transaction((db) =>
            db.query(
              "UPDATE troc.seller_public_profiles SET banner_url='x' WHERE seller_id=$1",
              [seller],
            ),
          ),
          /permission denied/,
        );
        assert.equal(
          (
            await db.query(
              "SELECT count(*)::int AS n FROM troc.audit_events WHERE action='seller.storefront.description.updated' AND entity_id=$1",
              [seller],
            )
          ).rows[0].n,
          1,
        );
      },
    );
    await t.test(
      "settings preserve optimistic concurrency and owner isolation",
      async () => {
        const current = await service.settings(p(owner), seller);
        const write = {
          displayName: " Updated store ",
          version: current.version,
          minimumOrderCents: 500,
          handlingDays: 3,
        };
        await assert.rejects(
          service.saveSettings(p(other), seller, write),
          /forbidden/,
        );
        await service.saveSettings(p(owner), seller, write);
        const saved = await service.settings(p(owner), seller);
        assert.equal(saved.display_name, "Updated store");
        assert.equal(saved.minimum_order_cents, 500);
        assert.equal(saved.handling_days, 3);
        await assert.rejects(
          service.saveSettings(p(owner), seller, write),
          /settings_changed/,
        );
      },
    );
    await t.test("free shipping settings preserve levels, omission, exact cents and conflicts",async()=>{
      const current=await service.settings(p(owner),seller);
      const write={displayName:"Shipping test",version:current.version,minimumOrderCents:500,handlingDays:3,freeShippingCents:1250};
      await assert.rejects(()=>service.saveSettings(p(owner),seller,write),/free_shipping_level_required/);
      await db.query("UPDATE troc.seller_accounts SET level_id='established' WHERE id=$1",[seller]);
      await service.saveSettings(p(owner),seller,write);
      let saved=await service.settings(p(owner),seller);assert.equal(saved.free_shipping_threshold_cents,1250);assert.equal(saved.canSetFreeShipping,true);
      await assert.rejects(()=>service.saveSettings(p(owner),seller,write),/settings_changed/);
      for(const amount of [-1,1.25,100000001]) await assert.rejects(()=>service.saveSettings(p(owner),seller,{...write,version:saved.version,freeShippingCents:amount}),/invalid_input/);
      await service.saveSettings(p(owner),seller,{displayName:"Preserve shipping",version:saved.version,minimumOrderCents:500,handlingDays:3});
      saved=await service.settings(p(owner),seller);assert.equal(saved.free_shipping_threshold_cents,1250);
      await service.saveSettings(p(owner),seller,{...write,version:saved.version,freeShippingCents:0});saved=await service.settings(p(owner),seller);assert.equal(saved.free_shipping_threshold_cents,0);
      await db.query("UPDATE troc.seller_accounts SET level_id='new' WHERE id=$1",[seller]);
      await service.saveSettings(p(owner),seller,{...write,version:saved.version,freeShippingCents:null});saved=await service.settings(p(owner),seller);assert.equal(saved.free_shipping_threshold_cents,null);assert.equal(saved.canSetFreeShipping,false);
    });
    await t.test(
      "enquiry normalization, retries and tenant isolation survive shared validation",
      async () => {
        const enquiries = new StoreEnquiries(db as Sql, store, service);
        const request = {
          key: randomUUID(),
          subject: " Stock question ",
          body: " Is this available? ",
        };
        const created = await enquiries.create(p(other), seller, request);
        assert.deepEqual(
          await enquiries.create(p(other), seller, request),
          created,
        );
        await assert.rejects(
          enquiries.create(p(other), seller, { ...request, body: "Different" }),
          /idempotency_conflict/,
        );
        await assert.rejects(
          enquiries.read(p(staff), seller, created.id),
          /forbidden/,
        );
        const reply = { key: randomUUID(), body: " Yes, available. " };
        await enquiries.reply(p(owner), seller, created.id, reply);
        await enquiries.reply(p(owner), seller, created.id, reply);
        await assert.rejects(
          enquiries.reply(p(owner), seller, created.id, {
            ...reply,
            body: "Changed",
          }),
          /idempotency_conflict/,
        );
        const thread = await enquiries.read(p(other), seller, created.id);
        assert.equal(thread.subject, "Stock question");
        assert.deepEqual(
          thread.messages.map((m) => m.body),
          ["Is this available?", "Yes, available."],
        );
      },
    );
    await t.test(
      "enquiry access uses current database role rather than stale principal claims",
      async () => {
        const enquiries = new StoreEnquiries(db as Sql, store, service);
        const thread = await enquiries.create(p(other), seller, {
          key: randomUUID(),
          subject: "Role check",
          body: "Availability?",
        });
        await service.member(p(owner), seller, {
          userId: staff,
          role: "inventory",
        });
        try {
          for (const operation of [
            () => enquiries.list(p(staff), seller),
            () => enquiries.read(p(staff), seller, thread.id),
            () => enquiries.markRead(p(staff), seller, thread.id),
            () =>
              enquiries.reply(p(staff), seller, thread.id, {
                key: randomUUID(),
                body: "Not authorized",
              }),
          ])
            await assert.rejects(operation, /forbidden/);
          await service.member(p(owner), seller, {
            userId: staff,
            role: "customer_service",
          });
          const staleLow: Principal = {
            userId: staff,
            roles: [],
            memberships: [
              { sellerId: seller, role: "inventory", active: true },
            ],
          };
          await enquiries.reply(staleLow, seller, thread.id, {
            key: randomUUID(),
            body: "Current role authorized",
          });
          assert.equal(
            (await enquiries.read(staleLow, seller, thread.id)).messages.length,
            2,
          );
          await service.member(p(owner), seller, {
            userId: staff,
            role: "fulfillment",
          });
          await assert.rejects(
            () => enquiries.read(p(staff), seller, thread.id),
            /forbidden/,
          );
        } finally {
          await service.member(p(owner), seller, { userId: staff, role: null });
        }
      },
    );
    await t.test(
      "message reports require participation, reject forged targets and deduplicate retries",
      async () => {
        const enquiries = new StoreEnquiries(db as Sql, store, service);
        const thread = await enquiries.create(p(other), seller, {
          key: randomUUID(),
          subject: "Report fixture",
          body: "Private fixture",
        });
        const message = (await enquiries.read(p(other), seller, thread.id))
          .messages[0];
        const input = {
          key: randomUUID(),
          messageId: message.id,
          reason: "spam",
          details: "Private report note",
        };
        const report = await enquiries.report(
          p(owner),
          seller,
          thread.id,
          input,
        );
        assert.equal(report.status, "open");
        await assert.rejects(() => enquiries.reports(p(owner)), /forbidden/);
        await assert.rejects(() => enquiries.reports(p(support)), /forbidden/);
        const review = await enquiries.reports(p(admin));
        assert.equal(review.items.length, 1);
        assert.equal(review.items[0].message_body, "Private fixture");
        assert.equal(review.items[0].details, "Private report note");
        assert.equal(review.nextBefore, null);
        await assert.rejects(
          () => enquiries.reports(p(admin), randomUUID()),
          /invalid_cursor/,
        );

        assert.deepEqual(
          await enquiries.report(p(owner), seller, thread.id, input),
          report,
        );
        assert.deepEqual(
          await enquiries.report(p(owner), seller, thread.id, {
            ...input,
            key: randomUUID(),
          }),
          report,
        );
        await assert.rejects(
          () =>
            enquiries.report(p(owner), seller, thread.id, {
              ...input,
              reason: "fraud",
            }),
          /idempotency_conflict/,
        );
        await assert.rejects(
          () => enquiries.report(p(other), seller, thread.id, input),
          /cannot_report_own_message/,
        );
        await assert.rejects(
          () => enquiries.report(p(staff), seller, thread.id, input),
          /forbidden/,
        );
        await assert.rejects(
          () =>
            enquiries.report(p(owner), seller, thread.id, {
              ...input,
              reporterId: other,
            }),
          /invalid_report/,
        );
        await assert.rejects(
          () =>
            enquiries.report(p(owner), seller, thread.id, {
              ...input,
              details: "x".repeat(1001),
            }),
          /invalid_report/,
        );
        const another = await enquiries.create(p(other), seller, {
          key: randomUUID(),
          subject: "Other",
          body: "Another message",
        });
        const foreign = (await enquiries.read(p(other), seller, another.id))
          .messages[0];
        await assert.rejects(
          () =>
            enquiries.report(p(owner), seller, thread.id, {
              ...input,
              messageId: foreign.id,
            }),
          /not_found/,
        );
        const rows = await db.query(
          "SELECT * FROM troc.store_enquiry_reports WHERE reporter_id=$1 AND message_id=$2",
          [owner, message.id],
        );
        assert.equal(rows.rows.length, 1);
        const audits = await db.query(
          "SELECT metadata FROM troc.audit_events WHERE action='enquiry.reported' AND entity_id=$1",
          [report.id],
        );
        assert.equal(audits.rows.length, 1);
        assert.ok(!JSON.stringify(audits.rows).includes("Private report note"));
        const decision = {
          key: randomUUID(),
          decision: "dismissed",
          note: "Private moderator rationale",
        };
        await assert.rejects(
          () => enquiries.reviewReport(p(owner), report.id, decision),
          /forbidden/,
        );
        await assert.rejects(
          () => enquiries.reviewReport(p(support), report.id, decision),
          /forbidden/,
        );
        for (const invalid of [
          { ...decision, note: " " },
          { ...decision, note: "x".repeat(1001) },
          { ...decision, decision: "open" },
          { ...decision, reviewedBy: owner },
        ])
          await assert.rejects(
            () => enquiries.reviewReport(p(admin), report.id, invalid),
            /invalid_report_review/,
          );
        await assert.rejects(
          () => enquiries.reviewReport(p(admin), randomUUID(), decision),
          /not_found/,
        );
        const reviewed = await enquiries.reviewReport(
          p(admin),
          report.id,
          decision,
        );
        assert.equal(reviewed.status, "dismissed");
        const secondReport = await enquiries.report(
          p(owner),
          seller,
          another.id,
          {
            key: randomUUID(),
            messageId: foreign.id,
            reason: "other",
            details: "",
          },
        );
        const secondDecision = {
          key: randomUUID(),
          decision: "resolved",
          note: "Reviewed; no account or order action taken.",
        };
        assert.equal(
          (
            await enquiries.reviewReport(
              p(admin),
              secondReport.id,
              secondDecision,
            )
          ).status,
          "resolved",
        );
        const participantResult = await enquiries.report(
          p(owner),
          seller,
          another.id,
          {
            key: randomUUID(),
            messageId: foreign.id,
            reason: "other",
            details: "",
          },
        );
        assert.deepEqual(Object.keys(participantResult).sort(), [
          "id",
          "status",
        ]);
        assert.equal(participantResult.status, "resolved");

        assert.deepEqual(
          await enquiries.reviewReport(p(admin), report.id, decision),
          reviewed,
        );
        await assert.rejects(
          () =>
            enquiries.reviewReport(p(admin), report.id, {
              ...decision,
              key: randomUUID(),
            }),
          /report_already_reviewed/,
        );
        await assert.rejects(
          () =>
            enquiries.reviewReport(p(admin), report.id, {
              ...decision,
              decision: "resolved",
            }),
          /report_already_reviewed/,
        );
        const saved = (await enquiries.reports(p(admin))).items.find(
          (x) => x.id === report.id,
        );
        assert.equal(saved?.review_note, decision.note);
        assert.equal(saved?.reviewed_by, admin);
        const reviewAudits = await db.query(
          "SELECT metadata FROM troc.audit_events WHERE action='enquiry.report_reviewed' AND entity_id=$1",
          [report.id],
        );
        assert.equal(reviewAudits.rows.length, 1);
        assert.ok(!JSON.stringify(reviewAudits.rows).includes(decision.note));
        await assert.rejects(
          () =>
            store.transaction((sql) =>
              sql.query(
                "UPDATE troc.store_enquiry_reports SET details='tampered' WHERE id=$1",
                [report.id],
              ),
            ),
          /permission denied/,
        );

        await assert.rejects(
          () =>
            store.transaction((sql) =>
              sql.query("DELETE FROM troc.store_enquiry_reports WHERE id=$1", [
                report.id,
              ]),
            ),
          /permission denied/,
        );
      },
    );
    await t.test(
      "pre-sale blocking is owner scoped, versioned and preserves evidence and confirmed retries",
      async () => {
        const enquiries = new StoreEnquiries(db as Sql, store, service);
        const original = {
          key: randomUUID(),
          subject: "Block fixture",
          body: "Existing enquiry",
        };
        const thread = await enquiries.create(p(other), seller, original);
        const otherThread = await enquiries.create(p(other), seller, {
          key: randomUUID(),
          subject: "Same pair",
          body: "Second conversation",
        });
        const reply = { key: randomUUID(), body: "Existing seller reply" };
        await enquiries.reply(p(owner), seller, thread.id, reply);
        const read = await enquiries.read(p(owner), seller, thread.id);
        assert.deepEqual(read.contactControl, {
          blocked: false,
          version: 0,
          canManageBlock: true,
        });
        const command = { key: randomUUID(), blocked: true, version: 0 };
        await service.member(p(owner), seller, {
          userId: staff,
          role: "customer_service",
        });
        try {
          for (const actor of [other, staff, support, inactive])
            await assert.rejects(() =>
              enquiries.setBlocked(p(actor), seller, thread.id, command),
            );
          await assert.rejects(
            () =>
              enquiries.setBlocked(p(owner), seller, thread.id, {
                ...command,
                buyerId: admin,
              }),
            /invalid_enquiry_block/,
          );
          await assert.rejects(
            () =>
              enquiries.setBlocked(p(owner), seller, thread.id, {
                ...command,
                blocked: "true",
              }),
            /invalid_enquiry_block/,
          );
          await assert.rejects(
            () => enquiries.setBlocked(p(owner), seller, randomUUID(), command),
            /not_found/,
          );
          const blocked = await enquiries.setBlocked(
            p(owner),
            seller,
            thread.id,
            command,
          );
          assert.deepEqual(blocked, { blocked: true, version: 1 });
          assert.deepEqual(
            await enquiries.setBlocked(p(owner), seller, thread.id, command),
            blocked,
          );
          await assert.rejects(
            () =>
              enquiries.setBlocked(p(owner), seller, thread.id, {
                ...command,
                blocked: false,
              }),
            /idempotency_conflict/,
          );
          await assert.rejects(
            () =>
              enquiries.setBlocked(p(owner), seller, thread.id, {
                ...command,
                key: randomUUID(),
                blocked: false,
              }),
            /version_conflict/,
          );
          assert.deepEqual(await enquiries.create(p(other), seller, original), {
            id: thread.id,
          });
          assert.deepEqual(
            await enquiries.reply(p(owner), seller, thread.id, reply),
            { ok: true },
          );
          for (const actor of [other, owner, staff])
            await assert.rejects(
              () =>
                enquiries.reply(p(actor), seller, otherThread.id, {
                  key: randomUUID(),
                  body: "Must not save",
                }),
              /enquiry_blocked/,
            );
          await assert.rejects(
            () =>
              enquiries.create(p(other), seller, {
                key: randomUUID(),
                subject: "New attempt",
                body: "Must not save",
              }),
            /enquiry_blocked/,
          );
          const history = await enquiries.read(p(other), seller, thread.id);
          assert.equal(history.messages.length, 2);
          assert.deepEqual(history.contactControl, {
            blocked: true,
            version: 1,
            canManageBlock: false,
          });
          await enquiries.markRead(p(other), seller, thread.id);
          const incoming = history.messages.find((x) => x.author === "seller")!;
          assert.equal(
            (
              await enquiries.report(p(other), seller, thread.id, {
                key: randomUUID(),
                messageId: incoming.id,
                reason: "other",
                details: "Still reportable",
              })
            ).status,
            "open",
          );
          // Another buyer is unaffected by this pair's control.
          await enquiries.create(p(support), seller, {
            key: randomUUID(),
            subject: "Different buyer",
            body: "Allowed",
          });
          const audits = await db.query(
            "SELECT metadata FROM troc.audit_events WHERE action='enquiry.contact_control' AND entity_id=$1",
            [seller],
          );
          assert.equal(audits.rows.length, 1);
          const unblock = { key: randomUUID(), blocked: false, version: 1 };
          assert.deepEqual(
            await enquiries.setBlocked(p(admin), seller, thread.id, unblock),
            { blocked: false, version: 2 },
          );
          await assert.rejects(
            () => enquiries.setBlocked(p(owner), seller, thread.id, command),
            /version_conflict/,
          );
          await enquiries.reply(p(other), seller, thread.id, {
            key: randomUUID(),
            body: "Allowed after unblock",
          });
          assert.equal(
            (await enquiries.read(p(other), seller, thread.id)).messages.length,
            3,
          );
          await assert.rejects(
            () =>
              store.transaction((sql) =>
                sql.query(
                  "DELETE FROM troc.store_enquiry_controls WHERE seller_id=$1",
                  [seller],
                ),
              ),
            /permission denied/,
          );
        } finally {
          await service.member(p(owner), seller, { userId: staff, role: null });
        }
      },
    );
    await t.test(
      "enquiry keyset pages preserve tied timestamps without duplicates and reject foreign cursors",
      async () => {
        const enquiries = new StoreEnquiries(db as Sql, store, service);
        const thread = await enquiries.create(p(other), seller, {
          key: randomUUID(),
          subject: "Long history",
          body: "First",
        });
        await db.query(
          "INSERT INTO troc.store_enquiry_messages(enquiry_id,actor_id,author,body,request_key,created_at) SELECT $1,$2,'buyer','Message '||n,gen_random_uuid(),'2026-09-24T00:00:00Z'::timestamptz FROM generate_series(1,205) n",
          [thread.id, other],
        );
        const expected = (
          await db.query<{ id: string }>(
            "SELECT id FROM troc.store_enquiry_messages WHERE enquiry_id=$1 ORDER BY created_at,id",
            [thread.id],
          )
        ).rows.map((r) => r.id);
        const pages: string[][] = [];
        let before: string | undefined;
        do {
          const page = await enquiries.read(
            p(owner),
            seller,
            thread.id,
            before,
          );
          assert.ok(page.messages.length <= 100);
          pages.unshift(page.messages.map((m) => String(m.id)));
          before = page.nextBefore ? String(page.nextBefore) : undefined;
        } while (before);
        assert.deepEqual(pages.flat(), expected);
        assert.equal(new Set(pages.flat()).size, 206);
        const foreign = await enquiries.create(p(other), seller, {
          key: randomUUID(),
          subject: "Other thread",
          body: "Other",
        });
        const foreignMessage = (
          await enquiries.read(p(other), seller, foreign.id)
        ).messages[0].id;
        await assert.rejects(
          enquiries.read(p(owner), seller, thread.id, String(foreignMessage)),
          /invalid_cursor/,
        );
        await assert.rejects(
          enquiries.read(p(staff), seller, thread.id, String(expected[0])),
          /forbidden/,
        );
      },
    );
    await t.test(
      "read state is per viewer, repeatable and cannot hide future incoming messages",
      async () => {
        const enquiries = new StoreEnquiries(db as Sql, store, service);
        const thread = await enquiries.create(p(other), seller, {
          key: randomUUID(),
          subject: "Unread test",
          body: "First unread",
        });
        const count = async () =>
          Number(
            (await enquiries.list(p(owner), seller)).find(
              (r) => r.id === thread.id,
            )?.unread_count,
          );
        assert.equal(await count(), 1);
        await assert.rejects(
          enquiries.markRead(p(staff), seller, thread.id),
          /forbidden/,
        );
        await enquiries.markRead(p(other), seller, thread.id);
        assert.equal(await count(), 1);
        await enquiries.markRead(p(owner), seller, thread.id);
        await enquiries.markRead(p(owner), seller, thread.id);
        assert.equal(await count(), 0);
        await enquiries.reply(p(other), seller, thread.id, {
          key: randomUUID(),
          body: "New incoming",
        });
        assert.equal(await count(), 1);
        await enquiries.reply(p(owner), seller, thread.id, {
          key: randomUUID(),
          body: "Own reply",
        });
        assert.equal(await count(), 1);
        assert.equal(
          (
            await db.query(
              "SELECT * FROM troc.store_enquiry_reads WHERE user_id=$1",
              [staff],
            )
          ).rows.length,
          0,
        );
      },
    );
    await t.test(
      "enquiry list pages expose every thread with deterministic cursors",
      async () => {
        const enquiries = new StoreEnquiries(db as Sql, store, service);
        await db.query(
          "INSERT INTO troc.store_enquiries(seller_id,buyer_id,subject,request_key,created_at) SELECT $1,$2,'Paged enquiry '||n,gen_random_uuid(),'2026-09-24T00:00:00Z'::timestamptz FROM generate_series(1,105) n",
          [seller, other],
        );
        const expected = (
          await db.query<{ id: string }>(
            "SELECT id FROM troc.store_enquiries WHERE seller_id=$1 ORDER BY created_at DESC,id DESC",
            [seller],
          )
        ).rows.map((r) => r.id);
        const actual: string[] = [];
        let before: string | undefined;
        do {
          const page = await enquiries.listPage(p(owner), seller, before);
          assert.ok(page.items.length <= 50);
          actual.push(...page.items.map((r) => String(r.id)));
          before = page.nextBefore ? String(page.nextBefore) : undefined;
        } while (before);
        assert.deepEqual(actual, expected);
        await assert.rejects(
          enquiries.listPage(p(owner), seller, randomUUID()),
          /invalid_cursor/,
        );
        await assert.rejects(enquiries.listPage(p(staff), seller), /forbidden/);
      },
    );
    await t.test(
      "approval creates free/new unverified account, no rewards; retries cannot duplicate",
      async () => {
        await assert.rejects(
          () =>
            service.review(p(admin), String(app.id), {
              decision: "approved",
              note: "again",
            }),
          /already_reviewed/,
        );
        const row = (
          await db.query("SELECT * FROM troc.seller_accounts WHERE id=$1", [
            seller,
          ])
        ).rows[0];
        assert.equal(row.plan_id, "free");
        assert.equal(row.level_id, "new");
        assert.equal(row.pro_lifetime, false);
        assert.equal(row.founding_number, null);
        assert.equal(
          (
            await db.query(
              "SELECT * FROM troc.seller_badge_assignments WHERE seller_id=$1",
              [seller],
            )
          ).rows.length,
          0,
        );
        assert.equal(
          (
            await db.query(
              "SELECT kyc_status FROM troc.seller_verification_status WHERE seller_id=$1",
              [seller],
            )
          ).rows[0].kyc_status,
          "not_started",
        );
        await assert.rejects(
          () => service.submit(p(owner), input),
          /application_exists/,
        );
      },
    );
    await t.test(
      "owner/admin team administration and last-owner protection",
      async () => {
        for (const invalid of [
          { userId: staff, email: "extra@example.test", role: "manager" },
          { userId: staff, role: "manager", isAdmin: true },
          { email: "bad@", role: "manager" },
          { role: "manager" },
        ]) {
          await assert.rejects(
            () => service.member(p(owner), seller, invalid),
            /invalid_member/,
          );
        }
        await assert.rejects(
          () => service.member(p(owner), seller, { userId: owner, role: null }),
          /last_owner/,
        );
        await service.member(p(owner), seller, {
          userId: staff,
          role: "manager",
        });
        await assert.rejects(
          () =>
            service.member(p(staff), seller, { userId: staff, role: "owner" }),
          /forbidden/,
        );
        await service.member(p(admin), seller, {
          userId: admin,
          role: "owner",
        });
        await service.member(p(admin), seller, { userId: admin, role: null });
        assert.equal(
          (await service.access(db as Sql, p(admin), seller, true)).role,
          "admin",
        );
        assert.ok(
          (await service.sellers(p(admin))).some((row) => row.id === seller),
        );
        await assert.rejects(
          () =>
            service.member(p(owner), seller, {
              userId: inactive,
              role: "owner",
            }),
          /member_unavailable/,
        );
        await assert.rejects(
          () =>
            service.member(p(owner), seller, { userId: staff, role: "admin" }),
          /invalid_role/,
        );
        await service.member(p(owner), seller, {
          userId: other,
          role: "owner",
        });
        await service.member(p(other), seller, {
          userId: owner,
          role: "inventory",
        });
        await assert.rejects(
          () =>
            service.member(p(owner), seller, { userId: owner, role: "owner" }),
          /forbidden/,
        );
        await assert.rejects(
          () =>
            service.member(p(other), seller, {
              userId: other,
              role: "manager",
            }),
          /last_owner/,
        );
        await service.member(p(other), seller, { userId: staff, role: null });
        await assert.rejects(
          () => service.dashboard(p(staff), seller),
          /forbidden/,
        );
        await assert.rejects(
          () => service.dashboard(p(other), randomUUID()),
          /forbidden/,
        );
      },
    );
    await t.test("empty dashboard is truthful and scoped", async () => {
      const result = await service.dashboard(p(other), seller);
      assert.equal(result.sales.completed_orders, 0);
      assert.equal(result.sales.merchandise_cents, "0");
      assert.equal(result.inventory.active_listings, 0);
      assert.equal(result.analyticsAvailable, false);
    });
    await t.test(
      "sales totals exclude simulation, demo, refunds and other sellers",
      async () => {
        const demo = String(
          (
            await db.query(
              "SELECT id FROM troc.demo_batches WHERE seed_key='commerce-simulation'",
            )
          ).rows[0].id,
        );
        const secondSeller = randomUUID();
        await db.query(
          "INSERT INTO troc.seller_accounts(id,slug,display_name,seller_type,status) VALUES($1,$2,'Other','individual','active')",
          [secondSeller, "other-" + secondSeller],
        );
        for (const [payment, batch, refunded, sellerId, state] of [
          ["provider_test_1", null, 0, seller, "completed"],
          ["sim_test", null, 0, seller, "completed"],
          ["provider_test_2", demo, 0, seller, "completed"],
          ["provider_test_3", null, 100, seller, "completed"],
          ["provider_test_4", null, 0, secondSeller, "completed"],
          ["provider_test_5", null, 0, seller, "cancelled"],
        ]) {
          const order = randomUUID();
          await db.query(
            "INSERT INTO troc.marketplace_orders(id,buyer_id,status,total_cents,idempotency_key,payment_id,demo_batch_id) VALUES($1::uuid,$2,'completed',1000,$1::text,$3,$4)",
            [order, staff, payment, batch],
          );
          await db.query(
            "INSERT INTO troc.seller_orders(marketplace_order_id,seller_id,merchandise_cents,discount_cents,shipping_cents,status,refunded_cents) VALUES($1,$2,1000,100,200,$3,$4)",
            [order, sellerId, state, refunded],
          );
        }
        const result = await service.dashboard(p(other), seller);
        assert.equal(result.sales.completed_orders, 1);
        assert.equal(result.sales.merchandise_cents, "900");
      },
    );
    await t.test(
      "review audit includes transitions and rejects self-review",
      async () => {
        const self = await service.submit(p(admin), input);
        await assert.rejects(
          () =>
            service.review(p(admin), String(self.id), {
              decision: "approved",
              note: "self",
            }),
          /self_approval/,
        );
        const second = await service.submit(p(staff), input);
        await service.review(p(admin), String(second.id), {
          decision: "rejected",
          note: "Missing information",
        });
        await service.submit(p(staff), input);
        const audits = (
          await db.query(
            "SELECT metadata FROM troc.audit_events WHERE entity_id=$1 AND action='seller.application.approved'",
            [app.id],
          )
        ).rows;
        assert.equal(audits.length, 1);
        assert.equal(
          (audits[0].metadata as { previousStatus: string }).previousStatus,
          "submitted",
        );
        await assert.rejects(
          () =>
            db.query("DELETE FROM troc.audit_events WHERE entity_id=$1", [
              app.id,
            ]),
          /Append-only/,
        );
      },
    );
  } finally {
    await db.close();
  }
});
