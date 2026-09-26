import type { PGlite } from "@electric-sql/pglite";
import { createHash } from "node:crypto";
import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";
/** Append generated local renditions only to images already referencing the exact source. */
export async function promoteLocalThumbnails(db: PGlite, width: 96 | 360 = 360) {
  if (
    process.env.TROC_LOCAL_ACCOUNTS !== "true" ||
    process.env.NODE_ENV !== "development"
  )
    throw Error("local_thumbnails_only");
  const file = width === 360 ? "catalog-data/thumbnail-renditions.json" : "catalog-data/thumbnail-renditions-96.json";
  if (!existsSync(file)) return { skipped: true, reason: "not-built" };
  const { revision, renditions } = JSON.parse(readFileSync(file, "utf8"));
  if (
    createHash("sha256").update(JSON.stringify(renditions)).digest("hex") !==
    revision
  )
    throw Error("thumbnail_manifest_checksum");
  for (const r of renditions)
    if (
      r.width !== width ||
      !r.url.endsWith("-" + width + ".webp") ||
      !/^\/catalog-art\/(?:retained-)?[a-f0-9]+-\d+\.webp$/.test(r.sourceUrl) ||
      !/^\/catalog-art\/retained-[a-f0-9]{64}-(?:96|360)\.webp$/.test(r.url) ||
      !existsSync(resolve("artifacts/marketplace/public", r.url.slice(1)))
    )
      throw Error("invalid_thumbnail");
  await db.exec(
    "CREATE TABLE IF NOT EXISTS public.local_thumbnail_revisions(revision text PRIMARY KEY, completed_at timestamptz NOT NULL DEFAULT now())",
  );
  if (
    (
      await db.query(
        "SELECT 1 FROM public.local_thumbnail_revisions WHERE revision=$1",
        [revision],
      )
    ).rows.length
  )
    return { skipped: true, revision };
  await db.transaction(async (tx) => {
    for (let i = 0; i < renditions.length; i += 400)
      await tx.query(
        `INSERT INTO troc.catalog_image_renditions(image_id,width,url) SELECT DISTINCT original.image_id,${width},r.url FROM jsonb_to_recordset($1::jsonb) AS r("sourceUrl" text,url text) JOIN troc.catalog_image_renditions original ON original.url=r."sourceUrl" AND original.width>${width} ON CONFLICT(image_id,width) DO NOTHING`,
        [JSON.stringify(renditions.slice(i, i + 400))],
      );
    await tx.query(
      "INSERT INTO public.local_thumbnail_revisions(revision) VALUES($1)",
      [revision],
    );
  });
  return { revision, renditions: renditions.length, skipped: false };
}
