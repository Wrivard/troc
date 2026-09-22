import { test } from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { PGlite } from "@electric-sql/pglite";
import { pg_trgm } from "@electric-sql/pglite/contrib/pg_trgm";
import {
  demoCatalog,
  DemoCatalogProvider,
} from "../artifacts/api-server/src/modules/catalog/demo";
import {
  filtersFrom,
  searchSnapshot,
} from "../artifacts/api-server/src/modules/catalog/search";
import {
  runImport,
  validateImport,
  type CatalogSqlClient,
} from "../artifacts/api-server/src/modules/catalog/importer";
import { publicPage } from "../artifacts/api-server/src/modules/catalog/service";
import {
  DemoCatalogRepository,
  PostgresCatalogRepository,
} from "../artifacts/api-server/src/modules/catalog/repository";
import { convertToCadCents } from "../artifacts/api-server/src/modules/pricing/adapters";
const data = demoCatalog();
const filters = (query = "") => filtersFrom(new URLSearchParams(query));
test("search deduplicates sellers and variants into canonical products", () => {
  const result = searchSnapshot(data, filters("game=pokemon&type=raw_single"));
  assert.equal(result.items.length, 1);
  assert.equal(result.items[0].sellerCount, 3);
  assert.equal(result.items[0].lowestCents, 1);
});
test("filters combine language, condition, variant, price and seller on the SAME offer", () => {
  const result = searchSnapshot(
    data,
    filters(
      "game=pokemon&language=ja&condition=LP&seller=maple-singles&max=80",
    ),
  );
  assert.equal(result.items.length, 1);
  assert.equal(result.items[0].lowestCents, 75);
  assert.equal(result.items[0].sellerCount, 1);
  assert.equal(
    searchSnapshot(
      data,
      filters(
        "game=pokemon&language=ja&condition=LP&seller=maple-singles&max=74",
      ),
    ).items.length,
    0,
  );
});
test("search supports aliases, typo tolerance, artist and collector number", () => {
  for (const q of ["northen", "northern light", "TROC demo fixture", "001"])
    assert.ok(
      searchSnapshot(data, filters(`q=${encodeURIComponent(q)}`)).items.length >
        0,
    );
});
test("pagination is bounded, stable and without duplicate canonical results", () => {
  const first = searchSnapshot(data, filters("limit=3"));
  const next = searchSnapshot(
    data,
    filters(`limit=3&cursor=${first.nextCursor}`),
  );
  assert.equal(first.items.length, 3);
  assert.equal(next.items.length, 3);
  assert.equal(
    new Set([...first.items, ...next.items].map((r) => r.product.id)).size,
    6,
  );
  for (const q of [
    "limit=100000",
    "min=-1",
    "min=20&max=1",
    "language=xx",
    "sort=evil",
  ])
    assert.throws(() => filters(q));
});
test("product detail returns exactly the selected canonical language and variant", async () => {
  const p = data.products[0];
  const v = p.variants[2];
  const page = await publicPage(
    `/product/${p.slug}`,
    new URLSearchParams({ variantId: v.id, lang: "fr" }),
    new DemoCatalogRepository(),
  );
  assert.equal(page.locale, "fr");
  assert.ok(page.offers.every((o) => o.variantId === v.id));
  assert.ok(page.prices.every((price) => price.variantId === v.id));
  await assert.rejects(
    publicPage(
      "/product/missing",
      new URLSearchParams(),
      new DemoCatalogRepository(),
    ),
  );
});
test("FX uses decimal arithmetic with explicit minor-unit precision", () => {
  assert.equal(convertToCadCents(101, "1.35"), 136);
  assert.equal(convertToCadCents(100, "0.009", 0), 90);
  assert.equal(convertToCadCents(1, "1"), 1);
  assert.throws(() => convertToCadCents(1, "NaN"));
  assert.throws(() => convertToCadCents(1.1, "1"));
});
test("catalog importer enforces licenses, reruns, provenance and row isolation", async (t) => {
  const db = new PGlite({ extensions: { pg_trgm } });
  const sql: CatalogSqlClient = {
    query: async (text, values) => db.query(text, values),
  };
  const provider = new DemoCatalogProvider();
  const user = "12345678-1234-4234-8234-123456789012";
  const actor = {
    userId: user,
    roles: ["catalog_moderator"] as const,
    memberships: [],
  };
  try {
    for (const name of [
      "0001_foundation",
      "0002_backend_access",
      "0003_catalog",
    ])
      await db.exec(
        await readFile(
          new URL(`../lib/db/migrations/${name}.sql`, import.meta.url),
          "utf8",
        ),
      );
    await db.query("INSERT INTO troc.users(id,email) VALUES($1,$2)", [
      user,
      "importer@example.invalid",
    ]);
    const principal = { ...actor, roles: [...actor.roles] };
    await t.test(
      "rejects unapproved production providers before reading records",
      async () => {
        let called = false;
        await assert.rejects(
          runImport(
            sql,
            {
              id: "unapproved",
              records: async () => {
                called = true;
                return { items: [] };
              },
            },
            principal,
            "blocked",
          ),
        );
        assert.equal(called, false);
      },
    );
    const report = await runImport(sql, provider, principal, "first");
    assert.equal(report.status, "completed");
    assert.equal(report.succeeded, 25);
    const ids = (
      await db.query(
        "SELECT variant_id FROM troc.external_catalog_mappings ORDER BY external_id",
      )
    ).rows;
    await t.test(
      "same job returns original report; new run preserves IDs",
      async () => {
        assert.equal(
          (await runImport(sql, provider, principal, "first")).id,
          report.id,
        );
        await runImport(sql, provider, principal, "second");
        assert.deepEqual(
          (
            await db.query(
              "SELECT variant_id FROM troc.external_catalog_mappings ORDER BY external_id",
            )
          ).rows,
          ids,
        );
        assert.equal(
          (await db.query("SELECT * FROM troc.catalog_documents")).rows.length,
          15,
        );
      },
    );
    await t.test(
      "per-row failures retain successful rows and reject unlicensed images",
      async () => {
        const batch = await provider.records({ limit: 200 });
        const valid = batch.items[0];
        const mixed = {
          id: provider.id,
          records: async () => ({
            items: [
              {
                ...valid,
                externalId: "bad-image",
                image: {
                  url: "https://example.invalid/card.png",
                  license: "not-approved",
                },
              },
              {
                ...valid,
                product: {
                  ...valid.product,
                  name: { en: "Updated Spark", fr: "Étincelle mise à jour" },
                },
              },
            ],
          }),
        };
        const result = await runImport(sql, mixed, principal, "mixed");
        assert.equal(result.status, "partial");
        assert.equal(result.failed, 1);
        assert.equal(result.succeeded, 1);
        assert.equal(
          (
            await db.query(
              "SELECT * FROM troc.catalog_import_failures WHERE run_id=$1",
              [result.id],
            )
          ).rows.length,
          1,
        );
        assert.throws(() =>
          validateImport({
            ...valid,
            printing: { ...valid.printing, language: "xx" },
          }),
        );
      },
    );
    await t.test(
      "anonymous role cannot read catalog and backend cannot import",
      async () => {
        await db.exec("SET ROLE troc_backend");
        assert.equal(
          (await db.query("SELECT * FROM troc.catalog_documents")).rows.length,
          15,
        );
        await assert.rejects(
          db.query("UPDATE troc.catalog_providers SET catalog_approved=true"),
        );
        await db.exec("RESET ROLE");
      },
    );
    await t.test(
      "PostgreSQL read adapter searches imported products with stable pagination",
      async () => {
        const repo = new PostgresCatalogRepository(sql);
        const first = await repo.search(filters("limit=3"));
        assert.equal(first.items.length, 3);
        assert.ok(first.nextCursor);
        const next = await repo.search(
          filters(`limit=3&cursor=${first.nextCursor}`),
        );
        assert.equal(next.items.length, 3);
        assert.equal(
          new Set([...first.items, ...next.items].map((r) => r.product.id))
            .size,
          6,
        );
        const result = await repo.search(filters("q=Updated Spark"));
        assert.equal(result.items.length, 1);
        const product = await repo.product(result.items[0].product.slug);
        assert.ok(product);
        const seller = (
          await db.query<{ id: string }>(
            "INSERT INTO troc.seller_accounts(slug,display_name,seller_type,status) VALUES('test-public','Test Public','individual','active') RETURNING id",
          )
        ).rows[0].id;
        await db.query(
          "INSERT INTO troc.listings(seller_id,variant_id,condition,unit_price_cents,quantity,status) VALUES($1,$2,'NM',1,20,'active')",
          [seller, product.variants[0].id],
        );
        const onecent = await repo.search(
          filters("max=1&condition=NM&sort=price"),
        );
        assert.equal(onecent.items.length, 1);
        assert.equal(onecent.items[0].lowestCents, 1);
        assert.equal(onecent.items[0].quantity, 20);
        assert.deepEqual(await repo.sitemapCursors(), [""]);
        assert.deepEqual(
          (await repo.sitemap("")).map((item) => item.path),
          ["/store/test-public"],
        );
        const detail = await repo.detail(product, product.variants[0].id);
        assert.equal(detail.offers.length, 1);
        assert.equal(detail.summary.quantity, 20);
      },
    );
  } finally {
    await db.close();
  }
});
