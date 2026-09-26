import {collectorQuery,collectorSql,collectorMatches} from "./collector-search";
import {browseVisibilitySql} from "./browse-visibility";
import {ReferenceCache} from "./reference-cache";
import {snapshotSuggestions,databaseSuggestions} from "./suggestions-repository";
import { publicDemoCatalog } from "./public-demo";
import { PostgresCatalogAssetProvider } from "./assets";
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
  OfferSort,
} from "@workspace/catalog";
import { demoCatalog } from "./demo";
import { searchSnapshot, summarize, filtersFrom } from "./search";
import { DomainError } from "../shared/domain";
import type { CatalogSqlClient } from "./importer";
export type DetailOptions = {
  filters: SearchFilters;
  page: number;
  limit: number;
  sort: OfferSort;
  grade: string | null;
  cart?: readonly { listingId: string; quantity: number }[];
};
const defaultDetail = (): DetailOptions => ({
  filters: filtersFrom(new URLSearchParams()),
  page: 1,
  limit: 20,
  sort: "price_asc",
  grade: null,
});
function referenceCondition(product: Product, options: DetailOptions) {
  return product.type === "raw_single"
    ? options.filters.condition || "NM"
    : null;
}
export interface CatalogRepository {
  suggest?(query: string, locale: import("@workspace/catalog").Locale): Promise<import("@workspace/catalog").CatalogSuggestions>;
  readonly demo: boolean;
  images(products: Product[]): Promise<Product[]>;
  metadata(
    filters: SearchFilters,
    products?: Product[],
    known?: Pick<CatalogSnapshot, "games" | "sets" | "sellers">,
  ): Promise<Pick<CatalogSnapshot, "games" | "sets" | "sellers">>;
  search(
    filters: SearchFilters,
  ): Promise<{ items: ProductResult[]; nextCursor: string | null }>;
  product(slug: string): Promise<Product | null>;
  detail(
    product: Product,
    variantId: string,
    options?: DetailOptions,
  ): Promise<{
    offers: Offer[];
    prices: PricePoint[];
    sellers: Seller[];
    summary: ProductResult;
    nextOfferPage: number | null;
  }>;
  sitemap(cursor: string): Promise<{ path: string; cursor: string }[]>;
  sitemapCursors(): Promise<string[]>;
}
export class DemoCatalogRepository implements CatalogRepository {
  readonly demo = true;
  async suggest(query: string, locale: import("@workspace/catalog").Locale) { return snapshotSuggestions(this.data,query,locale); }
  async images(products: Product[]) {
    return products;
  }
  constructor(private readonly data: CatalogSnapshot = demoCatalog()) {}
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
  async detail(product: Product, variantId: string, options = defaultDetail()) {
    const f = options.filters;
    const offers = this.data.offers
      .filter(
        (o) =>
          o.variantId === variantId &&
          o.quantity > 0 &&
          (!options.cart ||
            (o.quantity >
              (options.cart.find((line) => line.listingId === o.id)?.quantity ??
                0) &&
              (options.cart.find((line) => line.listingId === o.id)?.quantity ??
                0) < 100 &&
              (options.cart.length < 100 ||
                options.cart.some((line) => line.listingId === o.id)))) &&
          (!f.condition || o.condition === f.condition) &&
          (!f.seller ||
            this.data.sellers.some(
              (s) => s.id === o.sellerId && s.slug === f.seller,
            )) &&
          (f.min === null || o.cents >= f.min) &&
          (f.max === null || o.cents <= f.max) &&
          (!options.grade || o.grade === options.grade),
      )
      .sort(
        (a, b) =>
          (options.sort === "quantity"
            ? b.quantity - a.quantity
            : options.sort === "price_desc"
              ? b.cents - a.cents
              : a.cents - b.cents) || a.id.localeCompare(b.id),
      );
    const prices = this.data.prices.filter(
      (p) =>
        p.variantId === variantId &&
        p.condition === referenceCondition(product, options) &&
        p.grade === (product.type === "graded_card" ? options.grade : null) &&
        (product.type !== "graded_card" || options.grade !== null),
    );
    const offset = (options.page - 1) * options.limit;
    return {
      offers: offers.slice(offset, offset + options.limit),
      prices,
      sellers: this.data.sellers,
      summary: summarize(product, offers, prices),
      nextOfferPage:
        offset + options.limit < offers.length && options.page < 10000
          ? options.page + 1
          : null,
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
const offerSql = `SELECT l.id,l.variant_id AS "variantId",l.seller_id AS "sellerId",l.condition,COALESCE(l.sale_cents,l.unit_price_cents) AS cents,l.quantity,l.grade,l.grading_company_id AS "gradingCompany",l.certificate_number AS "certificateNumber",
 COALESCE((SELECT jsonb_agg(ph.storage_key ORDER BY ph.position) FROM troc.listing_photos ph WHERE ph.listing_id=l.id),'[]') AS photos,(l.demo_batch_id IS NOT NULL) AS demo
 FROM troc.listings l JOIN troc.seller_accounts s ON s.id=l.seller_id WHERE l.status='active' AND l.quantity>0 AND s.status='active' AND s.country='CA'`;
const priceSql = `SELECT r.variant_id AS "variantId",r.condition,r.grade,r.provider_product_id AS "providerProductId",r.converted_cad_cents::text AS cents,r.captured_at::text AS "capturedAt",r.provider,r.source_currency AS "sourceCurrency",r.source_price_minor_units::text AS "sourceMinorUnits",f.rate::text AS "fxRate",f.rate_date::text AS "fxDate",r.provider_updated_at::text AS "providerUpdatedAt",(r.demo_batch_id IS NOT NULL) AS demo FROM troc.reference_prices r JOIN troc.fx_rates f ON f.id=r.fx_rate_id`;
type StoredPricePoint = Omit<PricePoint, "cents" | "sourceMinorUnits"> & {
  cents: string;
  sourceMinorUnits: string;
};
function safeInteger(value: string): number {
  if (!/^\d+$/.test(value) || BigInt(value) > BigInt(Number.MAX_SAFE_INTEGER))
    throw new DomainError("invalid_money", 503);
  return Number(value);
}
const referenceCaches = new WeakMap<CatalogSqlClient, ReferenceCache<{games:Game[];sets:SetRelease[]}>>();
export class PostgresCatalogRepository implements CatalogRepository {
  suggest(query: string, locale: import("@workspace/catalog").Locale) {return databaseSuggestions(this.db,query,locale);}
  constructor(private readonly db: CatalogSqlClient = pool) {}
  images(products: Product[]) {
    return new PostgresCatalogAssetProvider(this.db).images(products);
  }
  readonly demo = process.env.NODE_ENV !== "production" && process.env.TROC_LOCAL_ACCOUNTS === "true";
  async metadata(f: SearchFilters, products: Product[] = [], known?: Pick<CatalogSnapshot, "games" | "sets" | "sellers">) {
    let cache = referenceCaches.get(this.db);
    if (!cache) { cache = new ReferenceCache(); referenceCaches.set(this.db, cache); }
    const [reference, sellerRows] = known ? [{games:known.games,sets:known.sets},{rows:known.sellers}] : await Promise.all([
      cache.get(JSON.stringify([f.game,f.set]), async () => {
        const [games,sets] = await Promise.all([this.db.query<Game>(
        `SELECT id,slug,jsonb_build_object('en',name_en,'fr',name_fr) AS name FROM troc.games ORDER BY slug LIMIT 50`,
      ),
      this.db.query<SetRelease>(
        `SELECT s.id,s.game_id AS "gameId",s.slug,jsonb_build_object('en',s.name_en,'fr',s.name_fr) AS name,s.released_on::text AS "releasedOn" FROM troc.set_releases s JOIN troc.games g ON g.id=s.game_id WHERE ($1='' OR g.slug=$1) AND EXISTS(SELECT 1 FROM troc.catalog_products cp JOIN troc.catalog_documents cd ON cd.product_id=cp.id WHERE cp.set_id=s.id AND ${browseVisibilitySql("cp")}) ORDER BY (s.slug=$2) DESC,s.released_on DESC NULLS LAST,s.id LIMIT 100`,
        [f.game, f.set],
      )]);
        return {games:games.rows,sets:sets.rows};
      }),
      this.db.query<Seller>(
        `${sellerSql} ORDER BY (s.slug=$1) DESC,s.id LIMIT 24`,
        [f.seller],
      )
    ]);
    const games={rows:reference.games},sets={rows:reference.sets},sellers=sellerRows;
    // Selector limits must never hide the actual context of returned products.
    const missingGameIds = [...new Set(products.map((p) => p.gameId))].filter(
      (id) => !games.rows.some((g) => g.id === id),
    );
    const missingSetIds = [...new Set(products.map((p) => p.setId))].filter(
      (id) => !sets.rows.some((s) => s.id === id),
    );
    const [actualGames, actualSets] = await Promise.all([
      missingGameIds.length
        ? this.db.query<Game>(
            "SELECT id,slug,jsonb_build_object('en',name_en,'fr',name_fr) AS name FROM troc.games WHERE id=ANY($1::uuid[])",
            [missingGameIds],
          )
        : { rows: [] },
      missingSetIds.length
        ? this.db.query<SetRelease>(
            `SELECT id,game_id AS "gameId",slug,jsonb_build_object('en',name_en,'fr',name_fr) AS name,released_on::text AS "releasedOn" FROM troc.set_releases WHERE id=ANY($1::uuid[])`,
            [missingSetIds],
          )
        : { rows: [] },
    ]);
    return {
      games: [...games.rows, ...actualGames.rows],
      sets: [...sets.rows, ...actualSets.rows],
      sellers: sellers.rows,
    };
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
    // Exact matches rank ahead of fuzzy matches. A full exact page proves that
    // fuzzy candidates cannot affect this page; the fallback retains all semantics.
    const canFillExactly = /[a-zA-Z]/.test(f.q) && f.sort === "name" && !f.condition && !f.seller && f.min === null && f.max === null;
    if (canFillExactly) {
      const exact = await this.searchPage(f, true);
      if (exact.nextCursor) return exact;
    }
    return this.searchPage(f);
  }
  private async searchPage(f: SearchFilters, exactOnly = false) {
    // One SQL statement; indexed matching + stable keyset pagination. No per-result fetches.
    const numberQuery = collectorQuery(f.q);
    const numberMatch = numberQuery ? `EXISTS(SELECT 1 FROM troc.printings cp JOIN troc.variants cv ON cv.printing_id=cp.id JOIN troc.catalog_search_variants cx ON cx.variant_id=cv.id WHERE cx.collector_key=$16 AND cp.product_id=p.id AND ($5='' OR cp.language=$5) AND ($6='' OR cv.variant_key=$6) AND ($7='' OR cp.rarity=$7) AND ${collectorSql("cp.collector_number", "p.set_id", "$1")})` : "";
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
    let cursor: {
      value: string | number;
      id: string;
      relevance?: number;
    } | null = null;
    if (f.cursor) {
      try {
        cursor = JSON.parse(Buffer.from(f.cursor, "base64url").toString());
        if (
          !cursor ||
          typeof cursor.id !== "string" ||
          !/^[0-9a-f-]{36}$/.test(cursor.id) ||
          !["string", "number"].includes(typeof cursor.value) ||
          (cursor.relevance !== undefined &&
            ![0, 1].includes(cursor.relevance)) ||
          (!!f.q && cursor.relevance === undefined)
        )
          throw new Error();
      } catch {
        throw new DomainError("invalid_cursor");
      }
    }
    values.push(
      cursor?.value ?? null,
      cursor?.id ?? null,
      f.limit + 1,
      cursor?.relevance ?? 0,
    );
    if (numberQuery) values.push(numberQuery.number);
    // Page catalog-only sorts before expensive offer aggregates. Offer-dependent
    // filters/sorts must aggregate first to preserve same-offer semantics.
    const pricePage = f.sort === "price" && !f.q && !f.game && !f.set;
    const prepage = pricePage || (
      f.sort !== "price" &&
      !f.condition &&
      !f.seller &&
      f.min === null &&
      f.max === null);
    const candidateCte = pricePage
      ? `offer_minima AS MATERIALIZED (
        SELECT pr.product_id,min(COALESCE(l.sale_cents,l.unit_price_cents)) AS lowest
        FROM troc.listings l JOIN troc.variants v ON v.id=l.variant_id JOIN troc.printings pr ON pr.id=v.printing_id JOIN troc.seller_accounts sa ON sa.id=l.seller_id
        WHERE l.status='active' AND l.quantity>0 AND sa.status='active' AND sa.country='CA'
        AND ($5='' OR pr.language=$5) AND ($6='' OR v.variant_key=$6) AND ($7='' OR pr.rarity=$7) AND ($8='' OR l.condition=$8) AND ($9='' OR sa.slug=$9)
        AND ($10::integer IS NULL OR COALESCE(l.sale_cents,l.unit_price_cents)>=$10) AND ($11::integer IS NULL OR COALESCE(l.sale_cents,l.unit_price_cents)<=$11)
        GROUP BY pr.product_id
      ), candidate_matches AS (
        SELECT p.id,a.lowest,CASE WHEN $1='' THEN 0 WHEN d.search_text ILIKE '%'||$1||'%' THEN 1 ELSE 0 END AS relevance
        FROM troc.catalog_products p JOIN troc.catalog_documents d ON d.product_id=p.id
        JOIN troc.games g ON g.id=p.game_id JOIN troc.set_releases s ON s.id=p.set_id LEFT JOIN offer_minima a ON a.product_id=p.id
        WHERE ${browseVisibilitySql()} AND (${numberQuery ? numberMatch : `($1='' OR d.search_text ILIKE '%'||$1||'%' OR ${exactOnly ? 'false' : '$1 OPERATOR(extensions.<%) d.search_text'})`})
        AND ($2='' OR g.slug=$2) AND ($3='' OR s.slug=$3) AND ($4='' OR p.product_type=$4)
        AND EXISTS(SELECT 1 FROM troc.printings pr JOIN troc.variants v ON v.printing_id=pr.id WHERE pr.product_id=p.id AND ($5='' OR pr.language=$5) AND ($6='' OR v.variant_key=$6) AND ($7='' OR pr.rarity=$7))
        AND (($8='' AND $9='' AND $10::integer IS NULL AND $11::integer IS NULL) OR a.lowest IS NOT NULL)
      ), candidate_page AS MATERIALIZED (
        SELECT id FROM candidate_matches
        WHERE ($12::integer IS NULL OR relevance<$15::integer OR (relevance=$15::integer AND (${order} ${op} $12 OR (${order}=$12 AND id>$13::uuid))))
        ORDER BY relevance DESC,${order} ${direction},id LIMIT $14
      ),`
      : prepage
      ? `candidate_matches AS (
      SELECT p.id,p.name_en,s.released_on,
      CASE WHEN $1='' THEN 0 WHEN d.search_text ILIKE '%'||$1||'%' THEN 1 ELSE 0 END AS relevance
      FROM troc.catalog_products p JOIN troc.catalog_documents d ON d.product_id=p.id
      JOIN troc.games g ON g.id=p.game_id JOIN troc.set_releases s ON s.id=p.set_id
      WHERE ${browseVisibilitySql()} AND (${numberQuery ? numberMatch : `($1='' OR d.search_text ILIKE '%'||$1||'%' OR ${exactOnly ? 'false' : '$1 OPERATOR(extensions.<%) d.search_text'})`})
      AND ($2='' OR g.slug=$2) AND ($3='' OR s.slug=$3) AND ($4='' OR p.product_type=$4)
      AND EXISTS(SELECT 1 FROM troc.printings pr JOIN troc.variants v ON v.printing_id=pr.id WHERE pr.product_id=p.id AND ($5='' OR pr.language=$5) AND ($6='' OR v.variant_key=$6) AND ($7='' OR pr.rarity=$7))
    ), candidate_page AS MATERIALIZED (
      SELECT id FROM candidate_matches
      WHERE ($12::text IS NULL OR relevance<$15::integer OR (relevance=$15::integer AND (${order} ${op} $12 OR (${order}=$12 AND id>$13::uuid))))
      ORDER BY relevance DESC,${order} ${direction},id LIMIT $14
    ),`
      : "";
    const result = await this.db.query<{
      id: string;
      document: Product;
      lowest: number | null;
      median: number | null;
      reference: string | null;
      demo: boolean;
      quantity: number;
      sellers: number;
      sort_value: string | number;
      relevance: number;
    }>(
      `WITH ${candidateCte} matched AS (
      SELECT p.id,p.name_en,s.released_on,d.document,
      CASE WHEN $1='' THEN 0 WHEN d.search_text ILIKE '%'||$1||'%' THEN 1 ELSE 0 END AS relevance,
      a.lowest,a.median,a.quantity,a.sellers,
      (COALESCE(a.demo,false) OR EXISTS(SELECT 1 FROM troc.reference_prices dr JOIN troc.variants dv ON dv.id=dr.variant_id JOIN troc.printings dp ON dp.id=dv.printing_id WHERE dp.product_id=p.id AND dr.demo_batch_id IS NOT NULL AND ($5='' OR dp.language=$5) AND ($6='' OR dv.variant_key=$6))) AS demo,
      (SELECT r.converted_cad_cents::text FROM troc.reference_prices r JOIN troc.variants rv ON rv.id=r.variant_id JOIN troc.printings rp ON rp.id=rv.printing_id WHERE rp.product_id=p.id AND ${numberQuery ? collectorSql('rp.collector_number', 'p.set_id', '$1') : 'true'} AND ($5='' OR rp.language=$5) AND ($6='' OR rv.variant_key=$6) AND ($7='' OR rp.rarity=$7) AND r.condition IS NOT DISTINCT FROM CASE WHEN p.product_type='raw_single' THEN COALESCE(NULLIF($8,''),'NM') ELSE NULL END AND r.grade IS NULL AND p.product_type<>'graded_card' ORDER BY r.captured_at DESC,r.id LIMIT 1) AS reference
      FROM troc.catalog_products p ${prepage ? "JOIN candidate_page cp ON cp.id=p.id" : ""} JOIN troc.catalog_documents d ON d.product_id=p.id JOIN troc.games g ON g.id=p.game_id JOIN troc.set_releases s ON s.id=p.set_id
      CROSS JOIN LATERAL (
        SELECT min(COALESCE(l.sale_cents,l.unit_price_cents)) AS lowest,round(percentile_cont(0.5) WITHIN GROUP(ORDER BY COALESCE(l.sale_cents,l.unit_price_cents)))::integer AS median,COALESCE(sum(l.quantity),0)::integer AS quantity,count(DISTINCT l.seller_id)::integer AS sellers,bool_or(l.demo_batch_id IS NOT NULL OR sa.demo_batch_id IS NOT NULL) AS demo
        FROM troc.listings l JOIN troc.variants v ON v.id=l.variant_id JOIN troc.printings pr ON pr.id=v.printing_id JOIN troc.seller_accounts sa ON sa.id=l.seller_id
        WHERE pr.product_id=p.id AND ${numberQuery ? collectorSql('pr.collector_number', 'p.set_id', '$1') : 'true'} AND l.status='active' AND l.quantity>0 AND sa.status='active' AND sa.country='CA'
        AND ($5='' OR pr.language=$5) AND ($6='' OR v.variant_key=$6) AND ($7='' OR pr.rarity=$7) AND ($8='' OR l.condition=$8) AND ($9='' OR sa.slug=$9)
        AND ($10::integer IS NULL OR COALESCE(l.sale_cents,l.unit_price_cents)>=$10) AND ($11::integer IS NULL OR COALESCE(l.sale_cents,l.unit_price_cents)<=$11)
      ) a
      WHERE ${browseVisibilitySql()} AND (${numberQuery ? numberMatch : `($1='' OR d.search_text ILIKE '%'||$1||'%' OR ${exactOnly ? 'false' : '$1 OPERATOR(extensions.<%) d.search_text'})`})
      AND ($2='' OR g.slug=$2) AND ($3='' OR s.slug=$3) AND ($4='' OR p.product_type=$4)
      AND EXISTS(SELECT 1 FROM troc.printings pr JOIN troc.variants v ON v.printing_id=pr.id WHERE pr.product_id=p.id AND ($5='' OR pr.language=$5) AND ($6='' OR v.variant_key=$6) AND ($7='' OR pr.rarity=$7))
      AND (($8='' AND $9='' AND $10::integer IS NULL AND $11::integer IS NULL) OR a.quantity>0)
    ) SELECT *,${order} AS sort_value FROM matched
    WHERE ($12::${f.sort === "price" ? "integer" : "text"} IS NULL OR relevance<$15::integer OR (relevance=$15::integer AND (${order} ${op} $12 OR (${order}=$12 AND id>$13::uuid))))
    ORDER BY relevance DESC,${order} ${direction},id LIMIT $14`,
      values,
    );
    const rows = result.rows.slice(0, f.limit);
    return {
      items: rows.map((r) => ({
        product: numberQuery ? {...r.document, variants: r.document.variants.filter(v => collectorMatches(v.number, r.document.setId, f.q) && (!f.language || v.language === f.language) && (!f.variant || v.key === f.variant) && (!f.rarity || v.rarity === f.rarity))} : r.document,
        lowestCents: r.lowest,
        medianCents: r.median,
        referenceCents: r.reference === null ? null : safeInteger(r.reference),
        demo: r.demo,
        quantity: r.quantity,
        sellerCount: r.sellers,
      })),
      nextCursor:
        result.rows.length > f.limit
          ? Buffer.from(
              JSON.stringify({
                value: rows.at(-1)!.sort_value,
                relevance: rows.at(-1)!.relevance,
                id: rows.at(-1)!.id,
              }),
            ).toString("base64url")
          : null,
    };
  }
  async detail(product: Product, variantId: string, options = defaultDetail()) {
    const f = options.filters;
    let match =
      "l.variant_id=$1 AND ($2='' OR l.condition=$2) AND ($3='' OR s.slug=$3) AND ($4::integer IS NULL OR COALESCE(l.sale_cents,l.unit_price_cents)>=$4) AND ($5::integer IS NULL OR COALESCE(l.sale_cents,l.unit_price_cents)<=$5) AND ($6::text IS NULL OR l.grade=$6)";
    const values: unknown[] = [
      variantId,
      f.condition,
      f.seller,
      f.min,
      f.max,
      options.grade,
    ];
    if (options.cart) {
      values.push(
        JSON.stringify(
          Object.fromEntries(
            options.cart.map((line) => [line.listingId, line.quantity]),
          ),
        ),
      );
      match +=
        " AND l.quantity>COALESCE(($7::jsonb->>l.id::text)::integer,0) AND COALESCE(($7::jsonb->>l.id::text)::integer,0)<100";
      if (options.cart.length === 100) match += " AND $7::jsonb ? l.id::text";
    }
    const limitParameter = values.length + 1;
    const order =
      options.sort === "quantity"
        ? "l.quantity DESC"
        : options.sort === "price_desc"
          ? "COALESCE(l.sale_cents,l.unit_price_cents) DESC"
          : "COALESCE(l.sale_cents,l.unit_price_cents) ASC";
    const [offers, prices, aggregate] = await Promise.all([
      this.db.query<Offer>(
        `${offerSql} AND ${match} ORDER BY ${order},l.id LIMIT $${limitParameter} OFFSET $${limitParameter + 1}`,
        [...values, options.limit + 1, (options.page - 1) * options.limit],
      ),
      this.db.query<StoredPricePoint>(
        `WITH selected_series AS (SELECT provider,provider_product_id,source_currency FROM troc.reference_prices WHERE variant_id=$1 AND condition IS NOT DISTINCT FROM $2::text AND grade IS NOT DISTINCT FROM $3::text AND $4::boolean ORDER BY captured_at DESC,id LIMIT 1)
        ${priceSql} JOIN selected_series series ON series.provider=r.provider AND series.provider_product_id=r.provider_product_id AND series.source_currency=r.source_currency
        WHERE r.variant_id=$1 AND r.condition IS NOT DISTINCT FROM $2::text AND r.grade IS NOT DISTINCT FROM $3::text ORDER BY r.captured_at DESC,r.id LIMIT 90`,
        [
          variantId,
          referenceCondition(product, options),
          product.type === "graded_card" ? options.grade : null,
          product.type !== "graded_card" || options.grade !== null,
        ],
      ),
      this.db.query<{
        lowest: number | null;
        median: number | null;
        quantity: number | null;
        sellers: number;
        demo: boolean;
      }>(
        `SELECT min(COALESCE(l.sale_cents,l.unit_price_cents)) AS lowest,round(percentile_cont(0.5) WITHIN GROUP(ORDER BY COALESCE(l.sale_cents,l.unit_price_cents)))::integer AS median,sum(l.quantity)::integer AS quantity,count(DISTINCT l.seller_id)::integer AS sellers,bool_or(l.demo_batch_id IS NOT NULL OR s.demo_batch_id IS NOT NULL) AS demo FROM troc.listings l JOIN troc.seller_accounts s ON s.id=l.seller_id WHERE ${match} AND l.status='active' AND l.quantity>0 AND s.status='active' AND s.country='CA'`,
        values,
      ),
    ]);
    const visibleOffers = offers.rows.slice(0, options.limit);
    const sellers = visibleOffers.length
      ? (
          await this.db.query<Seller>(`${sellerSql} AND s.id=ANY($1::uuid[])`, [
            [...new Set(visibleOffers.map((o) => o.sellerId))],
          ])
        ).rows
      : [];
    const a = aggregate.rows[0];
    const pricePoints = prices.rows.reverse().map((price) => ({
      ...price,
      cents: safeInteger(price.cents),
      sourceMinorUnits: safeInteger(price.sourceMinorUnits),
    }));
    return {
      offers: visibleOffers,
      prices: pricePoints,
      sellers,
      nextOfferPage:
        offers.rows.length > options.limit && options.page < 10000
          ? options.page + 1
          : null,
      summary: {
        product,
        lowestCents: a.lowest,
        medianCents: a.median,
        referenceCents: pricePoints.at(-1)?.cents ?? null,
        demo: a.demo || pricePoints.some((price) => price.demo),
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
    return new DemoCatalogRepository(publicDemoCatalog());
  if (mode !== "postgres" && mode !== undefined)
    throw new DomainError("invalid_catalog_mode", 503);
  if (!process.env.DATABASE_URL)
    throw new DomainError("service_unavailable", 503);
  return new PostgresCatalogRepository();
}
