import { createHash } from "node:crypto";
import type { CatalogSnapshot } from "@workspace/catalog";
import { demoCatalog } from "./demo";
import { sampleProducts, sampleSets } from "./sample/data";
const uuid = (key: string) => {
  const h = createHash("sha256")
    .update("troc-demo-offer:" + key)
    .digest("hex");
  return `${h.slice(0, 8)}-${h.slice(8, 12)}-4${h.slice(13, 16)}-8${h.slice(17, 20)}-${h.slice(20, 32)}`;
};
/** Bounded, explicit demo adapter. Prices/stock/sellers are never provider market data. */
export function publicDemoCatalog(): CatalogSnapshot {
  const data = demoCatalog();
  const offers = sampleProducts.flatMap((product, index) =>
    product.variants.flatMap((variant, variantIndex) =>
      data.sellers.map((seller, sellerIndex) => {
        const common = /common|uncommon/i.test(variant.rarity);
        const base = common
          ? [5, 10, 25, 50, 75][index % 5]
          : [250, 1200, 6500, 15000][index % 4];
        return {
          id: uuid(variant.id + seller.id),
          variantId: variant.id,
          sellerId: seller.id,
          condition: (["NM", "LP", "NM"] as const)[sellerIndex],
          cents: base + sellerIndex * 5 + variantIndex * 10,
          quantity: 20 + sellerIndex * 10,
          grade: null,
          photos: [],
          demo: true,
        };
      }),
    ),
  );
  return {
    ...data,
    sets: sampleSets,
    products: sampleProducts,
    offers,
    // No invented historical market prices: only seller listings are simulated.
    prices: [],
  };
}
