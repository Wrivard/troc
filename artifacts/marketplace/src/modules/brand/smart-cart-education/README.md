# Smart Cart collection education

Presentation-only extension to the frozen 11f699c educational page. Uses approved Button, Checkbox, CardImage and theme tokens. It adds no reusable design-system primitive, controller, API or persisted state.

## Preview

From repository root:

```sh
node artifacts/marketplace/src/modules/brand/smart-cart-education/harness/prepare.mjs
```

This reads Git commit 11f699c and generates ignored baseline files. Run before type checking a clean checkout. The baseline copy alone receives an optional collectionExercise ReactNode slot before the final review section.

From artifacts/marketplace:

```sh
pnpm exec vite --config src/modules/brand/smart-cart-education/harness/vite.config.ts --configLoader runner
```

Preview: http://127.0.0.1:4316/?lang=fr&theme=light (also en/dark). To build, use the same command with `vite build`. From repository root, run `node tests/smart-cart-education-preview.mjs` with the preview running.

## Fixture provenance

Four existing bounded-demo Pokemon Obsidian Flames records were snapshotted from the local 4313 catalogue endpoint, set slug pokemon-obsidian-flames-en-a089561b, max=99. Canonical IDs, bilingual names, collector numbers and existing /catalog-art/ paths are retained. No external catalog import occurred. Artwork comes from the existing variant images. Existing names are identical in both locales; no translated card names were invented.

Amoonguss #010 is owned only in this example. Bellossom #003 (10 cents), Bounsweet #016 (75 cents), Combee #008 (10 cents) are selectable missing cards. These fixed illustrative amounts are not current offers. The four-card excerpt never represents the entire set. Shipping is a fixed 400-cent illustration, zero without selections. All arithmetic uses integer cents/CAD. Consumers must supply the same bounded, valid fixture shape; this is not an untrusted-data ingestion interface.

The exercise stores nothing and cannot change a cart or collection. Cheapest-first example selection is explicitly not an optimizer result. Actual offers, stock, conditions, minimums, tax, quotes, alerts and purchases are outside this component.
