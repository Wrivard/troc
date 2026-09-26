import express from "express";
import { once } from "node:events";
import { inventoryPhotosRouter } from "../artifacts/api-server/src/routes/inventory-photos";
import { DomainError } from "../artifacts/api-server/src/modules/shared/domain";
import sharp from "sharp";
import { PhotoQuarantineService } from "../artifacts/api-server/src/modules/storage/photo-quarantine";
import {SellerPlatformService} from "../artifacts/api-server/src/modules/seller-platform/service";
import {loadCommerce} from "../artifacts/api-server/src/modules/commerce/data";
import {quoteCart} from "../artifacts/api-server/src/modules/commerce/calculations";
import { inventoryCsv } from "../artifacts/api-server/src/modules/inventory/export";
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
test("inventory export CSV quoting, exact CAD and hard caps", () => {
  const row = {
    id: "id",
    variant_id: "variant",
    unit_price_cents: 125,
    quantity: 2,
    seller_sku: '=HYPERLINK("x")',
    storage_location: "Bo\u00eete, A\n2",
    name_fr: "Carte",
  };
  const csv = parseCsv(inventoryCsv([row]).csv);
  assert.equal(csv[1][3], "1.25");
  assert.equal(csv[1][5], '\'=HYPERLINK("x")');
  assert.equal(csv[1][6], "Bo\u00eete, A\n2");
  assert.equal(
    parseCsv(inventoryCsv([{ ...row, unit_price_cents: 5 }]).csv)[1][3],
    "0.05",
  );
  assert.throws(
    () => inventoryCsv(Array.from({ length: 10001 }, () => row)),
    /export_too_large/,
  );
  assert.throws(
    () => inventoryCsv([{ ...row, name_en: "x".repeat(5 * 1024 * 1024) }]),
    /export_too_large/,
  );
  assert.throws(
    () => inventoryCsv([{ ...row, unit_price_cents: "1.2" }]),
    /invalid_export_price/,
  );
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
    await t.test(
      "manual catalogue lookup preserves exact collector number and variants",
      async () => {
        assert.equal(
          (await service.catalog(p, seller, "1")).some(
            (row) => row.id === variant,
          ),
          true,
        );
        await db.exec("BEGIN");
        try {
          await db.query(
            "UPDATE troc.printings SET collector_number='076/086' WHERE id=$1",
            [printing],
          );
          const foil = randomUUID();
          await db.query(
            "INSERT INTO troc.variants(id,printing_id,variant_key) VALUES($1,$2,'foil')",
            [foil, printing],
          );
          const matches = await service.catalog(p, seller, "#76 / 86");
          assert.deepEqual(
            new Set(matches.map((row) => row.id)),
            new Set([variant, foil]),
          );
          assert.equal((await service.catalog(p, seller, "76/87")).length, 0);
          assert.equal((await service.catalog(p, seller, "Carte")).length, 2);
          assert.equal((await service.catalog(p, seller, "%_")).length, 0);
          const listing = randomUUID();
          await db.query(
            "INSERT INTO troc.listings(id,seller_id,variant_id,condition,unit_price_cents,quantity,status,seller_sku) VALUES($1,$2,$3,'NM',100,1,'active','seller-reference')",
            [listing, seller, variant],
          );
          assert.equal(
            (await service.list(p, seller, { q: "76/86" })).rows[0].id,
            listing,
          );
          assert.equal(
            (await service.list(p, seller, { q: "76/87" })).rows.length,
            0,
          );
          assert.equal(
            (await service.list(p, seller, { q: "seller-reference" })).rows[0]
              .id,
            listing,
          );
        } finally {
          await db.exec("ROLLBACK");
        }
      },
    );
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
        await assert.rejects(() => service.bulk(p,seller,[{id:item.id,version:current.inventory_version+1,saleCents:1}]), /inventory_reserved/);
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
    await t.test(
      "private storage location manual CSV update clear and conflict",
      async () => {
        const requestKey = randomUUID();
        const input = {
          variantId: variant,
          condition: "NM",
          priceCents: 125,
          quantity: 2,
          sellerSku: "location-manual",
          storageLocation: " Box A · 3 ",
          requestKey,
        };
        await service.create(p, seller, input);
        await service.create(p, seller, input);
        let rows = (await service.list(p, seller, { q: "Box A" })).rows;
        assert.equal(rows.length, 1);
        const id = rows[0].id;
        assert.equal(rows[0].storage_location, "Box A · 3");
        const version = rows[0].inventory_version;
        await assert.rejects(
          () =>
            service.bulk(p, other, [{ id, version, storageLocation: "Wrong" }]),
          /forbidden/,
        );
        await assert.rejects(
          () =>
            service.bulk(p, seller, [
              { id, version, storageLocation: "x".repeat(101) },
            ]),
          /invalid_inventory/,
        );
        await service.bulk(p, seller, [
          { id, version, storageLocation: "Shelf B" },
        ]);
        await assert.rejects(
          () =>
            service.bulk(p, seller, [
              { id, version, storageLocation: "Stale" },
            ]),
          /inventory_changed/,
        );
        rows = (await service.list(p, seller, { q: "Shelf B" })).rows;
        assert.equal(rows.length, 1);
        assert.equal(rows[0].quantity, 2);
        assert.equal(rows[0].unit_price_cents, 125);
        await service.bulk(p, seller, [
          { id, version: rows[0].inventory_version, storageLocation: "" },
        ]);
        rows = (await service.list(p, seller, { q: "location-manual" })).rows;
        assert.equal(rows[0].storage_location, null);
        const csv = `variant_id,condition,price,quantity,seller_sku,storage_location\n${variant},NM,1.25,2,location-csv,"Box C, row 2"`;
        const preview = await service.preview(p, seller, {
          csv,
          requestKey: randomUUID(),
        });
        assert.equal(preview.summary.matched, 1);
        await service.publish(p, seller, preview.id);
        assert.equal(
          (await service.list(p, seller, { q: "Box C" })).rows[0]
            .storage_location,
          "Box C, row 2",
        );
        const invalid = await service.preview(p, seller, {
          csv: csv.replace('"Box C, row 2"', "x".repeat(101)),
          requestKey: randomUUID(),
        });
        assert.equal(invalid.summary.invalid, 1);
        await assert.rejects(
          () => service.publish(p, seller, invalid.id),
          /import_needs_review/,
        );
      },
    );
    await t.test(
      "inventory export matches filters across all pages and rejects overflow",
      async () => {
        await assert.rejects(() => service.export(p, other), /forbidden/);
        await assert.rejects(
          () => service.export(p, seller),
          /export_too_large/,
        );
        for (const filter of [
          { q: "scale-1000-" },
          { q: "location-csv" },
          { q: "Box C" },
          { q: "001", source: "manual" },
          { q: "scale-100-", low: "true" },
          { q: "scale-100-", status: "archived" },
          { q: "scale-100-", sync: "review" },
        ]) {
          const expected: string[] = [];
          let after: string | null = null;
          do {
            const page = await service.list(p, seller, { ...filter, after });
            expected.push(...page.rows.map((r) => String(r.id)));
            after = page.next;
          } while (after);
          const result = await service.export(p, seller, {
            ...filter,
            after: randomUUID(),
          });
          assert.deepEqual(
            (result.rows ? parseCsv(result.csv).slice(1) : [])
              .map((r) => r[0]),
            expected,
          );
          assert.equal(result.rows, expected.length);
        }
      },
    );
    await t.test("eligible shipping settings flow through database to public quote",async()=>{
      const settings=new SellerPlatformService(db as Sql,store),listingId=randomUUID();
      await db.query("UPDATE troc.seller_accounts SET level_id='established' WHERE id=$1",[seller]);
      await db.query("INSERT INTO troc.listings(id,seller_id,variant_id,condition,unit_price_cents,quantity,status,seller_sku) VALUES($1,$2,$3,'NM',625,2,'active','shipping-roundtrip')",[listingId,seller,variant]);
      const setThreshold=async(value:number|null)=>{const saved=await settings.settings(p,seller);await settings.saveSettings(p,seller,{displayName:"Store",version:saved.version,minimumOrderCents:0,handlingDays:2,freeShippingCents:value});};
      const quote=async(quantity=2)=>{const data=await loadCommerce(db as Sql,[listingId]);return quoteCart([{listingId,quantity}],data.listings,data.sellers);};
      await setThreshold(1250);
      assert.ok((await quote(1)).shippingCents>0);assert.equal((await quote(1)).groups[0].freeShippingRemainingCents,625);
      assert.equal((await quote()).shippingCents,0);assert.equal((await quote()).groups[0].freeShippingRemainingCents,0);
      await db.query("UPDATE troc.seller_settings SET promotions=$2 WHERE seller_id=$1",[seller,JSON.stringify([{id:"shipping-discount",basisPoints:1000}])]);
      const discounted=await quote();assert.equal(discounted.discountCents,125);assert.ok(discounted.shippingCents>0);assert.equal(discounted.groups[0].freeShippingRemainingCents,125);
      await setThreshold(1125);assert.equal((await quote()).shippingCents,0);
      await setThreshold(0);assert.equal((await quote(1)).shippingCents,0);
      await setThreshold(null);assert.ok((await quote()).shippingCents>0);assert.equal((await quote()).groups[0].freeShippingRemainingCents,null);
      await setThreshold(0);await db.query("UPDATE troc.seller_accounts SET level_id='new' WHERE id=$1",[seller]);assert.ok((await quote()).shippingCents>0);assert.equal((await quote()).groups[0].freeShippingRemainingCents,null);
    });
    await t.test("sale editor preserves stock, validates resulting prices and matches quote/export", async () => {
      const id = randomUUID();
      await db.query("INSERT INTO troc.listings(id,seller_id,variant_id,condition,unit_price_cents,quantity,status,seller_sku) VALUES($1,$2,$3,'NM',1000,3,'active','sale-roundtrip')", [id,seller,variant]);
      const read = async () => (await service.list(p,seller,{q:"sale-roundtrip"})).rows[0];
      const change = async (value:Record<string,unknown>) => service.bulk(p,seller,[{id,version:(await read()).inventory_version,...value}]);
      const original = await read();
      await assert.rejects(() => service.bulk(p,other,[{id,version:original.inventory_version,saleCents:625}]), /forbidden/);
      for (const saleCents of [-1,0,1.5,100000001]) await assert.rejects(() => change({saleCents}), /invalid_inventory/);
      await assert.rejects(() => change({saleCents:1001}), /price_below_sale/);
      await change({saleCents:625});
      await assert.rejects(() => service.bulk(p,seller,[{id,version:original.inventory_version,saleCents:null}]), /inventory_changed/);
      await change({storageLocation:"Sale shelf"});
      assert.equal((await read()).sale_cents,625);
      assert.equal((await read()).quantity,3);
      const data = await loadCommerce(db as Sql,[id]);
      const quote = quoteCart([{listingId:id,quantity:2}],data.listings,data.sellers);
      assert.equal(quote.merchandiseCents,1250);
      assert.equal(quote.discountCents,0);
      const exported = parseCsv((await service.export(p,seller,{q:"sale-roundtrip"})).csv);
      assert.equal(exported[1][exported[0].indexOf("price")],"10.00");
      assert.equal(exported[1][exported[0].indexOf("sale_price")],"6.25");
      await assert.rejects(() => change({priceCents:600}), /price_below_sale/);
      await change({priceCents:500,saleCents:400});
      assert.equal((await read()).sale_cents,400);
      await change({saleCents:null});
      assert.equal((await read()).sale_cents,null);
      assert.equal((await read()).quantity,3);
      const cleared = parseCsv((await service.export(p,seller,{q:"sale-roundtrip"})).csv);
      assert.equal(cleared[1][cleared[0].indexOf("sale_price")],"");
    });
    await t.test("stale principals cannot retain revoked inventory or administrator access", async () => {
      const row=(await service.list(p,seller,{q:"sale-roundtrip"})).rows[0];
      const change=()=>service.bulk(p,seller,[{id:row.id,version:row.inventory_version,storageLocation:"forbidden"}]);
      try {
        await db.query("DELETE FROM troc.seller_members WHERE seller_id=$1 AND user_id=$2",[seller,user]);
        await assert.rejects(()=>service.list(p,seller),/forbidden/);
        await assert.rejects(change,/forbidden/);
        await db.query("INSERT INTO troc.seller_members(seller_id,user_id,role) VALUES($1,$2,'customer_service')",[seller,user]);
        await assert.rejects(()=>service.export(p,seller,{q:"sale-roundtrip"}),/forbidden/);
        await assert.rejects(change,/forbidden/);
        const staleAdmin:Principal={userId:user,roles:["admin"],memberships:[]};
        await assert.rejects(()=>service.list(staleAdmin,seller),/forbidden/);
        await db.query("UPDATE troc.seller_members SET role='owner' WHERE seller_id=$1 AND user_id=$2",[seller,user]);
        await db.query("UPDATE troc.users SET status='suspended' WHERE id=$1",[user]);
        await assert.rejects(change,/unauthorized/);
      } finally {
        await db.query("UPDATE troc.users SET status='active' WHERE id=$1",[user]);
        await db.query("INSERT INTO troc.seller_members(seller_id,user_id,role) VALUES($1,$2,'owner') ON CONFLICT(seller_id,user_id) DO UPDATE SET role='owner'",[seller,user]);
      }
      assert.equal((await service.list(p,seller,{q:"sale-roundtrip"})).rows[0].inventory_version,row.inventory_version);
    });
    await t.test("private photo quarantine binds actor listing bytes and revocable authority",async()=>{
      const row=(await service.list(p,seller,{q:"sale-roundtrip"})).rows[0];
      const bytes=await sharp({create:{width:8,height:12,channels:3,background:"red"}}).png().toBuffer();
      const objects=new Map<string,string>();let scans=0;
      const storage={readPrivate:async(key:string)=>{assert.ok(objects.has(key));return {url:"https://private.example/temporary",expiresAt:new Date(Date.now()+60000).toISOString()};},deletePrivate:async(key:string)=>{objects.delete(key);},putPrivate:async(key:string,_bytes:Buffer,digest:string)=>{assert.ok(key.startsWith("listing-quarantine/"));if(objects.has(key))assert.equal(objects.get(key),digest);objects.set(key,digest);}};
      const scanner={scan:async()=>{scans++;return "clean" as const;}};
      const photos=new PhotoQuarantineService(db as Sql,store,storage,scanner),request=randomUUID();
      const stage=(key=request,input=bytes)=>photos.stage(p,seller,String(row.id),Number(row.inventory_version),key,input,"image/png");
      const ready=await stage();assert.equal(ready.state,"ready");
      assert.deepEqual(await stage(),ready);assert.equal(scans,1);assert.equal(objects.size,1);
      await assert.rejects(()=>stage(request,Buffer.concat([bytes,Buffer.from([1])])),/upload_request_conflict/);
      const secondActor=randomUUID();await db.query("INSERT INTO troc.users(id,email) VALUES($1,$2)",[secondActor,secondActor+"@example.test"]);await db.query("INSERT INTO troc.seller_members(seller_id,user_id,role) VALUES($1,$2,'inventory')",[seller,secondActor]);
      await assert.rejects(()=>photos.stage({...p,userId:secondActor},seller,String(row.id),Number(row.inventory_version),request,bytes,"image/png"),/upload_request_conflict/);

      await assert.rejects(()=>photos.stage(p,other,String(row.id),Number(row.inventory_version),randomUUID(),bytes,"image/png"),/forbidden/);
      await db.query("UPDATE troc.listing_photo_uploads SET expires_at=now()-interval '1 second' WHERE id=$1",[ready.id]);
      await assert.rejects(()=>stage(),/upload_expired/);
      const denied=new PhotoQuarantineService(db as Sql,store,storage,{scan:async()=>"rejected"});
      assert.equal((await denied.stage(p,seller,String(row.id),Number(row.inventory_version),randomUUID(),bytes,"image/png")).state,"rejected");assert.equal(objects.size,1);
      const failing=new PhotoQuarantineService(db as Sql,store,storage,{scan:async()=>{throw new Error("scanner offline");}}),retry=randomUUID();
      await assert.rejects(()=>failing.stage(p,seller,String(row.id),Number(row.inventory_version),retry,bytes,"image/png"),/scanner offline/);
      assert.equal((await stage(retry)).state,"ready");
      const cancel=new AbortController(),cancelKey=randomUUID(),objectCount=objects.size;
      const cancelled=new PhotoQuarantineService(db as Sql,store,storage,{scan:async()=>{cancel.abort(new Error("request cancelled"));return "clean";}});
      await assert.rejects(()=>cancelled.stage(p,seller,String(row.id),Number(row.inventory_version),cancelKey,bytes,"image/png",cancel.signal),/request cancelled/);
      assert.equal(objects.size,objectCount);
      assert.equal((await db.query<{state:string}>("SELECT state FROM troc.listing_photo_uploads WHERE request_key=$1",[cancelKey])).rows[0].state,"pending");
      const revokedKey=randomUUID();
      const revoked=new PhotoQuarantineService(db as Sql,store,storage,{scan:async()=>{await db.query("DELETE FROM troc.seller_members WHERE seller_id=$1 AND user_id=$2",[seller,user]);return "clean";}});
      try {await assert.rejects(()=>revoked.stage(p,seller,String(row.id),Number(row.inventory_version),revokedKey,bytes,"image/png"),/forbidden/);}
      finally {await db.query("INSERT INTO troc.seller_members(seller_id,user_id,role) VALUES($1,$2,'owner')",[seller,user]);}
      assert.equal((await db.query<{state:string}>("SELECT state FROM troc.listing_photo_uploads WHERE request_key=$1",[revokedKey])).rows[0].state,"pending");
      // Expired and late-write orphans are private and remain discoverable.
      const readyKey=[...objects.keys()].find(key=>key.includes(ready.id))!;
      assert.ok(objects.has(readyKey));
      const beforeCleanup=objects.size;const cleaned=await photos.cleanupExpired();assert.equal(cleaned.failed.length,0);assert.equal(objects.has(readyKey),false);assert.equal(objects.size,beforeCleanup-1);
      objects.set(readyKey,"late-provider-write");await photos.cleanupExpired();assert.equal(objects.has(readyKey),false);
      const failingCleanup=new PhotoQuarantineService(db as Sql,store,{...storage,deletePrivate:async()=>{throw new Error("storage offline");}},scanner);
      assert.ok((await failingCleanup.cleanupExpired()).failed.includes(ready.id));
      await assert.rejects(()=>photos.cleanupExpired(null,101),/invalid_cleanup_limit/);


      const budgetListing=randomUUID();await db.query("INSERT INTO troc.listings(id,seller_id,variant_id,condition,unit_price_cents,quantity,status) VALUES($1,$2,$3,'NM',100,0,'draft')",[budgetListing,seller,variant]);
      await db.query("INSERT INTO troc.listing_photo_uploads(id,seller_id,listing_id,actor_id,request_key,listing_version,input_sha256,content_type) SELECT gen_random_uuid(),$1,$2,$3,gen_random_uuid(),1,repeat('a',64),'image/png' FROM generate_series(1,12)",[seller,budgetListing,user]);
      const scansBefore=scans;await assert.rejects(()=>photos.stage(p,seller,budgetListing,1,randomUUID(),bytes,"image/png"),/image_staging_limit/);assert.equal(scans,scansBefore);
      assert.equal((await db.query("SELECT id FROM troc.listing_photos WHERE listing_id=$1",[row.id])).rows.length,0);
      const unchanged=(await service.list(p,seller,{q:"sale-roundtrip"})).rows[0];assert.equal(unchanged.inventory_version,row.inventory_version);assert.equal(unchanged.quantity,row.quantity);
      const target=randomUUID();await db.query("INSERT INTO troc.listings(id,seller_id,variant_id,condition,unit_price_cents,quantity,status) VALUES($1,$2,$3,'NM',10000,0,'draft')",[target,seller,variant]);
      const staged=await photos.stage(p,seller,target,1,randomUUID(),bytes,"image/png");
      const older=await photos.stage(p,seller,target,1,randomUUID(),bytes,"image/png");
      await assert.rejects(()=>photos.readAttached(p,seller,staged.id),/not_found/);
      const attached=await photos.attach(p,seller,target,staged.id,1);assert.equal(attached.version,2);
      assert.deepEqual(await photos.attach(p,seller,target,staged.id,1),attached);
      await assert.rejects(()=>photos.attach(p,seller,target,older.id,1),/inventory_changed/);
      await assert.rejects(()=>photos.readAttached(p,other,staged.id),/forbidden/);
      assert.ok((await photos.readAttached(p,seller,staged.id)).url.startsWith("https://private.example/"));
      for(const response of [
        {url:"http://private.example/x",expiresAt:new Date(Date.now()+60000).toISOString()},
        {url:"https://user:secret@private.example/x",expiresAt:new Date(Date.now()+60000).toISOString()},
        {url:"https://private.example/x#secret",expiresAt:new Date(Date.now()+60000).toISOString()},
        {url:"https://private.example/x",expiresAt:"invalid"},
        {url:"https://private.example/x",expiresAt:new Date(Date.now()-1000).toISOString()},
        {url:"https://private.example/x",expiresAt:new Date(Date.now()+3600000).toISOString()},
      ]){
        const badRead=new PhotoQuarantineService(db as Sql,store,{...storage,readPrivate:async(_key,ttl)=>{assert.equal(ttl,60);return response;}},scanner);
        await assert.rejects(()=>badRead.readAttached(p,seller,staged.id),/image_read_unavailable/);
      }
      const signingFailure=new PhotoQuarantineService(db as Sql,store,{...storage,readPrivate:async()=>{throw new Error("https://private.example/?secret=token");}},scanner);
      await assert.rejects(()=>signingFailure.readAttached(p,seller,staged.id),error=>error instanceof Error && error.message==="image_read_unavailable");
      const revokedRead=new PhotoQuarantineService(db as Sql,store,{...storage,readPrivate:async()=>{await db.query("DELETE FROM troc.seller_members WHERE seller_id=$1 AND user_id=$2",[seller,user]);return {url:"https://private.example/x",expiresAt:new Date(Date.now()+60000).toISOString()};}},scanner);
      try{await assert.rejects(()=>revokedRead.readAttached(p,seller,staged.id),/forbidden/);}
      finally{await db.query("INSERT INTO troc.seller_members(seller_id,user_id,role) VALUES($1,$2,'owner')",[seller,user]);}

      await db.query("UPDATE troc.listing_photo_uploads SET expires_at=now()-interval '1 second' WHERE id=$1",[staged.id]);
      await photos.cleanupExpired();assert.ok([...objects.keys()].some(key=>key.includes(staged.id)));
      assert.deepEqual(await photos.attach(p,seller,target,staged.id,1),attached);
      const listingState=(await db.query<{status:string;quantity:number;unit_price_cents:number}>("SELECT status,quantity,unit_price_cents FROM troc.listings WHERE id=$1",[target])).rows[0];assert.deepEqual(listingState,{status:"draft",quantity:0,unit_price_cents:10000});
      assert.equal((await db.query("SELECT id FROM troc.listing_photos WHERE listing_id=$1",[target])).rows.length,0);
      await db.query("DELETE FROM troc.seller_members WHERE seller_id=$1 AND user_id=$2",[seller,user]);
      try{await assert.rejects(()=>photos.readAttached(p,seller,staged.id),/forbidden/);await assert.rejects(()=>photos.attach(p,seller,target,staged.id,1),/forbidden/);}
      finally{await db.query("INSERT INTO troc.seller_members(seller_id,user_id,role) VALUES($1,$2,'owner')",[seller,user]);}
      await assert.rejects(()=>photos.remove(p,seller,target,staged.id,1),/inventory_changed/);
      const removed=await photos.remove(p,seller,target,staged.id,2);assert.equal(removed.version,3);
      assert.deepEqual(await photos.remove(p,seller,target,staged.id,2),removed);
      await assert.rejects(()=>photos.readAttached(p,seller,staged.id),/not_found/);
      await assert.rejects(()=>photos.attach(p,seller,target,staged.id,1),/image_removed/);
      await photos.cleanupExpired();assert.equal([...objects.keys()].some(key=>key.includes(staged.id)),false);
      assert.deepEqual(await photos.remove(p,seller,target,staged.id,2),removed);
      assert.equal((await db.query<{inventory_version:number}>("SELECT inventory_version FROM troc.listings WHERE id=$1",[target])).rows[0].inventory_version,3);

    });
    await t.test("connected photo HTTP lifecycle preserves private state and handles retries",async()=>{
      const target=randomUUID();await db.query("INSERT INTO troc.listings(id,seller_id,variant_id,condition,unit_price_cents,quantity,status) VALUES($1,$2,$3,'NM',10000,0,'draft')",[target,seller,variant]);
      const objects=new Map<string,Buffer>();let offline=true,scans=0;
      const photos=new PhotoQuarantineService(db as Sql,store,{
        putPrivate:async(key,bytes)=>{objects.set(key,Buffer.from(bytes));},
        deletePrivate:async(key)=>{objects.delete(key);},
        readPrivate:async()=>({url:"https://private.example/read",expiresAt:new Date(Date.now()+60000).toISOString()}),
      },{scan:async()=>{scans++;if(offline)throw new Error("scanner secret must not escape");return "clean";}});
      const app=express();app.use(inventoryPhotosRouter({appOrigin:"http://site.test",photos,
        principal:async(req)=>{if(req.get("x-test-auth")!=="yes")throw new DomainError("unauthorized",401);return p;},
        access:async(actor,account,id)=>{await service.access(db as Sql,actor,account);if(!(await db.query("SELECT id FROM troc.listings WHERE seller_id=$1 AND id=$2",[account,id])).rows.length)throw new DomainError("not_found",404);},
      }));
      const server=app.listen(0,"127.0.0.1");await once(server,"listening");const address=server.address();assert.ok(address&&typeof address!=="string");
      const base="http://127.0.0.1:"+address.port+"/inventory/"+seller+"/listings/"+target+"/photos",key=randomUUID();
      const bytes=await sharp({create:{width:8,height:12,channels:3,background:"blue"}}).png().toBuffer();
      const headers={origin:"http://site.test","x-test-auth":"yes","content-type":"image/png","x-listing-version":"1","idempotency-key":key};
      const send=(suffix="",version=1)=>fetch(base+suffix,{method:"POST",headers:{...headers,"x-listing-version":String(version)},body:suffix?undefined:bytes});
      try{
        const failed=await send();assert.equal(failed.status,503);assert.deepEqual(await failed.json(),{code:"image_service_unavailable"});assert.equal(objects.size,0);
        offline=false;const response=await send();assert.equal(response.status,201);assert.equal(response.headers.get("cache-control"),"no-store");const staged=await response.json();assert.equal(staged.state,"ready");assert.equal(objects.size,1);
        const scansBefore=scans;assert.deepEqual(await (await send()).json(),staged);assert.equal(scans,scansBefore);
        const attachedResponse=await send("/"+staged.id+"/attach");assert.equal(attachedResponse.status,200);const attached=await attachedResponse.json();assert.equal(attached.version,2);
        assert.deepEqual(await (await send("/"+staged.id+"/attach")).json(),attached);
        await db.query("DELETE FROM troc.seller_members WHERE seller_id=$1 AND user_id=$2",[seller,user]);
        try{assert.equal((await send("/"+staged.id+"/remove",2)).status,403);}
        finally{await db.query("INSERT INTO troc.seller_members(seller_id,user_id,role) VALUES($1,$2,'owner')",[seller,user]);}
        assert.equal((await send("/"+staged.id+"/remove",1)).status,409);
        const removedResponse=await send("/"+staged.id+"/remove",2);assert.equal(removedResponse.status,200);const removed=await removedResponse.json();assert.equal(removed.version,3);
        assert.deepEqual(await (await send("/"+staged.id+"/remove",2)).json(),removed);
        assert.equal((await send("/"+staged.id+"/attach")).status,409);
        await photos.cleanupExpired();assert.equal(objects.size,0);
        const actual=(await db.query<{status:string;quantity:number;unit_price_cents:number;inventory_version:number}>("SELECT status,quantity,unit_price_cents,inventory_version FROM troc.listings WHERE id=$1",[target])).rows[0];assert.deepEqual(actual,{status:"draft",quantity:0,unit_price_cents:10000,inventory_version:3});
        assert.equal((await db.query("SELECT id FROM troc.listing_photos WHERE listing_id=$1",[target])).rows.length,0);
      }finally{server.closeAllConnections();await new Promise<void>(resolve=>server.close(()=>resolve()));}
    });
    await t.test("private tables inaccessible to browser roles", async () => {
      await db.exec(
        "CREATE ROLE inventory_browser NOLOGIN; SET ROLE inventory_browser",
      );
      try {
        await assert.rejects(()=>db.query("SELECT * FROM troc.listing_photo_uploads"),/permission denied/);
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
