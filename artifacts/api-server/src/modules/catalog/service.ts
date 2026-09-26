import type { PublicPage } from "@workspace/catalog";
import { filtersFrom } from "./search";
import { catalogRepository, type CatalogRepository } from "./repository";
import { DomainError } from "../shared/domain";
import { resolveListingPhotos } from "../storage/listing-photos";
import type { OfferSort } from "@workspace/catalog";
export async function publicPage(
  path: string,
  params: URLSearchParams,
  repo: CatalogRepository = catalogRepository(),
  onTiming?: (stage: string, duration: number) => void,
): Promise<PublicPage> {
  const timed = async <T>(stage: string, operation: () => Promise<T>): Promise<T> => {
    const start = performance.now();
    try { return await operation(); } finally { onTiming?.(stage, performance.now() - start); }
  };
  if (
    !/^\/(?:search|games\/[a-z0-9-]+|sets\/[a-z0-9-]+|product\/[a-z0-9-]+|store\/[a-z0-9-]+)?$/.test(
      path,
    )
  )
    throw new DomainError("not_found", 404);
  const [section, slug] = path.slice(1).split("/");
  const kinds: Record<string, PublicPage["kind"]> = {
    games: "game",
    sets: "set",
    product: "product",
    store: "store",
    search: "search",
  };
  const kind = kinds[section] ?? "home";
  const f = filtersFrom(params);
  if (kind === "home" && !params.has("sort")) f.sort = "price";
  if (kind === "game") f.game = slug;
  if (kind === "set") f.set = slug;
  if (kind === "store") f.seller = slug;
  const offerPage = Number(params.get("offerPage") || 1);
  const offerLimit = Number(params.get("offerLimit") || 20);
  const offerSort = params.get("offerSort") || "price_asc";
  const selectedGrade = params.get("grade") || null;
  if (
    !Number.isInteger(offerPage) ||
    offerPage < 1 ||
    offerPage > 10000 ||
    !Number.isInteger(offerLimit) ||
    offerLimit < 1 ||
    offerLimit > 50 ||
    !["price_asc", "price_desc", "quantity"].includes(offerSort) ||
    (selectedGrade !== null && !/^[a-zA-Z0-9 .+-]{1,30}$/.test(selectedGrade))
  )
    throw new DomainError("invalid_search");
  const [meta, browse] = await Promise.all([timed("metadata", () => repo.metadata(f)), kind === "product" ? Promise.resolve(null) : timed("search", () => repo.search(f))]);
  const page: PublicPage = {
    kind,
    path,
    locale: params.get("lang") === "fr" ? "fr" : "en",
    demo: repo.demo,
    filters: f,
    ...meta,
    results: [],
    nextCursor: null,
    offers: [],
    prices: [],
    offerPage,
    offerLimit,
    offerSort: offerSort as OfferSort,
    nextOfferPage: null,
    selectedGrade,
  };
  if (
    (kind === "game" && !meta.games.some((g) => g.slug === slug)) ||
    (kind === "set" && !meta.sets.some((s) => s.slug === slug)) ||
    (kind === "store" && !meta.sellers.some((s) => s.slug === slug))
  )
    throw new DomainError("not_found", 404);
  if (kind === "product") {
    const product = await repo.product(slug);
    if (!product) throw new DomainError("not_found", 404);
    const selected = params.get("variantId") || product.variants[0]?.id;
    if (!product.variants.some((v) => v.id === selected))
      throw new DomainError("invalid_variant");
    const detail = await repo.detail(product, selected, {
      filters: f,
      page: offerPage,
      limit: offerLimit,
      sort: offerSort as OfferSort,
      grade: selectedGrade,
    });
    page.product = product;
    page.selectedVariantId = selected;
    page.offers = await Promise.all(
      detail.offers.map(async (offer) => ({
        ...offer,
        photoUrls: await resolveListingPhotos(offer.photos),
      })),
    );
    page.prices = detail.prices;
    page.results = [detail.summary];
    page.sellers = detail.sellers;
    page.nextOfferPage = detail.nextOfferPage;
  } else {
    page.results = browse!.items;
    page.nextCursor = browse!.nextCursor;
  }
  if (kind === "store") page.seller = meta.sellers.find((s) => s.slug === slug);
  const actualMeta = await timed("context", () => repo.metadata(
    f,
    page.results.map((result) => result.product),
    meta,
  ));
  page.games = actualMeta.games;
  page.sets = actualMeta.sets;
  const illustrated = await timed("artwork", () => repo.images(page.results.map((r) => r.product)));
  page.results = page.results.map((r, i) => ({
    ...r,
    product: illustrated[i],
  }));
  if (page.product)
    page.product =
      illustrated.find((p) => p.id === page.product?.id) ?? page.product;
  if (page.product) {
    page.relatedProducts = [];
    const set = page.sets.find((value) => value.id === page.product?.setId);
    if (set) {
      // A small independent set query: never inherit a product's seller/price/variant filters.
      const relatedFilters = filtersFrom(
        new URLSearchParams({ set: set.slug, limit: "7" }),
      );
      const related = await repo.search(relatedFilters);
      const seen = new Set([page.product.id]);
      const items = related.items
        .filter((item) => {
          if (item.product.setId !== set.id || seen.has(item.product.id))
            return false;
          seen.add(item.product.id);
          return true;
        })
        .slice(0, 6);
      const images = await repo.images(items.map((item) => item.product));
      page.relatedProducts = items.map((item, index) => ({
        ...item,
        product: images[index],
      }));
    }
  }
  page.demo =
    page.demo ||
    page.results.some((r) => r.product.demo || r.demo) ||
    (page.relatedProducts?.some((r) => r.product.demo || r.demo) ?? false) ||
    page.offers.some((offer) => offer.demo) ||
    page.prices.some((price) => price.demo) ||
    page.sellers.some((seller) => seller.demo) ||
    page.seller?.demo === true;
  return page;
}
