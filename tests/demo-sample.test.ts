import { test } from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import sharp from "sharp";
import { sampleProducts } from "../artifacts/api-server/src/modules/catalog/sample/data";
import { BoundedSampleCatalogProvider } from "../artifacts/api-server/src/modules/catalog/sample-provider";
import { validateImport } from "../artifacts/api-server/src/modules/catalog/importer";
import { publicDemoCatalog } from "../artifacts/api-server/src/modules/catalog/public-demo";
test("approved demo sample is bounded, normalized and references correctly sized local artwork", async () => {
  for (const provider of ["tcgdex", "scryfall", "ygoprodeck"] as const) {
    const products = sampleProducts.filter(
      (p) => p.images?.[0].provenance.provider === provider,
    );
    assert.ok(products.length >= 40 && products.length <= (provider === "scryfall" ? 1100 : 75));
    const adapter = new BoundedSampleCatalogProvider(provider);
    let cursor: string | undefined;
    let count = 0;
    do {
      const page = await adapter.records({ limit: 200, cursor });
      page.items.forEach(validateImport);
      count += page.items.length;
      cursor = page.nextCursor;
    } while (cursor);
    assert.equal(count, products.reduce((n,p) => n+p.variants.length,0));
  }
  assert.ok(
    sampleProducts.some((p) => p.variants.some((v) => v.language === "ja")),
  );
  assert.ok(
    sampleProducts.some((p) => p.images?.some((i) => i.side === "back")),
  );
  const checked = new Set<string>();
  for (const product of sampleProducts) {
    assert.match(product.id, /^[a-f0-9-]{36}$/);
    assert.equal(product.demo, true);
    for (const image of product.images ?? []) {
      assert.notEqual(product.id, image.provenance.externalId);
      assert.ok(image.sources.length >= 2);
      for (const source of image.sources) {
        assert.match(source.url, /^\/catalog-art\/[a-f0-9]{20}-\d+\.webp$/);
        if (checked.has(source.url)) continue;
        checked.add(source.url);
        const file = await readFile(
          new URL(
            "../artifacts/marketplace/public" + source.url,
            import.meta.url,
          ),
        );
        const meta = await sharp(file).metadata();
        assert.equal(meta.width, source.width);
        assert.equal(meta.format, "webp");
        assert.ok(
          Math.abs(meta.width! / meta.height! - image.width! / image.height!) <
            0.004,
          "rendition must preserve full-card aspect",
        );
      }
    }
  }
  const data = publicDemoCatalog();
  assert.ok(data.offers.some((o) => o.cents === 5));
  assert.ok(data.offers.some((o) => o.cents >= 6500));
  assert.ok(data.offers.every((o) => Number.isInteger(o.cents) && o.demo));
  for (const game of ["one-piece", "riftbound"])
    assert.ok(
      data.products
        .filter((p) => p.slug.startsWith(game))
        .every((p) => !p.images?.length && !p.imageUrl),
    );
});
