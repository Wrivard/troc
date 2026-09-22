import type { PublicPage } from "@workspace/catalog";
import { filtersFrom } from "./search";
import { catalogRepository, type CatalogRepository } from "./repository";
import { DomainError } from "../shared/domain";
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
    const detail = await repo.detail(product, selected);
    page.product = product;
    page.selectedVariantId = selected;
    page.offers = detail.offers;
    page.prices = detail.prices;
    page.results = [detail.summary];
    page.sellers = detail.sellers;
  } else {
    const result = await repo.search(f);
    page.results = result.items;
    page.nextCursor = result.nextCursor;
  }
  if (kind === "store") page.seller = meta.sellers.find((s) => s.slug === slug);
  page.demo =
    page.demo ||
    page.results.some((r) => r.product.demo) ||
    page.seller?.demo === true;
  return page;
}
