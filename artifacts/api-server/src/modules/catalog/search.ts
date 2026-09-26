import {collectorQuery,collectorMatches} from "./collector-search";
import { MAX_CATALOG_PAGE_SIZE } from "@workspace/catalog";
import type {
  CatalogSnapshot,
  ProductResult,
  SearchFilters,
  Offer,
  Product,
} from "@workspace/catalog";
import { DomainError } from "../shared/domain";
export function filtersFrom(params: URLSearchParams): SearchFilters {
  const text = (key: string, max = 100) => {
    const value = params.get(key) || "";
    if (value.length > max) throw new DomainError("invalid_search");
    return value.trim();
  };
  const amount = (key: string) => {
    const value = params.get(key);
    if (!value) return null;
    const n = Number(value);
    if (!Number.isSafeInteger(n) || n < 0 || n > 2147483647)
      throw new DomainError("invalid_search");
    return n;
  };
  const min = amount("min"),
    max = amount("max");
  if (min !== null && max !== null && min > max)
    throw new DomainError("invalid_search");
  const sort = text("sort") || "name";
  if (!["name", "price", "newest"].includes(sort))
    throw new DomainError("invalid_search");
  const limit = Number(params.get("limit") || 12);
  if (!Number.isInteger(limit) || limit < 1 || limit > MAX_CATALOG_PAGE_SIZE)
    throw new DomainError("invalid_search");
  const f = {
    q: text("q"),
    game: text("game"),
    set: text("set"),
    type: text("type"),
    language: text("language"),
    variant: text("variant"),
    rarity: text("rarity"),
    condition: text("condition"),
    seller: text("seller"),
    min,
    max,
    sort: sort as SearchFilters["sort"],
    cursor: text("cursor", 1000),
    limit,
  };
  if (
    (f.type && !["raw_single", "graded_card", "sealed"].includes(f.type)) ||
    (f.language && !["en", "ja"].includes(f.language)) ||
    (f.condition && !["NM", "LP", "MP", "HP", "DMG"].includes(f.condition))
  )
    throw new DomainError("invalid_search");
  return f;
}
const normalized = (value: string) =>
  value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase();
function near(a: string, b: string) {
  if (Math.abs(a.length - b.length) > 1 || a.length < 4) return false;
  let i = 0,
    j = 0,
    edits = 0;
  while (i < a.length && j < b.length) {
    if (a[i] === b[j]) {
      i++;
      j++;
      continue;
    }
    if (++edits > 1) return false;
    if (a.length >= b.length) i++;
    if (b.length >= a.length) j++;
  }
  return edits + (a.length - i) + (b.length - j) <= 1;
}
export function summarize(
  product: Product,
  offers: Offer[],
  prices: CatalogSnapshot["prices"],
): ProductResult {
  const cents = offers.map((o) => o.cents).sort((a, b) => a - b);
  const median = cents.length
    ? Math.round(
        (cents[Math.floor((cents.length - 1) / 2)] +
          cents[Math.floor(cents.length / 2)]) /
          2,
      )
    : null;
  const reference = [...prices].sort((a, b) =>
    b.capturedAt.localeCompare(a.capturedAt),
  )[0];
  return {
    product,
    demo:
      offers.some((offer) => offer.demo) || prices.some((price) => price.demo),
    lowestCents: cents[0] ?? null,
    medianCents: median,
    referenceCents: reference?.cents ?? null,
    quantity: offers.reduce((sum, o) => sum + o.quantity, 0),
    sellerCount: new Set(offers.map((o) => o.sellerId)).size,
  };
}
export function searchSnapshot(data: CatalogSnapshot, f: SearchFilters) {
  // Build request-local indexes: no stale cached stock or prices between searches.
  const games = new Map(data.games.map(g => [g.id, g]));
  const sets = new Map(data.sets.map(s => [s.id, s]));
  const sellers = new Map(data.sellers.map(s => [s.id, s]));
  const offersByVariant = new Map<string, Offer[]>();
  const pricesByVariant = new Map<string, CatalogSnapshot["prices"]>();
  for (const offer of data.offers) {
    const group = offersByVariant.get(offer.variantId) ?? [];
    group.push(offer); offersByVariant.set(offer.variantId, group);
  }
  for (const price of data.prices) {
    const group = pricesByVariant.get(price.variantId) ?? [];
    group.push(price); pricesByVariant.set(price.variantId, group);
  }
  const words = normalized(f.q).split(/\s+/);
  const items = data.products.flatMap((p) => {
    const game = games.get(p.gameId)!;
    const set = sets.get(p.setId)!;
    if (
      (f.game && f.game !== game.slug) ||
      (f.set && f.set !== set.slug) ||
      (f.type && f.type !== p.type)
    )
      return [];
    const variants = p.variants.filter(
      (v) =>
        (!collectorQuery(f.q) || collectorMatches(v.number, p.setId, f.q)) &&
        (!f.language || v.language === f.language) &&
        (!f.variant || v.key === f.variant) &&
        (!f.rarity || v.rarity === f.rarity),
    );
    if (!variants.length) return [];
    const hay = normalized(
      [
        p.name.en,
        p.name.fr,
        game.name.en,
        set.name.en,
        set.name.fr,
        ...p.aliases,
        ...variants.flatMap((v) => [v.number, v.artist, v.rarity]),
      ].join(" "),
    );
    if (
      f.q && !collectorQuery(f.q) &&
      !words.every(
          (word) =>
            hay.includes(word) ||
            hay.split(/\W+/).some((token) => near(word, token)),
        )
    )
      return [];
    const offers = variants.flatMap(v => offersByVariant.get(v.id) ?? []).filter(
      (o) =>
        o.quantity > 0 &&
        (!f.condition || o.condition === f.condition) &&
        (!f.seller ||
          sellers.get(o.sellerId)?.slug === f.seller) &&
        (f.min === null || o.cents >= f.min) &&
        (f.max === null || o.cents <= f.max),
    );
    if (
      !offers.length &&
      (f.condition || f.seller || f.min !== null || f.max !== null)
    )
      return [];
    return [
      summarize(
        { ...p, variants },
        offers,
        variants.flatMap(v => pricesByVariant.get(v.id) ?? []).filter(
          (price) =>
            p.type !== "graded_card" &&
            (price.condition ?? null) ===
              (p.type === "raw_single" ? f.condition || "NM" : null) &&
            (price.grade ?? null) === null,
        ),
      ),
    ];
  });
  items.sort(
    (a, b) =>
      (f.sort === "price"
        ? (a.lowestCents ?? Infinity) - (b.lowestCents ?? Infinity)
        : f.sort === "newest"
          ? (
              sets.get(b.product.setId)?.releasedOn || ""
            ).localeCompare(
              sets.get(a.product.setId)?.releasedOn || "",
            )
          : a.product.name.en.localeCompare(b.product.name.en)) ||
      a.product.id.localeCompare(b.product.id),
  );
  const offset = f.cursor
    ? items.findIndex((p) => p.product.id === f.cursor) + 1
    : 0;
  if (f.cursor && offset === 0) throw new DomainError("invalid_cursor");
  const page = items.slice(offset, offset + f.limit);
  return {
    items: page,
    nextCursor:
      items.length > offset + f.limit ? page.at(-1)!.product.id : null,
  };
}
