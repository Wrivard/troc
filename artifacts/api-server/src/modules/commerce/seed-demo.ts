import type { Sql } from "./data";
import { demoCommerce } from "./data";
import { publicDemoCatalog } from "../catalog/public-demo";
/** Explicit operator seed of the approved, committed snapshot. Never runs in HTTP handlers. */
export async function seedCommerceDemo(db: Sql) {
  const data = publicDemoCatalog(),
    commerce = demoCommerce();
  const batch = (
    await db.query<{ id: string }>(
      "INSERT INTO troc.demo_batches(seed_key) VALUES('bounded-commerce-demo-v1') ON CONFLICT(seed_key) DO UPDATE SET seed_key=excluded.seed_key RETURNING id",
    )
  ).rows[0].id;
  for (const g of data.games)
    await db.query(
      "INSERT INTO troc.games(id,slug,name_en,name_fr) VALUES($1,$2,$3,$4) ON CONFLICT(id) DO NOTHING",
      [g.id, g.slug, g.name.en, g.name.fr],
    );
  for (const s of data.sets)
    await db.query(
      "INSERT INTO troc.set_releases(id,game_id,slug,name_en,name_fr) VALUES($1,$2,$3,$4,$5) ON CONFLICT(id) DO NOTHING",
      [s.id, s.gameId, s.slug, s.name.en, s.name.fr],
    );
  for (const s of commerce.sellers) {
    await db.query(
      "INSERT INTO troc.seller_accounts(id,slug,display_name,seller_type,status,level_id,demo_batch_id,reputation_score) VALUES($1,$2,$3,'individual','active',$4,$5,$6) ON CONFLICT(id) DO NOTHING",
      [s.id, s.slug, s.name, s.level, batch, s.reputation],
    );
    await db.query(
      "INSERT INTO troc.seller_settings(seller_id,minimum_order_cents,handling_days,free_shipping_threshold_cents,promotions) VALUES($1,$2,$3,$4,$5) ON CONFLICT(seller_id) DO NOTHING",
      [
        s.id,
        s.minimumCents,
        s.handlingDays,
        s.freeShippingCents,
        JSON.stringify(s.promotions),
      ],
    );
  }
  for (const seller of commerce.sellers)
    for (const badge of seller.badges)
      await db.query(
        "INSERT INTO troc.seller_badge_assignments(seller_id,badge_id) VALUES($1,$2) ON CONFLICT DO NOTHING",
        [seller.id, badge],
      );
  const sources = new Map<string, string>();
  for (const p of data.products) {
    await db.query(
      "INSERT INTO troc.catalog_products(id,game_id,set_id,slug,name_en,name_fr,product_type) VALUES($1,$2,$3,$4,$5,$6,$7) ON CONFLICT(id) DO NOTHING",
      [p.id, p.gameId, p.setId, p.slug, p.name.en, p.name.fr, p.type],
    );
    for (const v of p.variants) {
      await db.query(
        "INSERT INTO troc.printings(id,product_id,language,printing_key,collector_number,rarity,artist) VALUES($1,$2,$3,$4,$5,$6,$7) ON CONFLICT(id) DO NOTHING",
        [
          v.printingId,
          p.id,
          v.language,
          v.printingId,
          v.number,
          v.rarity,
          v.artist,
        ],
      );
      await db.query(
        "INSERT INTO troc.variants(id,printing_id,variant_key,attributes) VALUES($1,$2,$3,$4) ON CONFLICT(id) DO NOTHING",
        [v.id, v.printingId, v.key, JSON.stringify(v.attributes)],
      );
    }
    const scopes = [
      { variantId: null, images: p.images ?? [] },
      ...p.variants.map((v) => ({ variantId: v.id, images: v.images ?? [] })),
    ];
    for (const scope of scopes)
      for (const [position, img] of scope.images.entries()) {
        const source = img.provenance;
        if (!sources.has(source.provider)) {
          const existing = (
            await db.query<{ id: string }>(
              "SELECT id FROM troc.asset_sources WHERE provider=$1 AND license=$2 ORDER BY id LIMIT 1",
              [source.provider, source.license],
            )
          ).rows[0];
          const id =
            existing?.id ??
            (
              await db.query<{ id: string }>(
                "INSERT INTO troc.asset_sources(provider,license,approved_at) VALUES($1,$2,now()) RETURNING id",
                [source.provider, source.license],
              )
            ).rows[0].id;
          sources.set(source.provider, id);
        }
        if (
          (
            await db.query("SELECT id FROM troc.catalog_images WHERE id=$1", [
              img.id,
            ])
          ).rows.length
        )
          continue;
        const provenance = (
          await db.query<{ id: string }>(
            "INSERT INTO troc.asset_provenance(source_id,variant_id,source_url,captured_at,legacy_image) VALUES($1,$2,$3,$4,false) RETURNING id",
            [
              sources.get(source.provider),
              scope.variantId,
              source.sourceUrl,
              source.capturedAt,
            ],
          )
        ).rows[0].id;
        await db.query(
          "INSERT INTO troc.catalog_images(id,product_id,variant_id,provenance_id,external_id,side,position,width,height) VALUES($1,$2,$3,$4,$5,$6,$7,$8,$9)",
          [
            img.id,
            p.id,
            scope.variantId,
            provenance,
            source.externalId,
            img.side,
            position,
            img.width,
            img.height,
          ],
        );
        for (const rendition of img.sources)
          await db.query(
            "INSERT INTO troc.catalog_image_renditions(image_id,width,url) VALUES($1,$2,$3)",
            [img.id, rendition.width, rendition.url],
          );
      }
  }
  for (const l of commerce.listings)
    await db.query(
      "INSERT INTO troc.listings(id,seller_id,variant_id,condition,unit_price_cents,quantity,status,demo_batch_id,grams,thickness_mm,special_listing) VALUES($1,$2,$3,$4,$5,$6,'active',$7,$8,$9,$10) ON CONFLICT(id) DO NOTHING",
      [
        l.id,
        l.sellerId,
        l.variantId,
        l.condition,
        l.cents,
        l.quantity,
        batch,
        l.grams,
        l.thicknessMm,
        l.special,
      ],
    );
  return {
    batchId: batch,
    products: data.products.length,
    listings: commerce.listings.length,
  };
}
