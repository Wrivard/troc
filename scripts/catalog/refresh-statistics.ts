import type { PGlite } from "@electric-sql/pglite";
import { existsSync, readFileSync } from "node:fs";
import { createHash } from "node:crypto";
/** Refresh optimizer statistics after a completed local bulk catalogue/artwork import. */
export async function refreshLocalCatalogStatistics(db: PGlite) {
  if (
    process.env.TROC_LOCAL_ACCOUNTS !== "true" ||
    process.env.NODE_ENV !== "development"
  )
    throw Error("local_statistics_only");
  const catalogue = JSON.parse(
    readFileSync("catalog-data/current.json", "utf8"),
  ).revision;
  const thumbnails = existsSync("catalog-data/thumbnail-renditions.json")
    ? JSON.parse(readFileSync("catalog-data/thumbnail-renditions.json", "utf8"))
        .revision
    : "";
  const revision = createHash("sha256")
    .update("v1:" + catalogue + ":" + thumbnails)
    .digest("hex");
  await db.exec(
    "CREATE TABLE IF NOT EXISTS public.local_catalogue_statistics(revision text PRIMARY KEY,completed_at timestamptz NOT NULL DEFAULT now())",
  );
  if (
    (
      await db.query(
        "SELECT 1 FROM public.local_catalogue_statistics WHERE revision=$1",
        [revision],
      )
    ).rows.length
  )
    return { revision, skipped: true };
  await db.exec(
    "ANALYZE troc.catalog_images, troc.catalog_image_renditions, troc.asset_provenance, troc.asset_sources, troc.catalog_products, troc.catalog_documents, troc.printings, troc.variants, troc.set_releases, troc.listings",
  );
  await db.query(
    "INSERT INTO public.local_catalogue_statistics(revision) VALUES($1) ON CONFLICT DO NOTHING",
    [revision],
  );
  return { revision, skipped: false };
}
