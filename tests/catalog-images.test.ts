import { test } from "node:test";
import assert from "node:assert/strict";
import type { CatalogImage } from "@workspace/catalog";
import { imagesForVariant } from "../artifacts/marketplace/src/modules/catalog/images";
import { demoCatalog } from "../artifacts/api-server/src/modules/catalog/demo";
test("variant images replace shared artwork without mixing front/back from another printing", () => {
  const product = demoCatalog().products[0];
  const image: CatalogImage = {
    id: "canonical-image",
    side: "front",
    url: "/catalog-art/test.webp",
    sources: [{ url: "/catalog-art/test.webp", width: 245 }],
    width: 245,
    height: 337,
    provenance: {
      provider: "fixture",
      externalId: "provider-image",
      sourceUrl: "https://example.invalid",
      license: "test",
      capturedAt: "2026-09-22T00:00:00Z",
    },
  };
  product.images = [image];
  const variant = {
    ...product.variants[0],
    images: [{ ...image, id: "variant-back", side: "back" as const }],
  };
  assert.deepEqual(
    imagesForVariant(product, variant).map((i) => i.id),
    ["variant-back"],
  );
  assert.deepEqual(imagesForVariant(product, product.variants[1]), [image]);
  assert.deepEqual(imagesForVariant({ ...product, images: undefined }), []);
});
