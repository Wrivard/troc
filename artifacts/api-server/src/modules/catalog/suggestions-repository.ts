import { ReferenceCache } from "./reference-cache";
import {collectorQuery,collectorMatches,collectorSql} from "./collector-search";
import {browseVisibilitySql} from "./browse-visibility";
import type {
  CatalogSnapshot,
  CatalogSuggestion,
  CatalogSuggestions,
  Locale,
  Product,
  SuggestionKind,
} from "@workspace/catalog";

import type { CatalogSqlClient } from "./importer";
import { PostgresCatalogAssetProvider } from "./assets";
import {
  fold,
  foldSql,
  suggestionQuery,
  suggestionRank,
} from "./suggest-ranking";
type Candidate = CatalogSuggestion & {
  kind: SuggestionKind;
  score: number;
  product?: Product | null;
};
const kinds: SuggestionKind[] = [
  "cards",
  "sets",
  "products",
  "sellers",
  "games",
];
const cap = (kind: SuggestionKind) => (kind === "cards" ? 4 : 2);
function group(
  query: string,
  locale: Locale,
  rows: Candidate[],
): CatalogSuggestions {
  return {
    query,
    locale,
    groups: kinds.flatMap((kind) => {
      const results = rows
        .filter((row) => row.kind === kind)
        .sort(
          (a, b) =>
            a.score - b.score ||
            Buffer.compare(
              Buffer.from(fold(a.name[locale])),
              Buffer.from(fold(b.name[locale])),
            ) ||
            a.id.localeCompare(b.id),
        )
        .slice(0, cap(kind))
        .map((row) => ({
          id: row.id,
          slug: row.slug,
          name: row.name,
          demo: row.demo,
          ...(row.variantId ? { variantId: row.variantId } : {}),
          ...(row.collectorNumber
            ? { collectorNumber: row.collectorNumber }
            : {}),
          ...(row.subtitle ? { subtitle: row.subtitle } : {}),
          ...(row.imageUrl !== undefined ? { imageUrl: row.imageUrl } : {}),
          ...(row.lowestCents !== undefined
            ? { lowestCents: row.lowestCents }
            : {}),
          ...(row.sellerCount !== undefined
            ? { sellerCount: row.sellerCount }
            : {}),
        }));
      return results.length ? [{ kind, results }] : [];
    }),
  };
}
function artwork(product: Product, variantId: string) {
  const front = product.variants.find(value => value.id === variantId)?.images?.find(image => image.side === "front") ?? product.images?.find(image => image.side === "front");
  // A 42 CSS-pixel suggestion needs a small, sharp 2x rendition, not the detail image.
  const sources = [...(front?.sources ?? [])].sort((a,b)=>a.width-b.width);
  return (sources.find(source => source.width >= 84) ?? sources[0])?.url ?? front?.url ?? product.imageUrl;
}
export function snapshotSuggestions(
  data: CatalogSnapshot,
  raw: string,
  locale: Locale,
): CatalogSuggestions {
  const query = suggestionQuery(raw),
    rows: Candidate[] = [];
  if (!query.terms.length) return group(query.query, locale, rows);
  for (const product of data.products) {
    const game = data.games.find((value) => value.id === product.gameId),
      set = data.sets.find((value) => value.id === product.setId);
    const matches = product.variants
      .flatMap((variant) => {
        const score = collectorQuery(raw) ? (collectorMatches(variant.number, product.setId, raw) ? 0 : null) : suggestionRank(
          [
            product.name.en,
            product.name.fr,
            ...product.aliases,
            game?.name.en ?? "",
            game?.name.fr ?? "",
            set?.name.en ?? "",
            set?.name.fr ?? "",
            variant.key,
            variant.artist,
            variant.rarity,
          ],
          variant.number,
          query,
        );
        return score === null ? [] : [{ variant, score }];
      })
      .sort(
        (a, b) => a.score - b.score || a.variant.id.localeCompare(b.variant.id),
      );
    const selected = matches[0];
    if (!selected) continue;
    const offers = data.offers.filter(
      (offer) =>
        offer.variantId === selected.variant.id &&
        offer.quantity > 0 &&
        data.sellers.some((seller) => seller.id === offer.sellerId),
    );
    rows.push({
      id: product.id,
      slug: product.slug,
      name: product.name,
      kind: product.type === "sealed" ? "products" : "cards",
      score: selected.score,
      variantId: selected.variant.id,
      collectorNumber: selected.variant.number,
      subtitle: set?.name,
      imageUrl: artwork(product, selected.variant.id),
      lowestCents: offers.length
        ? offers.reduce((min, offer) => Math.min(min, offer.cents), Infinity)
        : null,
      sellerCount: new Set(offers.map((offer) => offer.sellerId)).size,
      demo:
        !!product.demo ||
        offers.some((offer) => offer.demo) ||
        offers.some(
          (offer) =>
            data.sellers.find((seller) => seller.id === offer.sellerId)?.demo,
        ),
    });
  }
  for (const [kind, entities] of [
    ["sets", data.sets],
    ["games", data.games],
  ] as const)
    for (const entity of entities) {
      const products = data.products.filter((product) =>
        kind === "sets"
          ? product.setId === entity.id
          : product.gameId === entity.id,
      );
      if (!products.length) continue;
      const score = suggestionRank(
        [entity.name.en, entity.name.fr, entity.slug],
        "",
        query,
      );
      if (score !== null)
        rows.push({
          id: entity.id,
          slug: entity.slug,
          name: entity.name,
          kind,
          score,
          demo: products.some((product) => product.demo),
        });
    }
  for (const seller of data.sellers) {
    const name = seller.name;
    const score = suggestionRank([name, seller.name, seller.slug], "", query);
    if (score !== null)
      rows.push({
        id: seller.id,
        slug: seller.slug,
        name: { en: name, fr: name },
        kind: "sellers",
        score,
        demo: seller.demo,
        imageUrl: seller.logoUrl,
      });
  }
  return group(query.query, locale, rows);
}

const candidateCaches = new WeakMap<CatalogSqlClient, ReferenceCache<Candidate[]>>();
export async function databaseSuggestions(
  db: CatalogSqlClient,
  raw: string,
  locale: Locale,
): Promise<CatalogSuggestions> {
  const query = suggestionQuery(raw);
  if (!query.terms.length) return group(query.query, locale, []);
  // Existing canonical projections; relevance is evaluated before per-group limits.
  const numberQuery = collectorQuery(raw);
  const parameters: unknown[] = [JSON.stringify(query.terms), query.text, locale];
  const bind = (value: string | boolean) => { parameters.push(value); return "$" + parameters.length; };
  const exactFlag = !numberQuery && query.terms.some(term => term.fuzzy) ? bind(true) : null;
  const candidateFilter = numberQuery ? "x.collector_key=" + bind(numberQuery.number) : query.terms.map(term => {
    const exact = "x.hay LIKE " + bind("%" + term.text.replace(/[\\%_]/g, char => "\\" + char) + "%") + " ESCAPE '\\'";
    return "(" + exact + (term.fuzzy ? " OR ((p.product_type='sealed' OR NOT " + exactFlag + "::boolean) AND x.hay ~ " + bind(term.fuzzy) + ")" : "") + ")";
  }).join(" AND ");
  const entityFilter = (expression: string) => numberQuery ? "false" : query.terms.map(term => {
    const hay = foldSql(expression);
    const exact = "strpos(" + hay + "," + bind(term.text) + ")>0";
    return "(" + exact + (term.fuzzy ? " OR " + hay + " ~ " + bind(term.fuzzy) : "") + ")";
  }).join(" AND ");
  const setFilter = entityFilter("sr.name_en||' '||sr.name_fr||' '||sr.slug");
  const gameFilter = entityFilter("g.name_en||' '||g.name_fr||' '||g.slug");
  const sellerFilter = entityFilter("bn.name||' '||s.display_name||' '||s.slug");
  const sql =
    `WITH source AS (
    SELECT p.id::text AS id,p.slug,d.document->'name' AS name,CASE WHEN p.product_type='sealed' THEN 'products' ELSE 'cards' END AS kind,
      x.variant_id::text AS "variantId",x.number AS "collectorNumber",jsonb_build_object('en',sr.name_en,'fr',sr.name_fr) AS subtitle,
      COALESCE((d.document->>'demo')::boolean,false) AS demo,jsonb_build_object('setId',p.set_id) AS product,NULL::text AS "imageUrl",
      x.names AS raw_names
    FROM troc.catalog_search_variants x JOIN troc.catalog_products p ON p.id=x.product_id JOIN troc.catalog_documents d ON d.product_id=p.id JOIN troc.set_releases sr ON sr.id=p.set_id WHERE (${candidateFilter}) AND ${browseVisibilitySql()}
    UNION ALL
    SELECT sr.id::text,sr.slug,jsonb_build_object('en',sr.name_en,'fr',sr.name_fr),'sets',NULL,'',NULL,
      EXISTS(SELECT 1 FROM troc.catalog_products p JOIN troc.catalog_documents d ON d.product_id=p.id WHERE p.set_id=sr.id AND COALESCE((d.document->>'demo')::boolean,false)),NULL,NULL,ARRAY[sr.name_en,sr.name_fr,sr.slug]
    FROM troc.set_releases sr WHERE ${setFilter} AND EXISTS(SELECT 1 FROM troc.catalog_products p JOIN troc.catalog_documents d ON d.product_id=p.id WHERE p.set_id=sr.id AND ${browseVisibilitySql()})
    UNION ALL
    SELECT g.id::text,g.slug,jsonb_build_object('en',g.name_en,'fr',g.name_fr),'games',NULL,'',NULL,
      EXISTS(SELECT 1 FROM troc.catalog_products p JOIN troc.catalog_documents d ON d.product_id=p.id WHERE p.game_id=g.id AND COALESCE((d.document->>'demo')::boolean,false)),NULL,NULL,ARRAY[g.name_en,g.name_fr,g.slug]
    FROM troc.games g WHERE ${gameFilter} AND EXISTS(SELECT 1 FROM troc.catalog_products p JOIN troc.catalog_documents d ON d.product_id=p.id WHERE p.game_id=g.id AND ${browseVisibilitySql()})
    UNION ALL
    SELECT s.id::text,s.slug,jsonb_build_object('en',bn.name,'fr',bn.name),'sellers',NULL,'',NULL,s.demo_batch_id IS NOT NULL,NULL,sp.logo_url,ARRAY[bn.name,s.display_name,s.slug]
    FROM troc.seller_accounts s LEFT JOIN troc.seller_public_profiles sp ON sp.seller_id=s.id
    CROSS JOIN LATERAL (SELECT s.display_name AS name)bn
    WHERE s.status='active' AND s.country='CA' AND ${sellerFilter}
  ), normalized AS ` + (query.terms.length > 1 ? "MATERIALIZED " : "") + `(SELECT *,CASE WHEN kind IN ('cards','products') THEN raw_names ELSE ARRAY(SELECT ` +
    foldSql("trim(n)") +
    ` FROM unnest(raw_names)n) END AS names,
    ` +
    foldSql('"collectorNumber"') +
    ` AS number FROM source), matching AS (
    SELECT *,array_to_string(names,' ')||' '||number AS hay FROM normalized
  ), scored AS (
    SELECT *,CASE
      WHEN number<>'' AND EXISTS(SELECT 1 FROM jsonb_array_elements($1::jsonb)t WHERE t->>'text'=number) THEN 0
      WHEN $2=ANY(names) THEN 1
      WHEN EXISTS(SELECT 1 FROM unnest(names)n WHERE left(n,length($2))=$2) OR (number<>'' AND left(number,length($2))=$2) THEN 2
      WHEN NOT EXISTS(SELECT 1 FROM jsonb_array_elements($1::jsonb)t WHERE strpos(hay,t->>'text')=0) THEN 3 ELSE 4 END AS score
    FROM matching WHERE ${numberQuery ? collectorSql("number", "(product->>'setId')", "$2") : "NOT EXISTS(SELECT 1 FROM jsonb_array_elements($1::jsonb)t WHERE strpos(hay,t->>'text')=0 AND (t->>'fuzzy' IS NULL OR hay !~ (t->>'fuzzy')))"}
  ), canonical AS (SELECT *,row_number()OVER(PARTITION BY kind,id ORDER BY score,"variantId" COLLATE "C") AS variant_rank FROM scored), bounded AS (
    SELECT *,row_number()OVER(PARTITION BY kind ORDER BY score,` +
    foldSql("name->>$3") +
    ` COLLATE "C",id COLLATE "C") AS group_rank FROM canonical WHERE variant_rank=1
  ) SELECT b.id,b.slug,b.name,b.kind,b."variantId",b."collectorNumber",b.subtitle,b.demo,d.document AS product,b."imageUrl",b.score FROM bounded b LEFT JOIN troc.catalog_documents d ON d.product_id=b.id::uuid AND b.kind IN ('cards','products') WHERE group_rank<=CASE WHEN kind='cards' THEN 4 ELSE 2 END`;
  let cache = candidateCaches.get(db);
  if (!cache) { cache = new ReferenceCache<Candidate[]>(128, 15000); candidateCaches.set(db, cache); }
  // Only bounded discovery candidates are cached. Prices, stock and active sellers are rechecked below.
  const rows = (await cache.get(JSON.stringify([query.text, locale]), async () => {
    const exact = (await db.query<Candidate>(sql, parameters)).rows;
    if (!exactFlag || exact.filter(row => row.kind === "cards").length >= 4) return exact;
    const fuzzyParameters = [...parameters]; fuzzyParameters[3] = false;
    return (await db.query<Candidate>(sql, fuzzyParameters)).rows;
  })).map(row => ({...row}));
  const sellerIds = rows.filter(row => row.kind === "sellers").map(row => row.id);
  if (sellerIds.length) {
    const active = new Set((await db.query<{id:string}>("SELECT id FROM troc.seller_accounts WHERE id=ANY($1::uuid[]) AND status='active' AND country='CA'", [sellerIds])).rows.map(row => row.id));
    for (let i=rows.length-1;i>=0;i--) if (rows[i].kind === "sellers" && !active.has(rows[i].id)) rows.splice(i,1);
  }
  const products = rows.flatMap((row) => (row.product ? [row.product] : []));
  const illustrated = await new PostgresCatalogAssetProvider(db).images(
    products,
  );
  const variants = rows.flatMap((row) =>
    row.variantId ? [row.variantId] : [],
  );
  const summaries = variants.length
    ? (
        await db.query<{
          variantId: string;
          lowestCents: number | null;
          sellerCount: number;
          demo: boolean;
        }>(
          `SELECT l.variant_id AS "variantId",min(COALESCE(l.sale_cents,l.unit_price_cents)) AS "lowestCents",count(DISTINCT l.seller_id)::integer AS "sellerCount",bool_or(l.demo_batch_id IS NOT NULL OR s.demo_batch_id IS NOT NULL) AS demo FROM troc.listings l JOIN troc.seller_accounts s ON s.id=l.seller_id WHERE l.variant_id=ANY($1::uuid[]) AND l.status='active' AND l.quantity>0 AND s.status='active' AND s.country='CA' GROUP BY l.variant_id`,
          [variants],
        )
      ).rows
    : [];
  for (const row of rows)
    if (row.variantId) {
      const summary = summaries.find(
        (value) => value.variantId === row.variantId,
      );
      row.lowestCents = summary?.lowestCents ?? null;
      row.sellerCount = summary?.sellerCount ?? 0;
      row.demo ||= !!summary?.demo;
      const product = illustrated.find((value) => value.id === row.id);
      row.imageUrl = product ? artwork(product, row.variantId) : null;
    }
  return group(query.query, locale, rows);
}
