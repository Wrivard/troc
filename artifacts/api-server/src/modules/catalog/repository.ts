import { pool } from "@workspace/db";
import type {
  Game,
  SetRelease,
  CatalogSnapshot,
  Product,
  ProductResult,
  SearchFilters,
  Seller,
  Offer,
  PricePoint,
} from "@workspace/catalog";
import { demoCatalog } from "./demo";
import { searchSnapshot, summarize } from "./search";
import { DomainError } from "../shared/domain";
import type { CatalogSqlClient } from "./importer";
export interface CatalogRepository {
  readonly demo: boolean;
  metadata(
    filters: SearchFilters,
  ): Promise<Pick<CatalogSnapshot, "games" | "sets" | "sellers">>;
  search(
    filters: SearchFilters,
  ): Promise<{ items: ProductResult[]; nextCursor: string | null }>;
  product(slug: string): Promise<Product | null>;
  detail(
    product: Product,
    variantId: string,
  ): Promise<{
    offers: Offer[];
    prices: PricePoint[];
    sellers: Seller[];
    summary: ProductResult;
  }>;
  sitemap(cursor: string): Promise<{ path: string; cursor: string }[]>;
  sitemapCursors(): Promise<string[]>;
}
export class DemoCatalogRepository implements CatalogRepository {
  readonly demo = true;
  private data = demoCatalog();
  async metadata() {
    return {
      games: this.data.games,
      sets: this.data.sets,
      sellers: this.data.sellers,
    };
  }
  async search(filters: SearchFilters) {
    return searchSnapshot(this.data, filters);
  }
  async product(slug: string) {
    return this.data.products.find((p) => p.slug === slug) ?? null;
  }
  async detail(product: Product, variantId: string) {
    const offers = this.data.offers
      .filter((o) => o.variantId === variantId && o.quantity > 0)
      .sort((a, b) => a.cents - b.cents || a.id.localeCompare(b.id));
    const prices = this.data.prices.filter((p) => p.variantId === variantId);
    return {
      offers,
      prices,
      sellers: this.data.sellers,
      summary: summarize(product, offers, prices),
    };
  }
  async sitemap(cursor: string) {
    return this.data.products
      .filter((p) => !cursor || p.id > cursor)
      .slice(0, 1000)
      .map((p) => ({ path: `/product/${p.slug}`, cursor: p.id }));
  }
  async sitemapCursors() {
    return [""];
  }
}
const sitemapSql = `WITH urls AS (
 SELECT 'product:'||p.id AS cursor,'/product/'||p.slug AS path FROM troc.catalog_products p JOIN troc.catalog_documents d ON d.product_id=p.id WHERE COALESCE((d.document->>'demo')::boolean,false)=false
 UNION ALL SELECT 'game:'||g.id,'/games/'||g.slug FROM troc.games g WHERE EXISTS(SELECT 1 FROM troc.catalog_products p JOIN troc.catalog_documents d ON d.product_id=p.id WHERE p.game_id=g.id AND COALESCE((d.document->>'demo')::boolean,false)=false)
 UNION ALL SELECT 'set:'||s.id,'/sets/'||s.slug FROM troc.set_releases s WHERE EXISTS(SELECT 1 FROM troc.catalog_products p JOIN troc.catalog_documents d ON d.product_id=p.id WHERE p.set_id=s.id AND COALESCE((d.document->>'demo')::boolean,false)=false)
 UNION ALL SELECT 'store:'||s.id,'/store/'||s.slug FROM troc.seller_accounts s WHERE s.status='active' AND s.country='CA' AND s.demo_batch_id IS NULL
 )`;
const sellerSql = `SELECT s.id,s.slug,s.display_name AS name,COALESCE(p.city,'') AS city,COALESCE(p.province,'') AS province,
 jsonb_build_object('en',COALESCE(p.story_en,''),'fr',COALESCE(p.story_fr,'')) AS story,s.level_id AS level,
 COALESCE(st.minimum_order_cents,0) AS "minimumCents",COALESCE(st.handling_days,2) AS "handlingDays",(s.demo_batch_id IS NOT NULL) AS demo,
 p.logo_url AS "logoUrl",p.banner_url AS "bannerUrl",EXISTS(SELECT 1 FROM troc.seller_badge_assignments b WHERE b.seller_id=s.id AND b.badge_id='verified_hobby_shop') AS "verifiedShop"
 FROM troc.seller_accounts s LEFT JOIN troc.seller_public_profiles p ON p.seller_id=s.id LEFT JOIN troc.seller_settings st ON st.seller_id=s.id WHERE s.status='active' AND s.country='CA'`;
const offerSql = `SELECT l.id,l.variant_id AS "variantId",l.seller_id AS "sellerId",l.condition,l.unit_price_cents AS cents,l.quantity,l.grade,
 COALESCE((SELECT jsonb_agg(ph.storage_key ORDER BY ph.position) FROM troc.listing_photos ph WHERE ph.listing_id=l.id),'[]') AS photos,(l.demo_batch_id IS NOT NULL) AS demo
 FROM troc.listings l JOIN troc.seller_accounts s ON s.id=l.seller_id WHERE l.status='active' AND l.quantity>0 AND s.status='active' AND s.country='CA'`;
const priceSql = `SELECT r.variant_id AS "variantId",r.converted_cad_cents::integer AS cents,r.captured_at::text AS "capturedAt",r.provider,r.source_currency AS "sourceCurrency",r.source_price_minor_units::integer AS "sourceMinorUnits",f.rate::text AS "fxRate",f.rate_date::text AS "fxDate",r.provider_updated_at::text AS "providerUpdatedAt",(r.demo_batch_id IS NOT NULL) AS demo FROM troc.reference_prices r JOIN troc.fx_rates f ON f.id=r.fx_rate_id`;
export class PostgresCatalogRepository implements CatalogRepository {
  constructor(private readonly db: CatalogSqlClient = pool) {}
  readonly demo = false;
  async metadata(f: SearchFilters) {
    const [games, sets, sellers] = await Promise.all([
      this.db.query<Game>(
        `SELECT id,slug,jsonb_build_object('en',name_en,'fr',name_fr) AS name FROM troc.games ORDER BY slug LIMIT 50`,
      ),
      this.db.query<SetRelease>(
        `SELECT s.id,s.game_id AS "gameId",s.slug,jsonb_build_object('en',s.name_en,'fr',s.name_fr) AS name,s.released_on::text AS "releasedOn" FROM troc.set_releases s JOIN troc.games g ON g.id=s.game_id WHERE ($1='' OR g.slug=$1) ORDER BY (s.slug=$2) DESC,s.released_on DESC NULLS LAST,s.id LIMIT 100`,
        [f.game, f.set],
      ),
      this.db.query<Seller>(
        `${sellerSql} ORDER BY (s.slug=$1) DESC,s.id LIMIT 24`,
        [f.seller],
      ),
    ]);
    return { games: games.rows, sets: sets.rows, sellers: sellers.rows };
  }
  async product(slug: string) {
    return (
      (
        await this.db.query<{ document: Product }>(
          `SELECT d.document FROM troc.catalog_documents d JOIN troc.catalog_products p ON p.id=d.product_id WHERE p.slug=$1`,
          [slug],
        )
      ).rows[0]?.document ?? null
    );
  }
  async search(f: SearchFilters) {
    // One SQL statement; indexed matching + stable keyset pagination. No per-result fetches.
    const values: unknown[] = [
      f.q,
      f.game,
      f.set,
      f.type,
      f.language,
      f.variant,
      f.rarity,
      f.condition,
      f.seller,
      f.min,
      f.max,
    ];
    const order =
      f.sort === "price"
        ? "COALESCE(lowest,2147483647)"
        : f.sort === "newest"
          ? "COALESCE(released_on::text,'')"
          : "name_en";
    const direction = f.sort === "newest" ? "DESC" : "ASC";
    const op = direction === "DESC" ? "<" : ">";
    let cursor: { value: string | number; id: string } | null = null;
    if (f.cursor) {
      try {
        cursor = JSON.parse(Buffer.from(f.cursor, "base64url").toString());
        if (
          !cursor ||
          typeof cursor.id !== "string" ||
          !/^[0-9a-f-]{36}$/.test(cursor.id) ||
          !["string", "number"].includes(typeof cursor.value)
        )
          throw new Error();
      } catch {
        throw new DomainError("invalid_cursor");
      }
    }
    values.push(cursor?.value ?? null, cursor?.id ?? null, f.limit + 1);
    const result = await this.db.query<{
      id: string;
      document: Product;
      lowest: number | null;
      median: number | null;
      reference: number | null;
      quantity: number;
      sellers: number;
      sort_value: string | number;
    }>(
      `WITH matched AS (
      SELECT p.id,p.name_en,s.released_on,d.document,
      a.lowest,a.median,a.quantity,a.sellers,
      (SELECT r.converted_cad_cents::integer FROM troc.reference_prices r JOIN troc.variants rv ON rv.id=r.variant_id JOIN troc.printings rp ON rp.id=rv.printing_id WHERE rp.product_id=p.id AND ($5='' OR rp.language=$5) AND ($6='' OR rv.variant_key=$6) ORDER BY r.captured_at DESC,r.id LIMIT 1) AS reference
      FROM troc.catalog_products p JOIN troc.catalog_documents d ON d.product_id=p.id JOIN troc.games g ON g.id=p.game_id JOIN troc.set_releases s ON s.id=p.set_id
      CROSS JOIN LATERAL (
        SELECT min(l.unit_price_cents) AS lowest,round(percentile_cont(0.5) WITHIN GROUP(ORDER BY l.unit_price_cents))::integer AS median,COALESCE(sum(l.quantity),0)::integer AS quantity,count(DISTINCT l.seller_id)::integer AS sellers
        FROM troc.listings l JOIN troc.variants v ON v.id=l.variant_id JOIN troc.printings pr ON pr.id=v.printing_id JOIN troc.seller_accounts sa ON sa.id=l.seller_id
        WHERE pr.product_id=p.id AND l.status='active' AND l.quantity>0 AND sa.status='active' AND sa.country='CA'
        AND ($5='' OR pr.language=$5) AND ($6='' OR v.variant_key=$6) AND ($7='' OR pr.rarity=$7) AND ($8='' OR l.condition=$8) AND ($9='' OR sa.slug=$9)
        AND ($10::integer IS NULL OR l.unit_price_cents>=$10) AND ($11::integer IS NULL OR l.unit_price_cents<=$11)
      ) a
      WHERE ($1='' OR d.search_text ILIKE '%'||$1||'%' OR $1 <% d.search_text)
      AND ($2='' OR g.slug=$2) AND ($3='' OR s.slug=$3) AND ($4='' OR p.product_type=$4)
      AND EXISTS(SELECT 1 FROM troc.printings pr JOIN troc.variants v ON v.printing_id=pr.id WHERE pr.product_id=p.id AND ($5='' OR pr.language=$5) AND ($6='' OR v.variant_key=$6) AND ($7='' OR pr.rarity=$7))
      AND (($8='' AND $9='' AND $10::integer IS NULL AND $11::integer IS NULL) OR a.quantity>0)
    ) SELECT *,${order} AS sort_value FROM matched
    WHERE ($12::${f.sort === "price" ? "integer" : "text"} IS NULL OR ${order} ${op} $12 OR (${order}=$12 AND id>$13::uuid))
    ORDER BY ${order} ${direction},id LIMIT $14`,
      values,
    );
    const rows = result.rows.slice(0, f.limit);
    return {
      items: rows.map((r) => ({
        product: r.document,
        lowestCents: r.lowest,
        medianCents: r.median,
        referenceCents: r.reference,
        quantity: r.quantity,
        sellerCount: r.sellers,
      })),
      nextCursor:
        result.rows.length > f.limit
          ? Buffer.from(
              JSON.stringify({
                value: rows.at(-1)!.sort_value,
                id: rows.at(-1)!.id,
              }),
            ).toString("base64url")
          : null,
    };
  }
  async detail(product: Product, variantId: string) {
    const [offers, prices, aggregate] = await Promise.all([
      this.db.query<Offer>(
        `${offerSql} AND l.variant_id=$1 ORDER BY l.unit_price_cents,l.id LIMIT 50`,
        [variantId],
      ),
      this.db.query<PricePoint>(
        `${priceSql} WHERE r.variant_id=$1 ORDER BY r.captured_at DESC,r.id LIMIT 90`,
        [variantId],
      ),
      this.db.query<{
        lowest: number | null;
        median: number | null;
        quantity: number | null;
        sellers: number;
      }>(
        `SELECT min(l.unit_price_cents) AS lowest,round(percentile_cont(0.5) WITHIN GROUP(ORDER BY l.unit_price_cents))::integer AS median,sum(l.quantity)::integer AS quantity,count(DISTINCT l.seller_id)::integer AS sellers FROM troc.listings l JOIN troc.seller_accounts s ON s.id=l.seller_id WHERE l.variant_id=$1 AND l.status='active' AND l.quantity>0 AND s.status='active' AND s.country='CA'`,
        [variantId],
      ),
    ]);
    const sellers = offers.rows.length
      ? (
          await this.db.query<Seller>(`${sellerSql} AND s.id=ANY($1::uuid[])`, [
            [...new Set(offers.rows.map((o) => o.sellerId))],
          ])
        ).rows
      : [];
    const a = aggregate.rows[0];
    return {
      offers: offers.rows,
      prices: prices.rows.reverse(),
      sellers,
      summary: {
        product,
        lowestCents: a.lowest,
        medianCents: a.median,
        referenceCents: prices.rows.at(-1)?.cents ?? null,
        quantity: a.quantity ?? 0,
        sellerCount: a.sellers ?? 0,
      },
    };
  }
  async sitemap(cursor: string) {
    return (
      await this.db.query<{ path: string; cursor: string }>(
        `${sitemapSql} SELECT path,cursor FROM urls WHERE cursor>$1 ORDER BY cursor LIMIT 1000`,
        [cursor],
      )
    ).rows;
  }
  async sitemapCursors() {
    const rows = await this.db.query<{ cursor: string }>(
      `${sitemapSql}, numbered AS (SELECT cursor,row_number() OVER(ORDER BY cursor) AS n,count(*) OVER() AS total FROM urls) SELECT cursor FROM numbered WHERE n%1000=0 AND n<total ORDER BY cursor`,
    );
    return ["", ...rows.rows.map((r) => r.cursor)];
  }
}
export function catalogRepository(): CatalogRepository {
  const mode = process.env.CATALOG_MODE;
  if (mode === "demo" || (!mode && process.env.NODE_ENV !== "production"))
    return new DemoCatalogRepository();
  if (mode !== "postgres" && mode !== undefined)
    throw new DomainError("invalid_catalog_mode", 503);
  if (!process.env.DATABASE_URL)
    throw new DomainError("service_unavailable", 503);
  return new PostgresCatalogRepository();
}
