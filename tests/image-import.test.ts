import { test } from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { PGlite } from "@electric-sql/pglite";
import { pg_trgm } from "@electric-sql/pglite/contrib/pg_trgm";
import type { ImportImage } from "@workspace/catalog";
import { DemoCatalogProvider } from "../artifacts/api-server/src/modules/catalog/demo";
import {
  runImport,
  type CatalogSqlClient,
} from "../artifacts/api-server/src/modules/catalog/importer";
import { validateImages } from "../artifacts/api-server/src/modules/catalog/image-import";
import { PostgresCatalogRepository } from "../artifacts/api-server/src/modules/catalog/repository";
import { filtersFrom } from "../artifacts/api-server/src/modules/catalog/search";

const front: ImportImage = {
  externalId: "provider-front",
  side: "front",
  scope: "variant",
  sourceUrl: "https://example.invalid/card/front",
  license: "approved-test",
  width: 600,
  height: 825,
  sources: [
    { url: "/catalog-art/test-245.webp", width: 245 },
    { url: "/catalog-art/test-600.webp", width: 600 },
  ],
};
test("image manifests reject unsafe URLs, duplicate identities and oversized renditions", () => {
  validateImages([front]);
  for (const images of [
    [front, front],
    [{ ...front, sourceUrl: "javascript:alert(1)" }],
    [
      {
        ...front,
        sources: [{ url: "https://unapproved.invalid/card.webp", width: 600 }],
      },
    ],
    [
      {
        ...front,
        sources: [{ url: "/catalog-art/../secret.webp", width: 600 }],
      },
    ],
    [{ ...front, sources: [{ url: "/catalog-art/card.webp", width: 601 }] }],
  ])
    assert.throws(() => validateImages(images));
});

test("approved manifest import is atomic, idempotent, removable and provenance-safe", async () => {
  const db = new PGlite({ extensions: { pg_trgm } });
  const sql: CatalogSqlClient = {
    query: async (text, values) => db.query(text, values),
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
          new URL("../lib/db/migrations/" + name + ".sql", import.meta.url),
          "utf8",
        ),
      );
    const actor = {
      userId: "12345678-1234-4234-8234-123456789012",
      roles: ["catalog_moderator" as const],
      memberships: [],
    };
    await db.query(
      "INSERT INTO troc.users(id,email) VALUES($1,'image-test@example.invalid')",
      [actor.userId],
    );
    await db.exec(
      "UPDATE troc.catalog_providers SET images_approved=true WHERE id='troc-fixture'; INSERT INTO troc.asset_sources(provider,license,approved_at) VALUES('troc-fixture','approved-test',now())",
    );
    const base = (await new DemoCatalogProvider().records({ limit: 1 }))
      .items[0];
    const back = {
      ...front,
      externalId: "provider-back",
      side: "back" as const,
      sourceUrl: "https://example.invalid/card/back",
    };
    const provider = (
      images: ImportImage[],
      imageScopes?: ("product" | "variant")[],
    ) => ({
      id: "troc-fixture",
      records: async () => ({ items: [{ ...base, images, imageScopes }] }),
    });
    assert.equal(
      (await runImport(sql, provider([front, back]), actor, "first")).succeeded,
      1,
    );
    const before = (
      await db.query<{ id: string }>(
        "SELECT id FROM troc.catalog_images ORDER BY external_id",
      )
    ).rows;
    assert.equal(before.length, 2);
    assert.ok(
      before.every(
        (x) => x.id !== front.externalId && x.id !== back.externalId,
      ),
    );
    await runImport(sql, provider([back, front]), actor, "repeat");
    assert.deepEqual(
      (
        await db.query(
          "SELECT id FROM troc.catalog_images ORDER BY external_id",
        )
      ).rows,
      before,
    );
    const repo = new PostgresCatalogRepository(sql);
    const product = (await repo.search(filtersFrom(new URLSearchParams())))
      .items[0].product;
    const [resolved] = await repo.images([product]);
    assert.deepEqual(
      resolved.variants[0].images?.map((i) => i.side),
      ["back", "front"],
    );
    assert.deepEqual(
      resolved.variants[0].images?.[0].sources.map((s) => s.width),
      [245, 600],
    );
    assert.equal(
      (
        await runImport(
          sql,
          provider([{ ...front, license: "unapproved" }]),
          actor,
          "bad",
        )
      ).failed,
      1,
    );
    assert.deepEqual(
      (
        await db.query(
          "SELECT id FROM troc.catalog_images ORDER BY external_id",
        )
      ).rows,
      before,
    );
    // A provenance record tied to this variant cannot be rebound or used for another product.
    const provenance = (
      await db.query<{ id: string }>(
        "SELECT provenance_id AS id FROM troc.catalog_images LIMIT 1",
      )
    ).rows[0].id;
    await assert.rejects(
      db.query("UPDATE troc.asset_provenance SET variant_id=NULL WHERE id=$1", [
        provenance,
      ]),
      /image_provenance_identity_immutable/,
    );
    const other = (
      await db.query<{ id: string }>(
        "INSERT INTO troc.catalog_products(game_id,set_id,slug,name_en,name_fr,product_type) SELECT game_id,set_id,'other-image-product','Other','Autre',product_type FROM troc.catalog_products LIMIT 1 RETURNING id",
      )
    ).rows[0].id;
    await assert.rejects(
      db.query(
        "INSERT INTO troc.catalog_images(product_id,provenance_id,external_id,side,width,height) VALUES($1,$2,'mismatch','front',600,825)",
        [other, provenance],
      ),
      /image_provenance_mismatch/,
    );
    await runImport(
      sql,
      provider([{ ...front, scope: "product" }, back]),
      actor,
      "shared",
    );
    const japanese = {
      ...base,
      externalId: base.externalId + "-ja",
      printing: { ...base.printing, language: "ja" as const },
      images: [front],
    };
    await runImport(
      sql,
      { id: "troc-fixture", records: async () => ({ items: [japanese] }) },
      actor,
      "japanese",
    );
    assert.equal(
      (await repo.images([product]))[0].images?.length,
      1,
      "variant-only import must retain shared art",
    );
    await runImport(sql, provider([]), actor, "clear-variant");
    assert.equal(
      (await repo.images([product]))[0].images?.length,
      1,
      "empty variant manifest must retain shared art",
    );
    await runImport(sql, provider([], ["product", "variant"]), actor, "remove");
    assert.equal(
      (await repo.images([product]))[0].variants[0].images?.length,
      0,
    );
    // Previous API contracts still render approved legacy art after the new migration.
    const legacy = {
      id: "troc-fixture",
      records: async () => ({
        items: [
          {
            ...base,
            image: {
              url: "https://example.invalid/legacy.png",
              license: "approved-test",
            },
          },
        ],
      }),
    };
    assert.equal((await runImport(sql, legacy, actor, "legacy")).succeeded, 1);
    assert.equal(
      (await repo.images([product]))[0].variants[0].images?.[0].url,
      "https://example.invalid/legacy.png",
    );
    await db.exec("UPDATE troc.asset_sources SET approved_at=NULL");
    assert.equal(
      (await repo.images([product]))[0].variants[0].images?.length,
      0,
    );
  } finally {
    await db.close();
  }
});
