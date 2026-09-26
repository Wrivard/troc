import { test } from "node:test";
import assert from "node:assert/strict";
import { readFile, readdir } from "node:fs/promises";
import { PGlite } from "@electric-sql/pglite";
import { pg_trgm } from "@electric-sql/pglite/contrib/pg_trgm";
import { PostgresCatalogRepository } from "../artifacts/api-server/src/modules/catalog/repository";
import { filtersFrom } from "../artifacts/api-server/src/modules/catalog/search";
test("catalog search resolves trigram operator after the full migration chain with a restricted search path", async () => {
  const db = new PGlite({ extensions: { pg_trgm } });
  try {
    for (const file of (await readdir("lib/db/migrations"))
      .filter((f) => f.endsWith(".sql"))
      .sort())
      await db.exec(await readFile("lib/db/migrations/" + file, "utf8"));
    await db.exec(`
      INSERT INTO troc.games(slug,name_en,name_fr) VALUES('ranking-test','Ranking','Classement');
      INSERT INTO troc.set_releases(game_id,slug,name_en,name_fr) SELECT id,'ranking-set','Set','Serie' FROM troc.games;
      INSERT INTO troc.catalog_products(game_id,set_id,slug,name_en,name_fr,product_type)
      SELECT g.id,s.id,n,n,n,'raw_single' FROM troc.games g CROSS JOIN troc.set_releases s CROSS JOIN unnest(ARRAY['alpha-near','zed-exact']) n;
      INSERT INTO troc.printings(product_id,language,printing_key) SELECT id,'en','standard' FROM troc.catalog_products;
      INSERT INTO troc.variants(printing_id,variant_key) SELECT id,'normal' FROM troc.printings;
      INSERT INTO troc.catalog_documents(product_id,search_text,document)
      SELECT id,CASE WHEN slug='zed-exact' THEN 'Aurora target 09999/10000' ELSE 'Aurora target 00099/10000' END,jsonb_build_object('id',id,'slug',slug) FROM troc.catalog_products;
    `);
    const operator = (
      await db.query<{ schema: string }>(
        "SELECT n.nspname AS schema FROM pg_operator o JOIN pg_namespace n ON n.oid=o.oprnamespace WHERE o.oprname='<%'",
      )
    ).rows;
    assert.deepEqual(
      operator.map((r) => r.schema),
      ["extensions"],
    );
    await db.exec(
      "SET ROLE troc_backend; SET search_path TO pg_catalog,public",
    );
    const probe = await db.query<{ matches: boolean }>(
      "SELECT 'northern' OPERATOR(extensions.<%) 'northern card' AS matches",
    );
    assert.equal(probe.rows[0].matches, true);
    const result = await new PostgresCatalogRepository(db).search(
      filtersFrom(new URLSearchParams({ q: "northern" })),
    );
    assert.deepEqual(result.items, []);
    const repo = new PostgresCatalogRepository(db);
    for (const sort of ["name", "newest", "price"]) {
      const first = await repo.search(
        filtersFrom(
          new URLSearchParams({ q: "09999/10000", sort, limit: "1" }),
        ),
      );
      assert.equal(first.items[0].product.slug, "zed-exact");
      assert.ok(first.nextCursor);
      const second = await repo.search(
        filtersFrom(
          new URLSearchParams({
            q: "09999/10000",
            sort,
            limit: "1",
            cursor: first.nextCursor!,
          }),
        ),
      );
      assert.equal(second.items[0].product.slug, "alpha-near");
      assert.equal(second.nextCursor, null);
    }
  } finally {
    await db.close();
  }
});
