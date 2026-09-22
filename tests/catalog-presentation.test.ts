import test from "node:test";
import assert from "node:assert/strict";
import {
  formatSourcePrice,
  productSelection,
} from "../artifacts/marketplace/src/modules/catalog/presentation";
import { demoCatalog } from "../artifacts/api-server/src/modules/catalog/demo";
import { filtersFrom } from "../artifacts/api-server/src/modules/catalog/search";

test("filtered product navigation preserves Japanese printing identity and offer filters", () => {
  const product = demoCatalog().products.find((p) =>
    p.variants.some((v) => v.language === "ja"),
  )!;
  const japanese = product.variants.find((v) => v.language === "ja")!;
  const filters = filtersFrom(
    new URLSearchParams({
      language: "ja",
      variant: japanese.key,
      rarity: japanese.rarity,
      condition: "NM",
      seller: "sample",
      max: "99",
    }),
  );
  const selection = productSelection(product, filters);
  assert.equal(selection.variant?.id, japanese.id);
  assert.equal(selection.params.variantId, japanese.id);
  assert.equal(selection.params.language, "ja");
  assert.equal(selection.params.condition, "NM");
  assert.equal(selection.params.seller, "sample");
  assert.equal(selection.params.max, "99");
  assert.equal(selection.params.cursor, undefined);
});

test("source currency prices use currency minor units for EN and FR", () => {
  for (const locale of ["en", "fr"] as const) {
    for (const [currency, minor, major] of [
      ["JPY", 1000, 1000],
      ["CAD", 1234, 12.34],
      ["KWD", 1234, 1.234],
    ] as const) {
      assert.equal(
        formatSourcePrice(minor, currency, locale),
        new Intl.NumberFormat(`${locale}-CA`, {
          style: "currency",
          currency,
          currencyDisplay: "code",
        }).format(major),
      );
    }
  }
});
