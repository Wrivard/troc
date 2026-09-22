import type { CommerceListing, CommerceSeller } from "@workspace/commerce";
import type { CatalogSqlClient } from "../catalog/importer";
import { publicDemoCatalog } from "../catalog/public-demo";
import { PostgresCatalogAssetProvider } from "../catalog/assets";
export type Sql = CatalogSqlClient;
export const defaultPromotions = [
  { id: "cards-5", minimumCards: 5, basisPoints: 500 },
  { id: "cards-10", minimumCards: 10, basisPoints: 1000 },
  { id: "cards-20", minimumCards: 20, basisPoints: 1500 },
];
export function demoCommerce(): {
  listings: CommerceListing[];
  sellers: CommerceSeller[];
} {
  const data = publicDemoCatalog();
  const products = new Map(
    data.products.flatMap((p) =>
      p.variants.map((v) => [v.id, { p, v }] as const),
    ),
  );
  return {
    sellers: data.sellers.map((s, i) => ({
      id: s.id,
      name: s.name,
      slug: s.slug,
      active: true,
      country: "CA",
      level: s.level,
      minimumCents: s.minimumCents,
      handlingDays: s.handlingDays,
      reputation: 95 + i,
      badges: s.verifiedShop ? ["verified_hobby_shop"] : [],
      freeShippingCents: i === 0 ? 2500 : null,
      promotions: defaultPromotions,
    })),
    listings: data.offers.map((o) => {
      const { p, v } = products.get(o.variantId)!;
      return {
        id: o.id,
        sellerId: o.sellerId,
        productId: p.id,
        printingId: v.printingId,
        variantId: v.id,
        language: v.language,
        condition: o.condition,
        productType: p.type,
        name: p.name,
        slug: p.slug,
        setId: p.setId,
        setSlug: data.sets.find((s) => s.id === p.setId)!.slug,
        special: !!o.grade || o.photos.length > 0,
        imageUrl: v.images?.[0]?.url ?? p.images?.[0]?.url ?? p.imageUrl,
        cents: o.cents,
        saleCents: null,
        quantity: o.quantity,
        active: true,
        grams: p.type === "raw_single" ? 2 : 300,
        thicknessMm: p.type === "raw_single" ? 0.3 : 40,
        promoted: false,
        demo: true,
      };
    }),
  };
}
const listingColumns = `l.id,l.seller_id AS "sellerId",p.id AS "productId",pr.id AS "printingId",v.id AS "variantId",pr.language,l.condition,p.product_type AS "productType",jsonb_build_object('en',p.name_en,'fr',p.name_fr) AS name,p.slug,p.set_id AS "setId",(SELECT slug FROM troc.set_releases WHERE id=p.set_id) AS "setSlug",(l.special_listing OR l.grade IS NOT NULL OR EXISTS(SELECT 1 FROM troc.listing_photos ph WHERE ph.listing_id=l.id)) AS special,NULL::text AS "imageUrl",l.unit_price_cents AS cents,l.sale_cents AS "saleCents",(l.quantity-COALESCE((SELECT sum(r.quantity) FROM troc.inventory_reservations r WHERE r.listing_id=l.id AND r.state='reserved' AND r.expires_at>now()),0))::integer AS quantity,(l.status='active') AS active,l.grams,l.thickness_mm::float AS "thicknessMm",l.promoted_attributable AS promoted,(l.demo_batch_id IS NOT NULL) AS demo`;
const joins = `FROM troc.listings l JOIN troc.variants v ON v.id=l.variant_id JOIN troc.printings pr ON pr.id=v.printing_id JOIN troc.catalog_products p ON p.id=pr.product_id`;
export async function loadCommerce(db: Sql, ids: string[], candidates = false) {
  const listings = (
    await db.query<CommerceListing>(
      candidates
        ? `WITH requested AS (SELECT DISTINCT variant_id FROM troc.listings WHERE id=ANY($1::uuid[])), candidates AS (SELECT candidate.* FROM requested r CROSS JOIN LATERAL (SELECT ${listingColumns} ${joins} JOIN troc.seller_accounts s ON s.id=l.seller_id WHERE l.variant_id=r.variant_id AND l.status='active' AND l.quantity>0 AND s.status='active' AND s.country='CA' ORDER BY COALESCE(l.sale_cents,l.unit_price_cents),l.id LIMIT 32) candidate) SELECT * FROM candidates UNION SELECT ${listingColumns} ${joins} WHERE l.id=ANY($1::uuid[])`
        : `SELECT ${listingColumns} ${joins} WHERE l.id=ANY($1::uuid[])`,
      [ids],
    )
  ).rows;
  const sellerIds = [...new Set(listings.map((l) => l.sellerId))];
  const sellers = (
    await db.query<CommerceSeller>(
      `SELECT s.id,s.display_name AS name,s.slug,(s.status='active') AS active,s.country,s.level_id AS level,COALESCE(st.minimum_order_cents,0) AS "minimumCents",COALESCE(st.handling_days,2) AS "handlingDays",s.reputation_score AS reputation,ARRAY(SELECT badge_id FROM troc.seller_badge_assignments WHERE seller_id=s.id) AS badges,st.free_shipping_threshold_cents AS "freeShippingCents",COALESCE(st.promotions,'[]') AS promotions FROM troc.seller_accounts s LEFT JOIN troc.seller_settings st ON st.seller_id=s.id WHERE s.id=ANY($1::uuid[])`,
      [sellerIds],
    )
  ).rows;
  const thumbnails = await new PostgresCatalogAssetProvider(db).thumbnails([
    ...new Set(listings.map((l) => l.variantId)),
  ]);
  for (const listing of listings)
    listing.imageUrl = thumbnails.get(listing.variantId) ?? null;
  return { listings, sellers };
}
