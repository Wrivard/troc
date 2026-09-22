import type { CatalogImage, Product } from "@workspace/catalog";
import type { CatalogSqlClient } from "./importer";
export interface CatalogAssetProvider {
  images(products: Product[]): Promise<Product[]>;
}
/** Resolve approved renditions in a single batch. No arbitrary URL proxy. */
export class PostgresCatalogAssetProvider implements CatalogAssetProvider {
  constructor(private readonly db: CatalogSqlClient) {}
  async images(products: Product[]): Promise<Product[]> {
    if (!products.length) return [];
    if (products.length > 48) throw new Error("asset_batch_too_large");
    const { rows } = await this.db.query<{
      product_id: string;
      variant_id: string | null;
      image: CatalogImage;
    }>(
      `SELECT i.product_id,i.variant_id,jsonb_build_object(
        'id',i.id,'side',i.side,'width',i.width,'height',i.height,
        'url',(SELECT url FROM troc.catalog_image_renditions WHERE image_id=i.id ORDER BY width DESC LIMIT 1),
        'sources',(SELECT jsonb_agg(jsonb_build_object('url',url,'width',width) ORDER BY width) FROM troc.catalog_image_renditions WHERE image_id=i.id),
        'provenance',jsonb_build_object('provider',s.provider,'externalId',i.external_id,'sourceUrl',p.source_url,'license',s.license,'capturedAt',p.captured_at)
      ) AS image FROM troc.catalog_images i
      JOIN troc.asset_provenance p ON p.id=i.provenance_id JOIN troc.asset_sources s ON s.id=p.source_id
      WHERE i.product_id=ANY($1::uuid[]) AND s.approved_at IS NOT NULL
        AND EXISTS(SELECT 1 FROM troc.catalog_image_renditions WHERE image_id=i.id)
        AND (i.variant_id IS NULL OR EXISTS(SELECT 1 FROM troc.variants v JOIN troc.printings pr ON pr.id=v.printing_id WHERE v.id=i.variant_id AND pr.product_id=i.product_id))
      ORDER BY i.position,i.id`,
      [products.map((p) => p.id)],
    );
    return products.map((product) => ({
      ...product,
      imageUrl: null, // Never reuse a cached URL after source approval is revoked.
      images: rows
        .filter((r) => r.product_id === product.id && r.variant_id === null)
        .map((r) => r.image),
      variants: product.variants.map((v) => ({
        ...v,
        images: rows
          .filter((r) => r.product_id === product.id && r.variant_id === v.id)
          .map((r) => r.image),
      })),
    }));
  }
}
