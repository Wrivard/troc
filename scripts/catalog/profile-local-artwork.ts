import type { PGlite } from "@electric-sql/pglite";
import { writeFileSync, readFileSync } from "node:fs";
import { strict as assert } from "node:assert";
import { CATALOG_IMAGES_SQL } from "../../artifacts/api-server/src/modules/catalog/assets";
import { PostgresCatalogRepository } from "../../artifacts/api-server/src/modules/catalog/repository";
import { filtersFrom } from "../../artifacts/api-server/src/modules/catalog/search";
export async function profileLocalArtwork(db: PGlite) {
  if (
    process.env.TROC_LOCAL_ACCOUNTS !== "true" ||
    process.env.NODE_ENV !== "development"
  )
    throw Error("local_profile_only");
  const repo = new PostgresCatalogRepository(db);
  const results = [];
  for (const limit of [12, 248]) {
    const page = await repo.search(
      filtersFrom(new URLSearchParams({ limit: String(limit), sort: "name" })),
    );
    const ids = page.items.map((i) => i.product.id);
    const before = await db.query(
      readFileSync(
        "docs/evidence/performance/artwork-query-before.sql",
        "utf8",
      ),
      [ids],
    );
    const after = await db.query(CATALOG_IMAGES_SQL, [ids]);
    assert.deepEqual(after.rows, before.rows);
    const plan = await db.query(
      "EXPLAIN (ANALYZE, BUFFERS, FORMAT JSON) " + CATALOG_IMAGES_SQL,
      [page.items.map((i) => i.product.id)],
    );
    results.push({ limit, exactResponseParity: true, plan: plan.rows });
  }
  writeFileSync(
    "docs/evidence/performance/artwork-query-plan.json",
    JSON.stringify(results, null, 2),
  );
  console.log("Local artwork query plans recorded");
}
