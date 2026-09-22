import type { Locale, Product, SearchFilters } from "@workspace/catalog";

export function productSelection(product: Product, filters: SearchFilters) {
  const variant = product.variants.find(
    (v) =>
      (!filters.language || v.language === filters.language) &&
      (!filters.variant || v.key === filters.variant) &&
      (!filters.rarity || v.rarity === filters.rarity),
  );
  const params: Record<string, string> = {};
  for (const key of [
    "language",
    "variant",
    "rarity",
    "condition",
    "seller",
    "min",
    "max",
  ] as const) {
    const value = filters[key];
    if (value !== "" && value !== null) params[key] = String(value);
  }
  if (variant) params.variantId = variant.id;
  return { variant, params };
}

export function formatSourcePrice(
  minorUnits: number,
  currency: string,
  locale: Locale,
) {
  const formatter = new Intl.NumberFormat(`${locale}-CA`, {
    style: "currency",
    currency,
    currencyDisplay: "code",
  });
  // Currency formatters without significant-digit options always resolve this.
  const digits = formatter.resolvedOptions().maximumFractionDigits!;
  return formatter.format(minorUnits / 10 ** digits);
}
