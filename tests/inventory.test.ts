import { test } from "node:test";
import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import { readFile, readdir, mkdir, writeFile } from "node:fs/promises";
import { PGlite } from "@electric-sql/pglite";
import { pg_trgm } from "@electric-sql/pglite/contrib/pg_trgm";
import { InventoryService } from "../artifacts/api-server/src/modules/inventory/service";
import {
  cents,
  parseCsv,
  mappingFor,
} from "../artifacts/api-server/src/modules/inventory/csv";
import type { Sql } from "../artifacts/api-server/src/modules/commerce/data";
import type { Principal } from "../artifacts/api-server/src/modules/auth/permissions";

test("CSV preserves quoted fields and failures; prices remain integer CAD cents", () => {
  assert.deepEqual(
    parseCsv('\uFEFFname,price\r\n"Card, ""special""",0.05\r\n'),
    [
      ["name", "price"],
      ['Card, "special"', "0.05"],
    ],
  );
  assert.deepEqual(parseCsv('name,price\n"Multi\nline",1'), [
    ["name", "price"],
    ["Multi\nline", "1"],
  ]);
  for (const csv of ["a,a\n1,2", 'a,b\n"unfinished,1', 'a,b\n"x"bad,1'])
    assert.throws(() => parseCsv(csv));
  for (const value of ["0", "-1", "1e2", "1.001", "NaN", "1,000"])
    assert.throws(() => cents(value));
  assert.equal(cents("0.05"), 5);
  assert.equal(cents("19.99"), 1999);
  assert.throws(() => mappingFor(["a", "b"], {}), /mapping_required/);
});
test("inventory authorization, import scale, retries, duplicates, reservations and revisions", async (t) => {
  const db = new PGlite({ extensions: { pg_trgm } });
  const dir = new URL("../lib/db/migrations/", import.meta.url);
  try {
    for (const file of (await readdir(dir))
      .filter((f) => f.endsWith(".sql"))
      .sort())
      await db.exec(await readFile(new URL(file, dir), "utf8"));
    const user = randomUUID(),
      seller = randomUUID(),
      other = randomUUID(),
      game = randomUUID(),
      set = randomUUID(),
      product = randomUUID(),
      printing = randomUUID(),
      variant = randomUUID();
    await db.query(
      "INSERT INTO troc.users(id,email) VALUES($1,'inventory@example.test')",
      [user],
    );
    for (const id of [seller, other])
      await db.query(
        "INSERT INTO troc.seller_accounts(id,slug,display_name,seller_type,status) VALUES($1,$2,'Store','individual','active')",
        [id, "s-" + id],
      );
    await db.query(
      "INSERT INTO troc.seller_members(seller_id,user_id,role) VALUES($1,$2,'owner')",
      [seller, user],
    );
    await db.query(
      "INSERT INTO troc.games(id,slug,name_en,name_fr) VALUES($1,'game','Game','Jeu')",
      [game],
    );
    await db.query(
      "INSERT INTO troc.set_releases(id,game_id,slug,name_en,name_fr) VALUES($1,$2,'set','Set','Série')",
      [set, game],
    );
    await db.query(
      "INSERT INTO troc.catalog_products(id,game_id,set_id,slug,name_en,name_fr,product_type) VALUES($1,$2,$3,'card','Card','Carte','raw_single')",
      [product, game, set],
    );
    await db.query(
      "INSERT INTO troc.printings(id,product_id,language,printing_key,collector_number) VALUES($1,$2,'en','normal','001')",
      [printing, product],
    );
    await db.query(
      "INSERT INTO troc.variants(id,printing_id,variant_key) VALUES($1,$2,'normal')",
      [variant, printing],
    );
    await db.query(
      "INSERT INTO troc.external_catalog_mappings(provider,external_id,variant_id) VALUES('test','external-1',$1)",
      [variant],
    );
    const store = {
      transaction: <T>(work: (db: Sql) => Promise<T>) =>
        db.transaction(async (tx) => {
          await tx.exec("SET LOCAL ROLE troc_backend");
          return work(tx as Sql);
        }),
    };
    const service = new InventoryService(db as Sql, store);
    const p: Principal = {
      userId: user,
      roles: [],
      memberships: [{ sellerId: seller, role: "owner", active: true }],
    };
    const makeCsv = (count: number, prefix: string) =>
      "variant_id,condition,price,quantity,seller_sku\n" +
      Array.from(
        { length: count },
        (_, i) => `${variant},NM,0.25,4,${prefix}-${i}`,
      ).join("\n");
    await t.test("seller scopes and unauthorized staff", async () => {
      await assert.rejects(() => service.list(p, other), /forbidden/);
      await assert.rejects(
        () =>
          service.preview(
            {
              ...p,
              memberships: [
                { sellerId: seller, role: "fulfillment", active: true },
              ],
            },
            seller,
            { csv: makeCsv(1, "denied"), requestKey: randomUUID() },
          ),
        /forbidden/,
      );
    });
    const timings = [];
    for (const count of [100, 1000, 10001])
      await t.test(
        `${count} rows preview and publish without catalog duplication`,
        async () => {
          const started = performance.now(),
            requestKey = randomUUID(),
            input = { csv: makeCsv(count, "scale-" + count), requestKey };
          const preview = await service.preview(p, seller, input);
          assert.equal(preview.summary.matched, count);
          assert.equal(
            (await service.preview(p, seller, input)).id,
            preview.id,
          );
          await assert.rejects(
            () =>
              service.preview(p, seller, {
                ...input,
                csv: makeCsv(count, "changed"),
              }),
            /idempotency_conflict/,
          );
          const previewMs = performance.now() - started;
          assert.equal(
            (await service.publish(p, seller, preview.id)).count,
            count,
          );
          assert.equal(
            (await service.publish(p, seller, preview.id)).count,
            count,
          );
          assert.equal(
            (await db.query("SELECT id FROM troc.catalog_products")).rows
              .length,
            1,
          );
          timings.push({
            count,
            previewMs: Math.round(previewMs),
            totalMs: Math.round(performance.now() - started),
          });
        },
      );
    await t.test(
      "match by external ID and precise card fields; ambiguous and invalid review",
      async () => {
        const external = await service.preview(p, seller, {
          requestKey: randomUUID(),
          csv: "provider,external_catalog_id,condition,price,quantity,seller_sku\ntest,external-1,NM,1,1,external-sku",
        });
        assert.equal(external.summary.matched, 1);
        const meta =
          "name,set,number,language,finish,condition,price,quantity,seller_sku\nCard,set,001,en,normal,NM,1.00,2,meta-sku";
        const exact = await service.preview(p, seller, {
          requestKey: randomUUID(),
          csv: meta,
        });
        assert.equal(exact.summary.matched, 1);
        const alt = randomUUID();
        await db.query(
          "INSERT INTO troc.printings(id,product_id,language,printing_key,collector_number) VALUES($1,$2,'en','alternate','001')",
          [alt, product],
        );
        await db.query(
          "INSERT INTO troc.variants(printing_id,variant_key) VALUES($1,'normal')",
          [alt],
        );
        const ambiguous = await service.preview(p, seller, {
          requestKey: randomUUID(),
          csv: meta,
        });
        assert.equal(ambiguous.summary.ambiguous, 1);
        await assert.rejects(
          () => service.publish(p, seller, ambiguous.id),
          /import_needs_review/,
        );
        const invalid = await service.preview(p, seller, {
          requestKey: randomUUID(),
          csv: makeCsv(1, "bad").replace("0.25", "-1"),
        });
        assert.equal(invalid.summary.invalid, 1);
        const unknown = await service.preview(p, seller, {
          requestKey: randomUUID(),
          csv: makeCsv(1, "unknown").replace(variant, randomUUID()),
        });
        assert.equal(unknown.summary.unmatched, 1);
      },
    );
    await t.test(
      "all duplicate identities reported and publish conflict atomic",
      async () => {
        const input = {
          csv: makeCsv(2, "scale-100"),
          requestKey: randomUUID(),
        };
        const duplicate = await service.preview(p, seller, input);
        assert.equal(duplicate.summary.duplicate, 2);
        const repeat = await service.preview(p, seller, {
          requestKey: randomUUID(),
          csv: makeCsv(2, "repeated").replace("repeated-1", "repeated-0"),
        });
        assert.equal(repeat.summary.duplicate, 2);
        const a = await service.preview(p, seller, {
          requestKey: randomUUID(),
          csv: makeCsv(2, "racing"),
        });
        const b = await service.preview(p, seller, {
          requestKey: randomUUID(),
          csv: makeCsv(2, "racing"),
        });
        await service.publish(p, seller, a.id);
        await assert.rejects(
          () => service.publish(p, seller, b.id),
          /inventory_changed_repreview/,
        );
        await assert.rejects(() => service.review(p, other, a.id), /forbidden/);
      },
    );
    await t.test(
      "photo policy creates drafts and cannot be bypassed with bulk activation",
      async () => {
        const preview = await service.preview(p, seller, {
          requestKey: randomUUID(),
          csv: makeCsv(1, "photo-required").replace("0.25", "50.00"),
        });
        await service.publish(p, seller, preview.id);
        const listing = (
          await db.query<{
            id: string;
            status: string;
            inventory_version: number;
          }>(
            "SELECT id,status,inventory_version FROM troc.listings WHERE seller_id=$1 AND seller_sku='photo-required-0'",
            [seller],
          )
        ).rows[0];
        assert.equal(listing.status, "draft");
        await assert.rejects(
          () =>
            service.bulk(p, seller, [
              {
                id: listing.id,
                version: listing.inventory_version,
                status: "active",
              },
            ]),
          /listing_photos_required/,
        );
      },
    );
    await t.test(
      "pagination, optimistic concurrency, atomic bulk and pending checkout protection",
      async () => {
        const first = await service.list(p, seller);
        assert.equal(first.rows.length, 50);
        assert.ok(first.next);
        const second = await service.list(p, seller, { after: first.next });
        assert.notDeepEqual(first.rows, second.rows);
        const item = first.rows.find((row) => row.unit_price_cents === 25) as {
          id: string;
          inventory_version: number;
        };
        await service.bulk(p, seller, [
          { id: item.id, version: item.inventory_version, quantity: 0 },
        ]);
        await assert.rejects(
          () =>
            service.bulk(p, seller, [
              { id: item.id, version: item.inventory_version, quantity: 10 },
            ]),
          /inventory_changed/,
        );
        const current = (
          await db.query<{ inventory_version: number; status: string }>(
            "SELECT inventory_version,status FROM troc.listings WHERE id=$1",
            [item.id],
          )
        ).rows[0];
        assert.equal(current.status, "sold_out");
        await service.bulk(p, seller, [
          { id: item.id, version: current.inventory_version, quantity: 5 },
        ]);
        await db.query(
          "INSERT INTO troc.inventory_reservations(listing_id,buyer_id,quantity,expires_at,idempotency_key) VALUES($1,$2,1,now()+interval '10 minutes','inventory-test')",
          [item.id, user],
        );
        await assert.rejects(
          () =>
            service.bulk(p, seller, [
              {
                id: item.id,
                version: current.inventory_version + 1,
                quantity: 10,
              },
            ]),
          /inventory_reserved/,
        );
        assert.ok(
          (
            await db.query(
              "SELECT id FROM troc.inventory_outbox WHERE listing_id=$1 AND event='inventory.sold_out'",
              [item.id],
            )
          ).rows.length,
        );
        const secondItem = first.rows.find(
          (row) => row.id !== item.id && row.unit_price_cents === 25,
        ) as { id: string; inventory_version: number; quantity: number };
        await assert.rejects(
          () =>
            service.bulk(p, seller, [
              {
                id: secondItem.id,
                version: secondItem.inventory_version,
                quantity: 90,
              },
              {
                id: "ffffffff-ffff-4fff-8fff-ffffffffffff",
                version: 1,
                quantity: 1,
              },
            ]),
          /not_found/,
        );
        const unchanged = (
          await db.query<{ quantity: number; inventory_version: number }>(
            "SELECT quantity,inventory_version FROM troc.listings WHERE id=$1",
            [secondItem.id],
          )
        ).rows[0];
        assert.equal(unchanged.quantity, secondItem.quantity);
        assert.equal(unchanged.inventory_version, secondItem.inventory_version);
        await assert.rejects(
          () =>
            db.query("DELETE FROM troc.inventory_outbox WHERE listing_id=$1", [
              item.id,
            ]),
          /Append-only/,
        );
      },
    );
    await t.test("private tables inaccessible to browser roles", async () => {
      await db.exec(
        "CREATE ROLE inventory_browser NOLOGIN; SET ROLE inventory_browser",
      );
      try {
        await assert.rejects(
          () => db.query("SELECT * FROM troc.inventory_imports"),
          /permission denied/,
        );
      } finally {
        await db.exec("RESET ROLE");
      }
    });
    await mkdir(new URL("../verification/", import.meta.url), {
      recursive: true,
    });
    await writeFile(
      new URL("../verification/inventory-scale.json", import.meta.url),
      JSON.stringify(
        {
          engine:
            "PGlite PostgreSQL; local timings, not hosted capacity claims",
          timings,
        },
        null,
        2,
      ),
    );
  } finally {
    await db.close();
  }
});
