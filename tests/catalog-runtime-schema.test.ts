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
      SELECT g.id,s.id,n,n,n,'raw_single' FROM troc.games g CROSS JOIN troc.set_releases s CROSS JOIN unnest(ARRAY['alpha-near','beta-exact','zed-exact']) n;
      INSERT INTO troc.printings(product_id,language,printing_key,collector_number) SELECT id,'en','standard',CASE WHEN slug='alpha-near' THEN '00099/10000' ELSE '09999/10000' END FROM troc.catalog_products;
      INSERT INTO troc.variants(printing_id,variant_key) SELECT id,'normal' FROM troc.printings;
      INSERT INTO troc.catalog_documents(product_id,search_text,document)
      SELECT p.id,'Aurora target '||pr.collector_number,jsonb_build_object('id',p.id,'slug',p.slug,'setId',p.set_id,'name',jsonb_build_object('en',p.name_en,'fr',p.name_fr),'variants',jsonb_build_array(jsonb_build_object('id',v.id,'number',pr.collector_number,'language',pr.language,'key',v.variant_key))) FROM troc.catalog_products p JOIN troc.printings pr ON pr.product_id=p.id JOIN troc.variants v ON v.printing_id=pr.id;
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
      assert.equal(first.items.length, 1);
      assert.ok(["beta-exact", "zed-exact"].includes(first.items[0].product.slug));
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
      assert.equal(second.items.length, 1);
      assert.deepEqual(
        [first.items[0].product.slug, second.items[0].product.slug].sort(),
        ["beta-exact", "zed-exact"],
      );
      for (const item of [...first.items, ...second.items]) {
        assert.equal(item.product.variants.length, 1);
        assert.equal(item.product.variants[0].number, "09999/10000");
      }
      assert.equal(second.nextCursor, null);
    }
  } finally {
    await db.close();
  }
});
