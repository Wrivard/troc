import {invalidateCatalogReferences} from "../artifacts/api-server/src/modules/catalog/reference-cache";
import test from "node:test";
import assert from "node:assert/strict";
import { readFile, readdir } from "node:fs/promises";
import { PGlite } from "@electric-sql/pglite";
import { pg_trgm } from "@electric-sql/pglite/contrib/pg_trgm";
import {
  demoCatalog,
  DemoCatalogProvider,
} from "../artifacts/api-server/src/modules/catalog/demo";
import {
  snapshotSuggestions,
  databaseSuggestions,
} from "../artifacts/api-server/src/modules/catalog/suggestions-repository";
import {
  suggestionQuery,
  suggestionRank,
} from "../artifacts/api-server/src/modules/catalog/suggest-ranking";
import {
  runImport,
  type CatalogSqlClient,
} from "../artifacts/api-server/src/modules/catalog/importer";
import type { CatalogSnapshot, Product } from "@workspace/catalog";
test("identifier punctuation, optional # and mixed words rank before partial/fuzzy matches", () => {
  const data = demoCatalog(),
    p = data.products[0];
  p.variants[0].number = "OP01-001";
  p.variants[1].number = "123/167";
  p.name = { en: "Zebra Spark", fr: "Étincelle Zèbre" };
  data.products = Array.from({ length: 60 }, (_, i) => ({
    ...p,
    id: "candidate-" + i,
    slug: "candidate-" + i,
    name: { en: "AAA " + i, fr: "AAA " + i },
    variants: p.variants.map((v) => ({
      ...v,
      id: "v-" + i + v.id,
      number: "X123/167Y",
    })),
  }));
  data.products.push(p);
  for (const q of [
    "123/167",
    "#123/167",
    "Spark #123/167",
    "etincelle #123/167",
  ]) {
    const hit = snapshotSuggestions(data, q, "fr").groups.find(
      (g) => g.kind === "cards",
    )!.results[0];
    assert.equal(hit.id, p.id);
    assert.equal(hit.variantId, p.variants[1].id);
  }
  assert.equal(
    snapshotSuggestions(data, "#OP01-001", "en").groups[0].results[0].variantId,
    p.variants[0].id,
  );
  assert.equal(
    suggestionRank(["Bulbasaur"], "", suggestionQuery("Bulbasur")),
    4,
  );
  assert.equal(
    suggestionRank(["Bulbasaur"], "123/167", suggestionQuery("123-167")),
    null,
  );
  assert.throws(() => suggestionQuery("x".repeat(101)));
  assert.throws(() => suggestionQuery("a ".repeat(11)));
  assert.deepEqual(snapshotSuggestions(data, "  ", "en").groups, []);
});
test("PostgreSQL and snapshot suggestions agree on ranking/variants/groups before caps", async () => {
  const db = new PGlite({ extensions: { pg_trgm } });
  const sql: CatalogSqlClient = { query: async (q, p) => db.query(q, p) };
  try {
    for(const file of (await readdir("lib/db/migrations")).filter(f=>f.endsWith(".sql")).sort()) await db.exec(await readFile("lib/db/migrations/"+file,"utf8"));
    const user = "12345678-1234-4234-8234-123456789012";
    await db.query(
      "INSERT INTO troc.users(id,email) VALUES($1,'search@example.invalid')",
      [user],
    );
    await runImport(
      sql,
      new DemoCatalogProvider(),
      { userId: user, roles: ["catalog_moderator"], memberships: [] },
      "suggest-test",
    );
    const products = (
      await db.query<{ document: Product }>(
        "SELECT document FROM troc.catalog_documents ORDER BY product_id",
      )
    ).rows.map((r) => r.document);
    const target = products.find((p) => p.variants.length > 1)!;
    target.variants[0].number = "OP01-001";
    target.variants[1].number = "123/167";
    await db.query(
      "UPDATE troc.catalog_documents SET document=$2 WHERE product_id=$1",
      [target.id, JSON.stringify(target)],
    );
    const games = (
      await db.query<CatalogSnapshot["games"][number]>(
        "SELECT id,slug,jsonb_build_object('en',name_en,'fr',name_fr) AS name FROM troc.games",
      )
    ).rows;
    const sets = (
      await db.query<CatalogSnapshot["sets"][number]>(
        "SELECT id,game_id AS \"gameId\",slug,jsonb_build_object('en',name_en,'fr',name_fr) AS name,released_on::text AS \"releasedOn\" FROM troc.set_releases",
      )
    ).rows;
    const snapshot: CatalogSnapshot = {
      games,
      sets,
      products,
      sellers: [],
      offers: [],
      prices: [],
      demo: true,
    };
    await db.exec("SET ROLE troc_backend; SET search_path TO pg_catalog,public");
    for (const q of [
      "#123/167",
      "OP01-001",
      target.name.en + " #123/167",
      "Northern",
      "pokemon",
      "norther",
      "' OR 1=1 --",
      "123-167",
      "  ",
    ]) {
      for (const locale of ["en", "fr"] as const) {
        const actual = await databaseSuggestions(sql, q, locale),
          expected = snapshotSuggestions(snapshot, q, locale);
        const project = (r: typeof actual) =>
          r.groups.map((g) => ({
            kind: g.kind,
            rows: g.results.map((v) => [
              v.id,
              v.variantId ?? null,
              v.lowestCents ?? null,
              v.sellerCount ?? null,
            ]),
          }));
        assert.deepEqual(project(actual), project(expected), q + locale);
      }
    }
    await db.exec("RESET ROLE");
    const seller = (
      await db.query<{ id: string }>(
        "INSERT INTO troc.seller_accounts(slug,display_name,seller_type,status) VALUES('zebra-store','Zèbre Store','individual','active') RETURNING id",
      )
    ).rows[0].id;
    await db.query(
      "INSERT INTO troc.listings(seller_id,variant_id,condition,unit_price_cents,quantity,status) VALUES($1,$2,'NM',1,5,'active'),($1,$2,'LP',10,3,'active')",
      [seller, target.variants[1].id],
    );
    const priced = (await databaseSuggestions(sql, "#123/167", "en")).groups[0]
      .results[0];
    assert.equal(priced.lowestCents, 1);
    assert.equal(priced.sellerCount, 1);
    assert.equal(
      (await databaseSuggestions(sql, "zebre", "fr")).groups.find(
        (g) => g.kind === "sellers",
      )?.results[0].id,
      seller,
    );
    await db.query("UPDATE troc.listings SET unit_price_cents=77,quantity=0 WHERE seller_id=$1",[seller]);
    const emptied=(await databaseSuggestions(sql,"#123/167","en")).groups[0].results[0];
    assert.equal(emptied.lowestCents,null,"candidate cache must not retain unavailable offers");
    assert.equal(emptied.sellerCount,0);
    await db.query("UPDATE troc.catalog_products SET name_en='Search projection renamed' WHERE id=$1",[target.id]);
    assert.ok((await db.query<{hay:string}>("SELECT hay FROM troc.catalog_search_variants WHERE product_id=$1",[target.id])).rows.every(row=>row.hay.includes('search projection renamed')));
    await db.exec("BEGIN");
    await db.query("DELETE FROM troc.catalog_documents WHERE product_id=$1",[target.id]);
    assert.equal((await db.query("SELECT 1 FROM troc.catalog_search_variants WHERE product_id=$1",[target.id])).rows.length,0);
    await db.exec("ROLLBACK");
    assert.ok((await db.query("SELECT 1 FROM troc.catalog_search_variants WHERE product_id=$1",[target.id])).rows.length>0);
    invalidateCatalogReferences();
    await db.query(
      "UPDATE troc.seller_accounts SET status='suspended' WHERE id=$1",
      [seller],
    );
    assert.equal(
      (await databaseSuggestions(sql, "zebre", "fr")).groups.some(
        (g) => g.kind === "sellers",
      ),
      false,
    );
  } finally {
    await db.close();
  }
});
