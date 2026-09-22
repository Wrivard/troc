# Bounded demo catalog approval — 2026-09-22

The user explicitly approved TCGdex (Pokémon), Scryfall (Magic), and YGOPRODeck (Yu-Gi-Oh!) for 40–75 representative products per game. Source: attachment 106718b8-c4a0-4d99-bff8-4df3c8a3c394/Pasted text.txt. This is demo/development approval, not permanent production catalog, pricing or image licensing approval.

Implemented sample: 50 Pokémon, 50 Magic, 59 Yu-Gi-Oh! products. Pokémon/Magic include Japanese identities; Magic includes dual-faced full-card artwork. Multiple sets/rarities and supported finishes are represented. The sources do not cleanly expose sealed products through these selected endpoints, so sealed/graded architecture retains explicitly fictional fixtures. One Piece and Riftbound keep fallbacks and do not block Milestone 3 under the latest instruction.

scripts/demo-catalog/providers.mjs contains bounded source adapters. No bulk catalog or crawling is used. JSON/image responses are cached by URL under ignored tmp/catalog-cache; reruns do not refetch cached provider images. Requests are separated by 150ms and bounded by time/response size. scripts/demo-catalog/build.mjs normalizes metadata and rehosts full-card WebP renditions through the first-party static catalog-art store. YGOPRODeck is never hotlinked at runtime. TCGdex uses its low/high assets; other full-card originals generate contained 245px and up-to-600px renditions. No crop, distortion or watermark is applied.

Canonical UUID assignments persist in sample/identities.json. sample/provenance.json records the demo batch, external mappings, original URLs, capture time and rehosted asset URLs; typed sample/data.ts contains the normalized product/printing/variant/image graph. UI consumes only that graph. BoundedSampleCatalogProvider exposes cached records to the existing authorized import pipeline; database provider/source approval is still required before an operator uses it. The published demo uses the explicit snapshot adapter, not an unprovisioned hosted database.

All sellers, listing prices, stock and reference-price histories are fictional CAD examples, prominently labelled as demo. No provider prices are represented as TROC prices or imported as production reference prices. No partnership/endorsement is asserted.

YGOPRODeck supplies card-level reference images rather than reliable edition-specific set-stamp mappings; this limitation is visible in EN/FR metadata. Alternate artwork is not invented as a separate edition. Japanese support is used only where provided.

Image filenames are content-addressed; Vercel serves them with immutable one-year caching. No credentials, cached raw responses or browser profiles are committed. Full-card copyright/artist attribution remains present.
