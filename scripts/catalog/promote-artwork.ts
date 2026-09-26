import type { PGlite } from "@electric-sql/pglite";
import { createHash } from "node:crypto";
import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";
import { retainedRecords } from "./promote-local";
import { assertSources, type SourcePolicy } from "./source-policy";
const id = (key: string) => {
  const h = createHash("sha256")
    .update("troc-artwork-v1:" + key)
    .digest("hex");
  return `${h.slice(0, 8)}-${h.slice(8, 12)}-5${h.slice(13, 16)}-8${h.slice(17, 20)}-${h.slice(20, 32)}`;
};
/** Local operator import only. Shares canonical catalogue asset tables; never touches listings. */
export async function promoteRetainedArtwork(db: PGlite) {
  if (
    process.env.TROC_LOCAL_ACCOUNTS !== "true" ||
    process.env.NODE_ENV !== "development"
  )
    throw Error("local_artwork_promotion_only");
  const { records, manifest } = retainedRecords();
  const policy = JSON.parse(
    readFileSync("catalog-data/source-policy.json", "utf8"),
  ) as SourcePolicy;
  assertSources(records, policy, "local", true);
  await db.exec(
    "CREATE TABLE IF NOT EXISTS public.local_artwork_revisions(revision text PRIMARY KEY,images integer NOT NULL,completed_at timestamptz NOT NULL DEFAULT now())",
  );
  if (
    (
      await db.query(
        "SELECT revision FROM public.local_artwork_revisions WHERE revision=$1",
        [manifest.revision],
      )
    ).rows.length
  )
    return { skipped: true, revision: manifest.revision };
  const images = records.flatMap((r: any) =>
    (r.product.images ?? [])
      .filter((image: any) =>
        image.sources?.some((s: any) =>
          s.url.startsWith("/catalog-art/retained-"),
        ),
      )
      .map((image: any, position: number) => ({
        ...image,
        productId: r.product.id,
        provider: r.provider,
        externalId: r.externalId,
        position: image.position ?? position,
      })),
  );
  for (const image of images)
    for (const source of image.sources) {
      if (
        !/^\/catalog-art\/retained-[a-f0-9]{64}-\d+\.webp$/.test(source.url) ||
        !existsSync(
          resolve("artifacts/marketplace/public", source.url.slice(1)),
        )
      )
        throw Error("artwork_file_missing_or_invalid");
    }
  await db.transaction(async (tx) => {
    async function bulk(
      table: string,
      shape: string,
      rows: any[],
      conflict = "ON CONFLICT DO NOTHING",
    ) {
      const names = shape
        .split(",")
        .map((c) => c.trim().split(" ")[0])
        .join(",");
      for (let i = 0; i < rows.length; i += 400)
        await tx.query(
          `INSERT INTO troc.${table}(${names}) SELECT ${names} FROM jsonb_to_recordset($1::jsonb) AS x(${shape}) ${conflict}`,
          [JSON.stringify(rows.slice(i, i + 400))],
        );
    }
    const existing = new Map(
      (
        await tx.query<{
          id: string;
          provenance_id: string;
          product_id: string;
          position: number;
        }>(
          "SELECT id,provenance_id,product_id,position FROM troc.catalog_images WHERE variant_id IS NULL",
        )
      ).rows.map((r) => [r.product_id + ":" + r.position, r] as const),
    );
    const pending = images.filter((image: any) => {
      const prior = existing.get(image.productId + ":" + image.position);
      return (
        !prior ||
        (prior.id === image.id &&
          prior.provenance_id === id("provenance:" + image.id))
      );
    });
    for (const provider of new Set(pending.map((i: any) => String(i.provider))))
      await tx.query(
        "INSERT INTO troc.asset_sources(id,provider,license,approved_at) VALUES($1,$2,$3,now()) ON CONFLICT(id) DO NOTHING",
        [
          id("source:" + provider),
          provider,
          "LOCAL card-reference testing only; full-card publisher rights retained; catalog-data/source-policy.json; no production clearance",
        ],
      );
    await bulk(
      "asset_provenance",
      "id uuid,source_id uuid,source_url text,captured_at timestamptz,legacy_image boolean",
      pending.map((i: any) => ({
        id: id("provenance:" + i.id),
        source_id: id("source:" + i.provider),
        source_url: i.provenance.sourceUrl,
        captured_at: i.provenance.capturedAt,
        legacy_image: false,
      })),
      "ON CONFLICT(id) DO UPDATE SET source_url=excluded.source_url,captured_at=excluded.captured_at WHERE asset_provenance.source_id=excluded.source_id AND asset_provenance.variant_id IS NULL AND asset_provenance.legacy_image=false",
    );
    await bulk(
      "catalog_images",
      "id uuid,product_id uuid,provenance_id uuid,external_id text,side text,position smallint,width integer,height integer",
      pending.map((i: any) => ({
        id: i.id,
        product_id: i.productId,
        provenance_id: id("provenance:" + i.id),
        external_id: i.externalId + ":" + i.side,
        side: i.side,
        position: i.position,
        width: i.width,
        height: i.height,
      })),
      "ON CONFLICT(id) DO UPDATE SET width=excluded.width,height=excluded.height WHERE catalog_images.product_id=excluded.product_id AND catalog_images.provenance_id=excluded.provenance_id AND catalog_images.variant_id IS NULL",
    );
    for (let offset = 0; offset < pending.length; offset += 400)
      await tx.query(
        "DELETE FROM troc.catalog_image_renditions WHERE image_id=ANY($1::uuid[])",
        [pending.slice(offset, offset + 400).map((i: any) => i.id)],
      );
    await bulk(
      "catalog_image_renditions",
      "image_id uuid,width integer,url text",
      pending.flatMap((i: any) =>
        i.sources.map((s: any) => ({
          image_id: i.id,
          width: s.width,
          url: s.url,
        })),
      ),
    );
    await tx.query(
      "INSERT INTO public.local_artwork_revisions(revision,images) VALUES($1,$2)",
      [manifest.revision, pending.length],
    );
  });
  return { revision: manifest.revision, images: images.length, skipped: false };
}
