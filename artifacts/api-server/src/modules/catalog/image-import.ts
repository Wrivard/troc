import { randomUUID } from "node:crypto";
import type { ImportImage } from "@workspace/catalog";
import type { CatalogSqlClient } from "./importer";
import { DomainError } from "../shared/domain";

export function validateImages(value: unknown): asserts value is ImportImage[] {
  if (!Array.isArray(value) || value.length > 24)
    throw new DomainError("invalid_images");
  const scopes = new Map<string, number>();
  const identities = new Set<string>();
  const integer = (v: unknown): v is number =>
    typeof v === "number" && Number.isInteger(v) && v > 0 && v <= 12000;
  const https = (value: unknown) => {
    if (typeof value !== "string" || value.length > 2048) return false;
    try {
      const u = new URL(value);
      return u.protocol === "https:" && !u.username && !u.password;
    } catch {
      return false;
    }
  };
  const origins = new Set(
    (process.env.CATALOG_ASSET_ALLOWED_ORIGINS ?? "")
      .split(",")
      .filter(Boolean),
  );
  for (const image of value) {
    if (
      !image ||
      typeof image !== "object" ||
      !["product", "variant"].includes(image.scope) ||
      !["front", "back", "detail"].includes(image.side) ||
      typeof image.externalId !== "string" ||
      !image.externalId ||
      image.externalId.length > 300 ||
      typeof image.license !== "string" ||
      !image.license ||
      image.license.length > 500 ||
      !https(image.sourceUrl) ||
      !integer(image.width) ||
      !integer(image.height) ||
      !Array.isArray(image.sources) ||
      !image.sources.length ||
      image.sources.length > 4
    )
      throw new DomainError("invalid_images");
    const key = image.scope + ":" + image.externalId;
    if (identities.has(key)) throw new DomainError("duplicate_image_identity");
    identities.add(key);
    const count = (scopes.get(image.scope) ?? 0) + 1;
    if (count > 12) throw new DomainError("image_limit");
    scopes.set(image.scope, count);
    const widths = new Set<number>();
    for (const source of image.sources) {
      if (
        !source ||
        !integer(source.width) ||
        source.width > image.width ||
        widths.has(source.width) ||
        typeof source.url !== "string"
      )
        throw new DomainError("invalid_rendition");
      widths.add(source.width);
      const local = /^\/catalog-art\/[a-z0-9-]+\.(webp|avif|png|jpg)$/.test(
        source.url,
      );
      if (
        !local &&
        !(https(source.url) && origins.has(new URL(source.url).origin))
      )
        throw new DomainError("unapproved_asset_origin");
    }
  }
}

/** Called inside the importer's row transaction, after server authorization. */
export async function importImages(
  db: CatalogSqlClient,
  provider: string,
  productId: string,
  variantId: string,
  images: ImportImage[],
  scopes: ("product" | "variant")[] = images.length
    ? [...new Set(images.map((i) => i.scope))]
    : ["variant"],
) {
  const sources = new Map<string, string>();
  for (const image of images) {
    const source = (
      await db.query<{ id: string }>(
        "SELECT id FROM troc.asset_sources WHERE provider=$1 AND license=$2 AND approved_at IS NOT NULL ORDER BY id LIMIT 1",
        [provider, image.license],
      )
    ).rows[0];
    if (!source) throw new DomainError("image_license_unapproved");
    sources.set(image.license, source.id);
  }
  const prior = (
    await db.query<{
      id: string;
      external_id: string;
      variant_id: string | null;
    }>(
      "SELECT i.id,i.external_id,i.variant_id FROM troc.catalog_images i JOIN troc.asset_provenance ap ON ap.id=i.provenance_id JOIN troc.asset_sources s ON s.id=ap.source_id WHERE i.product_id=$1 AND ((i.variant_id=$2 AND $4::boolean) OR (i.variant_id IS NULL AND $5::boolean)) AND s.provider=$3",
      [
        productId,
        variantId,
        provider,
        scopes.includes("variant"),
        scopes.includes("product"),
      ],
    )
  ).rows;
  if (prior.length)
    await db.query("DELETE FROM troc.catalog_images WHERE id=ANY($1::uuid[])", [
      prior.map((i) => i.id),
    ]);
  const positions = { product: 0, variant: 0 };
  for (const image of images) {
    const source = sources.get(image.license)!;
    // Provenance remains bound to the exact printing/variant that supplied it.
    const provenance = (
      await db.query<{ id: string }>(
        "INSERT INTO troc.asset_provenance(source_id,variant_id,source_url,legacy_image) VALUES($1,$2,$3,false) ON CONFLICT(source_id,variant_id,source_url) DO UPDATE SET legacy_image=false RETURNING id",
        [source, variantId, image.sourceUrl],
      )
    ).rows[0].id;
    const scopeVariant = image.scope === "variant" ? variantId : null;
    const id =
      prior.find(
        (p) =>
          p.external_id === image.externalId && p.variant_id === scopeVariant,
      )?.id ?? randomUUID();
    await db.query(
      "INSERT INTO troc.catalog_images(id,product_id,variant_id,provenance_id,external_id,side,position,width,height) VALUES($1,$2,$3,$4,$5,$6,$7,$8,$9)",
      [
        id,
        productId,
        scopeVariant,
        provenance,
        image.externalId,
        image.side,
        positions[image.scope]++,
        image.width,
        image.height,
      ],
    );
    for (const rendition of image.sources)
      await db.query(
        "INSERT INTO troc.catalog_image_renditions(image_id,width,url) VALUES($1,$2,$3)",
        [id, rendition.width, rendition.url],
      );
  }
}
