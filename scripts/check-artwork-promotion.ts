import { PGlite } from "@electric-sql/pglite";
import { pg_trgm } from "@electric-sql/pglite/contrib/pg_trgm";
import { readFile, readdir, writeFile } from "node:fs/promises";
import assert from "node:assert/strict";
import {
  promoteRetainedCatalog,
  retainedRecords,
} from "./catalog/promote-local";
import { promoteRetainedArtwork } from "./catalog/promote-artwork";
process.env.NODE_ENV = "development";
process.env.TROC_LOCAL_ACCOUNTS = "true";
const db = new PGlite({ extensions: { pg_trgm } });
try {
  for (const f of (await readdir("lib/db/migrations"))
    .filter((f) => f.endsWith(".sql"))
    .sort())
    await db.exec(await readFile("lib/db/migrations/" + f, "utf8"));
  await promoteRetainedCatalog(db);
  const first = await promoteRetainedArtwork(db);
  assert.ok(first.images! > 0);
  const before = (
    await db.query(
      "SELECT (SELECT count(*)::int FROM troc.catalog_images) images,(SELECT count(*)::int FROM troc.asset_provenance) provenance,(SELECT count(*)::int FROM troc.catalog_image_renditions) renditions",
    )
  ).rows[0];
  const second = await promoteRetainedArtwork(db);
  assert.equal(second.skipped, true);
  const sample = (
    await db.query<{ id: string; source_url: string; captured_at: string }>(
      "SELECT id,source_url,captured_at::text FROM troc.asset_provenance LIMIT 1",
    )
  ).rows[0];
  await db.query(
    "UPDATE troc.asset_provenance SET source_url='https://example.invalid/stale' WHERE id=$1",
    [sample.id],
  );
  await db.exec("DELETE FROM public.local_artwork_revisions");
  await promoteRetainedArtwork(db);
  const after = (
    await db.query(
      "SELECT (SELECT count(*)::int FROM troc.catalog_images) images,(SELECT count(*)::int FROM troc.asset_provenance) provenance,(SELECT count(*)::int FROM troc.catalog_image_renditions) renditions",
    )
  ).rows[0];
  assert.deepEqual(before, after);
  assert.equal(
    (
      await db.query(
        "SELECT source_url FROM troc.asset_provenance WHERE id=$1",
        [sample.id],
      )
    ).rows[0].source_url,
    sample.source_url,
  );
  const invalid = (
    await db.query(
      "SELECT count(*)::int n FROM troc.catalog_image_renditions r JOIN troc.catalog_images i ON i.id=r.image_id WHERE r.width>i.width OR r.url NOT LIKE '/catalog-art/retained-%'",
    )
  ).rows[0];
  assert.equal(invalid.n, 0);
  process.env.NODE_ENV = "production";
  await assert.rejects(
    () => promoteRetainedArtwork(db),
    /local_artwork_promotion_only/,
  );
  const evidence = {
    revision: retainedRecords().manifest.revision,
    ...before,
    checkpointReplay: true,
    forcedReplayNoDuplicates: true,
    refreshRepairsOwnProvenance: true,
    localOnlyGuard: true,
    localRenditions: true,
  };
  await writeFile(
    "docs/evidence/catalog-scale/artwork-promotion.json",
    JSON.stringify(evidence, null, 2),
  );
  console.log(evidence);
} finally {
  await db.close();
}
