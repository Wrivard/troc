import type { CatalogImage, Product } from "@workspace/catalog";
import type { CatalogSqlClient } from "./importer";
export interface CatalogAssetProvider {
  images(products: Product[]): Promise<Product[]>;
}
/** Resolve approved renditions in a single batch. No arbitrary URL proxy. */
export class PostgresCatalogAssetProvider implements CatalogAssetProvider {
  constructor(private readonly db: CatalogSqlClient) {}
  async thumbnails(variantIds: string[]): Promise<Map<string, string>> {
    const result = await this.db.query<{ variant_id: string; url: string }>(
      `SELECT DISTINCT ON (v.id) v.id AS variant_id,r.url FROM troc.variants v JOIN troc.printings pr ON pr.id=v.printing_id JOIN troc.catalog_images i ON i.product_id=pr.product_id AND (i.variant_id=v.id OR i.variant_id IS NULL) JOIN troc.asset_provenance ap ON ap.id=i.provenance_id JOIN troc.asset_sources s ON s.id=ap.source_id JOIN troc.catalog_image_renditions r ON r.image_id=i.id WHERE v.id=ANY($1::uuid[]) AND s.approved_at IS NOT NULL AND i.side='front' ORDER BY v.id,(i.variant_id IS NOT NULL) DESC,i.position,r.width`,
      [variantIds],
    );
    return new Map(result.rows.map((r) => [r.variant_id, r.url]));
  }
  async images(products: Product[]): Promise<Product[]> {
    if (!products.length) return [];
    if (products.length > 48) throw new Error("asset_batch_too_large");
    const { rows } = await this.db.query<{
      product_id: string;
      variant_id: string | null;
      image: CatalogImage;
    }>(
      `WITH approved AS (SELECT i.product_id,i.variant_id,i.position,jsonb_build_object(
        'id',i.id,'side',i.side,'width',i.width,'height',i.height,
        'url',(SELECT url FROM troc.catalog_image_renditions WHERE image_id=i.id ORDER BY width DESC LIMIT 1),
        'sources',(SELECT jsonb_agg(jsonb_build_object('url',url,'width',width) ORDER BY width) FROM troc.catalog_image_renditions WHERE image_id=i.id),
        'provenance',jsonb_build_object('provider',s.provider,'externalId',i.external_id,'sourceUrl',p.source_url,'license',s.license,'capturedAt',p.captured_at)
      ) AS image FROM troc.catalog_images i
      JOIN troc.asset_provenance p ON p.id=i.provenance_id JOIN troc.asset_sources s ON s.id=p.source_id
      WHERE i.product_id=ANY($1::uuid[]) AND s.approved_at IS NOT NULL
        AND EXISTS(SELECT 1 FROM troc.catalog_image_renditions WHERE image_id=i.id)
        AND (i.variant_id IS NULL OR EXISTS(SELECT 1 FROM troc.variants v JOIN troc.printings pr ON pr.id=v.printing_id WHERE v.id=i.variant_id AND pr.product_id=i.product_id))
        AND (p.variant_id IS NULL OR p.variant_id=i.variant_id OR (i.variant_id IS NULL AND EXISTS(SELECT 1 FROM troc.variants pv JOIN troc.printings pp ON pp.id=pv.printing_id WHERE pv.id=p.variant_id AND pp.product_id=i.product_id))))
      SELECT product_id,variant_id,image FROM (
        SELECT * FROM approved
        UNION ALL
        SELECT legacy.product_id,legacy.variant_id,0 AS position,jsonb_build_object('id',legacy.id,'side','front','url',legacy.source_url,'sources','[]'::jsonb,'provenance',jsonb_build_object('provider',legacy.provider,'externalId',legacy.id,'sourceUrl',legacy.source_url,'license',legacy.license,'capturedAt',legacy.captured_at)) AS image
        FROM (SELECT DISTINCT ON (ap.variant_id) ap.*,pr.product_id,s.provider,s.license
          FROM troc.asset_provenance ap JOIN troc.asset_sources s ON s.id=ap.source_id JOIN troc.variants v ON v.id=ap.variant_id JOIN troc.printings pr ON pr.id=v.printing_id
          WHERE pr.product_id=ANY($1::uuid[]) AND s.approved_at IS NOT NULL AND ap.legacy_image=true
            AND NOT EXISTS(SELECT 1 FROM troc.catalog_images ci WHERE ci.variant_id=ap.variant_id OR (ci.product_id=pr.product_id AND ci.variant_id IS NULL))
          ORDER BY ap.variant_id,ap.captured_at DESC,ap.id) legacy
      ) images ORDER BY product_id,variant_id,position`,
      [products.map((p) => p.id)],
    );
    const byScope = new Map<string, CatalogImage[]>();
    for (const row of rows) {
      const key = row.product_id + ":" + (row.variant_id ?? "shared");
      const values = byScope.get(key) ?? [];
      values.push(row.image);
      byScope.set(key, values);
    }
    return products.map((product) => ({
      ...product,
      imageUrl: null, // Never reuse a cached URL after source approval is revoked.
      images: byScope.get(product.id + ":shared") ?? [],
      variants: product.variants.map((v) => ({
        ...v,
        images: byScope.get(product.id + ":" + v.id) ?? [],
      })),
    }));
  }
}
