import type { CheapestOffer } from "@workspace/catalog";
import { catalogRepository, type CatalogRepository } from "./repository";
import { filtersFrom } from "./search";
import { DomainError } from "../shared/domain";

/** Read-only fresh selection. Stock is revalidated by normal cart/checkout flows;
 * this response is neither a reservation nor permission to bypass seller minimums. */
export async function cheapestOffer(
  input: unknown,
  repo: CatalogRepository = catalogRepository(),
): Promise<CheapestOffer> {
  if (!input || typeof input !== "object")
    throw new DomainError("invalid_selection");
  const { path, selection, cart } = input as Record<string, unknown>;
  if (
    typeof path !== "string" ||
    !/^\/product\/[a-z0-9-]{1,200}$/.test(path) ||
    typeof selection !== "string" ||
    selection.length > 2000 ||
    !Array.isArray(cart) ||
    cart.length > 100
  )
    throw new DomainError("invalid_selection");
  const seen = new Set<string>();
  const lines = cart.map((line: unknown) => {
    if (!line || typeof line !== "object")
      throw new DomainError("invalid_cart");
    const { listingId, quantity } = line as Record<string, unknown>;
    if (
      typeof listingId !== "string" ||
      !/^[a-zA-Z0-9-]{1,100}$/.test(listingId) ||
      seen.has(listingId) ||
      typeof quantity !== "number" ||
      !Number.isInteger(quantity) ||
      quantity < 1 ||
      quantity > 100
    )
      throw new DomainError("invalid_cart");
    seen.add(listingId);
    return { listingId, quantity };
  });
  const params = new URLSearchParams(selection);
  const filters = filtersFrom(params);
  const grade = params.get("grade") || null;
  if (grade !== null && !/^[a-zA-Z0-9 .+-]{1,30}$/.test(grade))
    throw new DomainError("invalid_search");
  const product = await repo.product(path.slice("/product/".length));
  if (!product) throw new DomainError("not_found", 404);
  const variantId = params.get("variantId");
  if (
    !variantId ||
    !product.variants.some((variant) => variant.id === variantId)
  )
    throw new DomainError("invalid_variant");
  const result = await repo.detail(product, variantId, {
    filters,
    grade,
    page: 1,
    limit: 1,
    sort: "price_asc",
    cart: lines,
  });
  const offer = result.offers[0] ?? null;
  const seller = offer
    ? (result.sellers.find((value) => value.id === offer.sellerId) ?? null)
    : null;
  if (offer && !seller) throw new DomainError("service_unavailable", 503);
  return { variantId, offer, seller };
}
