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
): Promise<PublicPage> {
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
  const meta = await repo.metadata(f);
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
    const result = await repo.search(f);
    page.results = result.items;
    page.nextCursor = result.nextCursor;
  }
  if (kind === "store") page.seller = meta.sellers.find((s) => s.slug === slug);
  const actualMeta = await repo.metadata(
    f,
    page.results.map((result) => result.product),
  );
  page.games = actualMeta.games;
  page.sets = actualMeta.sets;
  const illustrated = await repo.images(page.results.map((r) => r.product));
  page.results = page.results.map((r, i) => ({
    ...r,
    product: illustrated[i],
  }));
  if (page.product)
    page.product =
      illustrated.find((p) => p.id === page.product?.id) ?? page.product;
  page.demo =
    page.demo ||
    page.results.some((r) => r.product.demo || r.demo) ||
    page.offers.some((offer) => offer.demo) ||
    page.prices.some((price) => price.demo) ||
    page.sellers.some((seller) => seller.demo) ||
    page.seller?.demo === true;
  return page;
}
