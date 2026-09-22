import type { Product, Variant } from "@workspace/catalog";
/** A variant's own art takes precedence; never mix another variant's back/front. */
export function imagesForVariant(product: Product, variant?: Variant) {
  return variant?.images?.length ? variant.images : (product.images ?? []);
}
