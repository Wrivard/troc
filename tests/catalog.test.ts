import { PostgresCatalogAssetProvider } from "../artifacts/api-server/src/modules/catalog/assets";
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
      "0005_catalog_images",
      "0006_catalog_image_integrity",
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
    await t.test(
      "image renditions resolve in order and source revocation removes cached art",
      async () => {
        const repo = new PostgresCatalogRepository(sql);
        const product = (await repo.search(filters())).items[0]?.product;
        assert.ok(product);
        const source = (
          await db.query<{ id: string }>(
            "INSERT INTO troc.asset_sources(provider,license,approved_at) VALUES('image-test','test only',now()) RETURNING id",
          )
        ).rows[0].id;
        const provenance = (
          await db.query<{ id: string }>(
            "INSERT INTO troc.asset_provenance(source_id,source_url) VALUES($1,'https://example.invalid/source') RETURNING id",
            [source],
          )
        ).rows[0].id;
        const image = (
          await db.query<{ id: string }>(
            "INSERT INTO troc.catalog_images(product_id,variant_id,provenance_id,external_id,side,width,height) VALUES($1,$2,$3,'external-front','front',600,825) RETURNING id",
            [product.id, product.variants[0].id, provenance],
          )
        ).rows[0].id;
        await db.query(
          "INSERT INTO troc.catalog_image_renditions(image_id,width,url) VALUES($1,600,'/catalog-art/test-600.webp'),($1,245,'/catalog-art/test-245.webp')",
          [image],
        );
        const assets = new PostgresCatalogAssetProvider(sql);
        const [resolved] = await assets.images([product]);
        assert.equal(resolved.images?.length, 0);
        assert.deepEqual(
          resolved.variants[0].images?.[0].sources.map((s) => s.width),
          [245, 600],
        );
        assert.equal(
          resolved.variants[0].images?.[0].provenance.provider,
          "image-test",
        );
        await db.query(
          "UPDATE troc.asset_sources SET approved_at=NULL WHERE id=$1",
          [source],
        );
        const [revoked] = await assets.images([
          { ...product, imageUrl: "https://example.invalid/stale" },
        ]);
        assert.equal(revoked.imageUrl, null);
        assert.equal(revoked.variants[0].images?.length, 0);
        await db.query("DELETE FROM troc.catalog_images WHERE id=$1", [image]);
        await db.query("DELETE FROM troc.asset_provenance WHERE id=$1", [
          provenance,
        ]);
        await db.query("DELETE FROM troc.asset_sources WHERE id=$1", [source]);
        assert.deepEqual(await assets.images([]), []);
        await assert.rejects(
          assets.images(Array.from({ length: 49 }, () => product)),
          /asset_batch_too_large/,
        );
      },
    );
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

    await t.test(
      "image imports require an operator-approved exact license",
      async () => {
        const valid = (await provider.records({ limit: 1 })).items[0];
        await db.query(
          "UPDATE troc.catalog_providers SET images_approved=true WHERE id=$1",
          [provider.id],
        );
        const imageProvider = (license: string) => ({
          id: provider.id,
          records: async () => ({
            items: [
              {
                ...valid,
                image: { url: "https://example.invalid/approved.png", license },
              },
            ],
          }),
        });
        const rejected = await runImport(
          sql,
          imageProvider("unapproved-license"),
          principal,
          "license-rejected",
        );
        assert.equal(rejected.failed, 1);
        assert.equal(
          (await db.query("SELECT * FROM troc.asset_sources")).rows.length,
          0,
        );
        await db.query(
          "INSERT INTO troc.asset_sources(provider,license,approved_at,approved_by) VALUES($1,'approved-license',now(),$2)",
          [provider.id, user],
        );
        assert.equal(
          (
            await runImport(
              sql,
              imageProvider("approved-license"),
              principal,
              "license-approved",
            )
          ).succeeded,
          1,
        );
        assert.equal(
          (
            await runImport(
              sql,
              imageProvider("changed-license"),
              principal,
              "license-changed",
            )
          ).failed,
          1,
        );
        assert.equal(
          (await db.query("SELECT * FROM troc.asset_sources")).rows.length,
          1,
        );
        assert.equal(
          (await db.query("SELECT * FROM troc.asset_provenance")).rows.length,
          1,
        );
      },
    );
    await t.test(
      "reference money preserves bigint range and rejects unsafe numbers",
      async () => {
        const repo = new PostgresCatalogRepository(sql);
        const product = (await repo.search(filters("type=raw_single"))).items[0]
          .product;
        const variant = product.variants[0].id;
        const fx = (
          await db.query<{ id: string }>(
            "INSERT INTO troc.fx_rates(provider,source_currency,rate,rate_date) VALUES('test','JPY',0.009,'2026-01-01') RETURNING id",
          )
        ).rows[0].id;
        await db.query(
          "INSERT INTO troc.reference_prices(variant_id,provider,provider_product_id,condition,source_currency,source_price_minor_units,provider_updated_at,fx_rate_id,converted_cad_cents) VALUES($1,'test','external','NM','JPY',2147483648,now(),$2,2147483648)",
          [variant, fx],
        );
        const detail = await repo.detail(product, variant);
        assert.equal(detail.prices[0].sourceMinorUnits, 2147483648);
        assert.equal(detail.summary.referenceCents, 2147483648);
        assert.equal(
          (await repo.search(filters())).items.find(
            (r) => r.product.id === product.id,
          )?.referenceCents,
          2147483648,
        );
        await db.query(
          "UPDATE troc.reference_prices SET converted_cad_cents=9007199254740991 WHERE variant_id=$1",
          [variant],
        );
        assert.equal(
          (await repo.detail(product, variant)).summary.referenceCents,
          Number.MAX_SAFE_INTEGER,
        );
        await db.query(
          "UPDATE troc.reference_prices SET converted_cad_cents=9007199254740992 WHERE variant_id=$1",
          [variant],
        );
        await assert.rejects(repo.detail(product, variant), {
          message: "invalid_money",
        });
        await assert.rejects(repo.search(filters()), {
          message: "invalid_money",
        });
        await db.query(
          "UPDATE troc.reference_prices SET converted_cad_cents=100,source_price_minor_units=9007199254740992 WHERE variant_id=$1",
          [variant],
        );
        await assert.rejects(repo.detail(product, variant), {
          message: "invalid_money",
        });
        await db.query(
          "DELETE FROM troc.reference_prices WHERE variant_id=$1",
          [variant],
        );
      },
    );
    await t.test(
      "real products retain demo disclosure from inventory and reference history",
      async () => {
        await db.query(
          "UPDATE troc.catalog_documents SET document=jsonb_set(document,'{demo}','false')",
        );
        const repo = new PostgresCatalogRepository(sql);
        const product = (await repo.search(filters("type=raw_single"))).items[0]
          .product;
        const variant = product.variants[0].id;
        const batch = (
          await db.query<{ id: string }>(
            "INSERT INTO troc.demo_batches(seed_key) VALUES('mixed-demo') RETURNING id",
          )
        ).rows[0].id;
        const seller = (
          await db.query<{ id: string }>(
            "SELECT id FROM troc.seller_accounts WHERE slug='test-public'",
          )
        ).rows[0].id;
        const listing = (
          await db.query<{ id: string }>(
            "INSERT INTO troc.listings(seller_id,variant_id,condition,unit_price_cents,quantity,status,demo_batch_id) VALUES($1,$2,'NM',5,1,'active',$3) RETURNING id",
            [seller, variant, batch],
          )
        ).rows[0].id;
        assert.equal(
          (
            await publicPage(
              "/product/" + product.slug,
              new URLSearchParams(),
              repo,
            )
          ).demo,
          true,
        );
        assert.equal(
          (await publicPage("/search", new URLSearchParams(), repo)).demo,
          true,
        );
        await db.query("DELETE FROM troc.listings WHERE id=$1", [listing]);
        assert.equal(
          (
            await publicPage(
              "/product/" + product.slug,
              new URLSearchParams(),
              repo,
            )
          ).demo,
          false,
        );
        const fx = (
          await db.query<{ id: string }>("SELECT id FROM troc.fx_rates LIMIT 1")
        ).rows[0].id;
        await db.query(
          "INSERT INTO troc.reference_prices(variant_id,provider,provider_product_id,condition,source_currency,source_price_minor_units,provider_updated_at,fx_rate_id,converted_cad_cents,demo_batch_id) VALUES($1,'test','external','NM','JPY',100,now(),$2,90,$3)",
          [variant, fx, batch],
        );
        assert.equal(
          (
            await publicPage(
              "/product/" + product.slug,
              new URLSearchParams(),
              repo,
            )
          ).demo,
          true,
        );
        assert.equal(
          (await publicPage("/search", new URLSearchParams(), repo)).demo,
          true,
        );
      },
    );

    await t.test(
      "product and search context survives more than 100 sets",
      async () => {
        const repo = new PostgresCatalogRepository(sql);
        const product = (await repo.search(filters("type=raw_single"))).items[0]
          .product;
        await db.query(
          "INSERT INTO troc.set_releases(game_id,slug,name_en,name_fr,released_on) SELECT $1,'padding-'||n,'Padding '||n,'Supplément '||n,'2030-01-01'::date FROM generate_series(1,101) n",
          [product.gameId],
        );
        assert.equal(
          (await repo.metadata(filters())).sets.some(
            (s) => s.id === product.setId,
          ),
          false,
        );
        const page = await publicPage(
          "/product/" + product.slug,
          new URLSearchParams(),
          repo,
        );
        assert.ok(page.sets.some((s) => s.id === product.setId));
        const search = await publicPage("/search", new URLSearchParams(), repo);
        assert.ok(
          search.results.every((r) =>
            search.sets.some((s) => s.id === r.product.setId),
          ),
        );
      },
    );
    await t.test(
      "all seller offers remain reachable with bounded sorting and same-offer filters",
      async () => {
        const repo = new PostgresCatalogRepository(sql);
        const product = (await repo.search(filters("type=raw_single"))).items[0]
          .product;
        const seller = (
          await db.query<{ id: string }>(
            "INSERT INTO troc.seller_accounts(slug,display_name,seller_type,status) VALUES('paged-offers','Paged','individual','active') RETURNING id",
          )
        ).rows[0].id;
        await db.query(
          "INSERT INTO troc.listings(seller_id,variant_id,condition,unit_price_cents,quantity,status) SELECT $1,$2,'LP',n,100-n,'active' FROM generate_series(1,55) n",
          [seller, product.variants[0].id],
        );
        const params = new URLSearchParams({
          seller: "paged-offers",
          condition: "LP",
          offerLimit: "20",
        });
        const first = await publicPage(
          "/product/" + product.slug,
          params,
          repo,
        );
        assert.equal(first.offers.length, 20);
        assert.equal(first.nextOfferPage, 2);
        assert.equal(first.offers[0].cents, 1);
        params.set("offerPage", "2");
        const second = await publicPage(
          "/product/" + product.slug,
          params,
          repo,
        );
        params.set("offerPage", "3");
        const third = await publicPage(
          "/product/" + product.slug,
          params,
          repo,
        );
        assert.equal(
          new Set(
            [...first.offers, ...second.offers, ...third.offers].map(
              (o) => o.id,
            ),
          ).size,
          55,
        );
        assert.equal(third.nextOfferPage, null);
        params.set("offerPage", "1");
        params.set("offerSort", "price_desc");
        params.set("min", "10");
        params.set("max", "40");
        const bounded = await publicPage(
          "/product/" + product.slug,
          params,
          repo,
        );
        assert.equal(bounded.offers[0].cents, 40);
        assert.equal(bounded.results[0].lowestCents, 10);
        assert.equal(
          bounded.results[0].quantity,
          Array.from({ length: 31 }, (_, i) => 100 - (i + 10)).reduce(
            (a, b) => a + b,
            0,
          ),
        );
        params.set("offerSort", "quantity");
        assert.equal(
          (await publicPage("/product/" + product.slug, params, repo)).offers[0]
            .cents,
          10,
        );
        for (const query of [
          "offerLimit=51",
          "offerPage=10001",
          "offerSort=untrusted",
        ])
          await assert.rejects(
            publicPage(
              "/product/" + product.slug,
              new URLSearchParams(query),
              repo,
            ),
            { message: "invalid_search" },
          );
      },
    );
    await t.test(
      "reference history isolates condition, grade and provider series",
      async () => {
        const repo = new PostgresCatalogRepository(sql);
        const raw = (await repo.search(filters("type=raw_single"))).items[0]
          .product;
        const graded = (await repo.search(filters("type=graded_card"))).items[0]
          .product;
        const fx = (
          await db.query<{ id: string }>("SELECT id FROM troc.fx_rates LIMIT 1")
        ).rows[0].id;
        await db.query(
          "DELETE FROM troc.reference_prices WHERE variant_id=ANY($1::uuid[])",
          [[raw.variants[0].id, graded.variants[0].id]],
        );
        const insert = (
          variant: string,
          provider: string,
          condition: string | null,
          grade: string | null,
          cents: number,
          date: string,
        ) =>
          db.query(
            "INSERT INTO troc.reference_prices(variant_id,provider,provider_product_id,condition,grade,source_currency,source_price_minor_units,provider_updated_at,captured_at,fx_rate_id,converted_cad_cents) VALUES($1,$2,'external',$3,$4,'JPY',$5,$6,$6,$7,$5)",
            [variant, provider, condition, grade, cents, date, fx],
          );
        await insert(
          raw.variants[0].id,
          "old-source",
          "NM",
          null,
          100,
          "2026-01-01T00:00:00Z",
        );
        await insert(
          raw.variants[0].id,
          "current-source",
          "NM",
          null,
          350,
          "2026-01-02T00:00:00Z",
        );
        await insert(
          raw.variants[0].id,
          "current-source",
          "NM",
          null,
          400,
          "2026-01-03T00:00:00Z",
        );
        await insert(
          raw.variants[0].id,
          "current-source",
          "LP",
          null,
          900,
          "2026-01-04T00:00:00Z",
        );
        const standard = await publicPage(
          "/product/" + raw.slug,
          new URLSearchParams(),
          repo,
        );
        assert.deepEqual(
          standard.prices.map((p) => p.cents),
          [350, 400],
        );
        assert.equal(standard.prices[0].condition, "NM");
        assert.equal(standard.prices[0].providerProductId, "external");
        assert.equal(
          (await repo.search(filters("type=raw_single"))).items.find(
            (r) => r.product.id === raw.id,
          )?.referenceCents,
          400,
        );
        const lp = await publicPage(
          "/product/" + raw.slug,
          new URLSearchParams("condition=LP"),
          repo,
        );
        assert.deepEqual(
          lp.prices.map((p) => p.cents),
          [900],
        );
        await insert(
          graded.variants[0].id,
          "current-source",
          null,
          "9",
          950,
          "2026-01-03T00:00:00Z",
        );
        await insert(
          graded.variants[0].id,
          "current-source",
          null,
          "10",
          1050,
          "2026-01-04T00:00:00Z",
        );
        assert.equal(
          (
            await publicPage(
              "/product/" + graded.slug,
              new URLSearchParams(),
              repo,
            )
          ).prices.length,
          0,
        );
        const grade9 = await publicPage(
          "/product/" + graded.slug,
          new URLSearchParams("grade=9"),
          repo,
        );
        assert.deepEqual(
          grade9.prices.map((p) => p.cents),
          [950],
        );
        assert.equal(grade9.prices[0].grade, "9");
      },
    );
  } finally {
    await db.close();
  }
});
