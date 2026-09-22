import { test } from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { PGlite } from "@electric-sql/pglite";
test("foundation migration and relational safeguards execute in PostgreSQL", async (t) => {
  const db = new PGlite();
  try {
    await db.exec(
      await readFile(
        new URL("../lib/db/migrations/0001_foundation.sql", import.meta.url),
        "utf8",
      ),
    );
    await db.exec(
      await readFile(
        new URL(
          "../lib/db/migrations/0002_backend_access.sql",
          import.meta.url,
        ),
        "utf8",
      ),
    );
    await db.exec("SET search_path TO public");
    const user = "11111111-1111-4111-8111-111111111111";
    const batch = "22222222-2222-4222-8222-222222222222";
    await db.query(
      "INSERT INTO troc.demo_batches(id,seed_key) VALUES($1,'foundation-test')",
      [batch],
    );
    await db.query(
      "INSERT INTO troc.users(id,email,demo_batch_id) VALUES($1,'test@example.invalid',$2)",
      [user, batch],
    );
    await t.test("demo provenance generated and immutable", async () => {
      assert.equal(
        (await db.query("SELECT * FROM troc.demo_provenance")).rows.length,
        1,
      );
      await assert.rejects(
        db.query("UPDATE troc.users SET demo_batch_id=null WHERE id=$1", [
          user,
        ]),
      );
    });
    await t.test("foreign keys and country restrictions", async () => {
      await assert.rejects(
        db.exec(
          "INSERT INTO troc.user_profiles(user_id,country) VALUES(gen_random_uuid(),'CA')",
        ),
      );
      await assert.rejects(
        db.query(
          "INSERT INTO troc.user_profiles(user_id,country) VALUES($1,'US')",
          [user],
        ),
      );
    });
    const seller = (
      await db.query<{ id: string }>(
        "INSERT INTO troc.seller_accounts(slug,display_name,seller_type) VALUES('test','Test','individual') RETURNING id",
      )
    ).rows[0].id;
    const other = (
      await db.query<{ id: string }>(
        "INSERT INTO troc.seller_accounts(slug,display_name,seller_type) VALUES('other','Other','individual') RETURNING id",
      )
    ).rows[0].id;
    await t.test(
      "seller minimums and founding limits constrained",
      async () => {
        await assert.rejects(
          db.query(
            "INSERT INTO troc.seller_settings(seller_id,minimum_order_cents) VALUES($1,100)",
            [seller],
          ),
        );
        await assert.rejects(
          db.query(
            "UPDATE troc.seller_accounts SET founding_number=251 WHERE id=$1",
            [seller],
          ),
        );
        await assert.rejects(
          db.query(
            "UPDATE troc.seller_accounts SET founding_number=1 WHERE id=$1",
            [seller],
          ),
        );
      },
    );
    const game = (
      await db.query<{ id: string }>(
        "INSERT INTO troc.games(slug,name_en,name_fr) VALUES('test','Test','Test') RETURNING id",
      )
    ).rows[0].id;
    const set = (
      await db.query<{ id: string }>(
        "INSERT INTO troc.set_releases(game_id,slug,name_en,name_fr) VALUES($1,'set','Set','Série') RETURNING id",
        [game],
      )
    ).rows[0].id;
    const product = (
      await db.query<{ id: string }>(
        "INSERT INTO troc.catalog_products(game_id,set_id,slug,name_en,name_fr,product_type) VALUES($1,$2,'product','Product','Produit','raw_single') RETURNING id",
        [game, set],
      )
    ).rows[0].id;
    const printing = (
      await db.query<{ id: string }>(
        "INSERT INTO troc.printings(product_id,language,printing_key) VALUES($1,'en','base') RETURNING id",
        [product],
      )
    ).rows[0].id;
    const variant = (
      await db.query<{ id: string }>(
        "INSERT INTO troc.variants(printing_id,variant_key) VALUES($1,'standard') RETURNING id",
        [printing],
      )
    ).rows[0].id;
    const listing = (
      await db.query<{ id: string }>(
        "INSERT INTO troc.listings(seller_id,variant_id,unit_price_cents,quantity) VALUES($1,$2,1,100) RETURNING id",
        [seller, variant],
      )
    ).rows[0].id;
    await t.test(
      "one-cent listings work; invalid currency, quantity and mappings fail",
      async () => {
        await assert.rejects(
          db.query("UPDATE troc.listings SET unit_price_cents=0 WHERE id=$1", [
            listing,
          ]),
        );
        await assert.rejects(
          db.query("UPDATE troc.listings SET quantity=-1 WHERE id=$1", [
            listing,
          ]),
        );
        await assert.rejects(
          db.query("UPDATE troc.listings SET currency='USD' WHERE id=$1", [
            listing,
          ]),
        );
        await db.query(
          "INSERT INTO troc.external_catalog_mappings(provider,external_id,variant_id) VALUES('test','external',$1)",
          [variant],
        );
        await assert.rejects(
          db.query(
            "INSERT INTO troc.external_catalog_mappings(provider,external_id,variant_id) VALUES('test','external',$1)",
            [variant],
          ),
        );
      },
    );
    await t.test(
      "one buyer order supports multiple sellers; cross-seller lines rejected",
      async () => {
        const order = (
          await db.query<{ id: string }>(
            "INSERT INTO troc.marketplace_orders(buyer_id,total_cents,processing_fixed_cents,idempotency_key) VALUES($1,2,30,'once') RETURNING id",
            [user],
          )
        ).rows[0].id;
        const child = (
          await db.query<{ id: string }>(
            "INSERT INTO troc.seller_orders(marketplace_order_id,seller_id,merchandise_cents,shipping_cents) VALUES($1,$2,1,0) RETURNING id",
            [order, seller],
          )
        ).rows[0].id;
        await db.query(
          "INSERT INTO troc.seller_orders(marketplace_order_id,seller_id,merchandise_cents,shipping_cents) VALUES($1,$2,1,0)",
          [order, other],
        );
        assert.equal(
          (
            await db.query(
              "SELECT * FROM troc.seller_orders WHERE marketplace_order_id=$1",
              [order],
            )
          ).rows.length,
          2,
        );
        await assert.rejects(
          db.query(
            "INSERT INTO troc.order_items(seller_order_id,seller_id,listing_id,variant_id,quantity,unit_price_cents,snapshot) VALUES($1,$2,$3,$4,1,1,'{}')",
            [child, other, listing, variant],
          ),
        );
        await assert.rejects(
          db.query(
            "INSERT INTO troc.marketplace_orders(buyer_id,total_cents,idempotency_key) VALUES($1,2,'once')",
            [user],
          ),
        );
      },
    );
    await t.test("audit immutable and real leads separate", async () => {
      await db.exec(
        "INSERT INTO troc.audit_events(action,entity_type) VALUES('test','test')",
      );
      await assert.rejects(db.exec("DELETE FROM troc.audit_events"));
      await assert.rejects(
        db.query(
          "INSERT INTO troc.demo_provenance(batch_id,entity_type,entity_id) VALUES($1,'buyer_waitlist',gen_random_uuid())",
          [batch],
        ),
      );
      await db.exec(
        "INSERT INTO troc.buyer_waitlist(email,locale,consent_version,consented_at) VALUES('real@example.invalid','fr','v1',now())",
      );
      assert.equal(
        (await db.query("SELECT * FROM troc.buyer_waitlist")).rows.length,
        1,
      );
    });
    await t.test("RLS is enabled on every application table", async () => {
      assert.equal(
        (
          await db.query(
            "SELECT relname FROM pg_class JOIN pg_namespace n ON n.oid=relnamespace WHERE n.nspname='troc' AND relkind='r' AND NOT relrowsecurity",
          )
        ).rows.length,
        0,
      );
    });
    await t.test(
      "runtime role cannot grant roles, read leads or rewrite audit",
      async () => {
        await db.exec("SET ROLE troc_backend");
        assert.equal(
          (await db.query("SELECT id FROM troc.users")).rows.length,
          1,
        );
        await assert.rejects(
          db.query(
            "INSERT INTO troc.user_roles(user_id,role) VALUES($1,'admin')",
            [user],
          ),
        );
        await assert.rejects(db.exec("SELECT * FROM troc.buyer_waitlist"));
        await assert.rejects(db.exec("DELETE FROM troc.audit_events"));
        await db.exec("RESET ROLE");
      },
    );
  } finally {
    await db.close();
  }
});
