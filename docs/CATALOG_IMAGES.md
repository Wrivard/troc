# Catalog images — Milestone 2.5

Status: image foundations implemented; representative live artwork awaits source approval.

CatalogImage has a canonical TROC ID, side (front/back/detail), dimensions, responsive sources, and provenance (provider, external ID, source URL, license, capture time). External IDs never become catalog IDs. Product images are shared; a variant's own complete image array takes precedence to avoid mixing fronts and backs from different printings.

Migration 0005 separates catalog_images from catalog_image_renditions and links asset_provenance / operator-approved asset_sources. It reserves up to twelve ordered image positions per product/variant. RLS grants SELECT only to the server role, with no client write access. This migration has only been exercised locally, not applied to hosted Supabase.

CatalogAssetProvider resolves one bounded batch per public response, behind CatalogRepository. The PostgreSQL adapter checks approved_at on every read and rejects cross-product variant associations. Legacy imageUrl is cleared on this path so a stale cached projection cannot bypass source revocation. A production importer must validate and persist relationships through the privileged catalog import process; no image-writing HTTP endpoint is exposed.

CardImage remains the approved visual primitive: a fixed 63:88 frame contains uncropped art. Browser srcset/sizes select the supplied renditions, grids load lazily, product details eagerly, and load errors replace the image inside the same frame. CatalogArtwork is an app composition using CardImage and Button, with localized image controls and full-image links. No external card URLs live in React.

## Source decision pending

The attached polish request authorizes representative samples from approved/appropriate sources. Existing docs/references/card-artwork.md explicitly limits the four retained artworks to style-guide illustration. A question requesting limited demo approval for TCGdex, Scryfall and YGOPRODeck remains pending. No new data or artwork has been downloaded or published.

Candidate provider documentation:
- TCGdex: https://tcgdex.dev/assets — WebP, low 245x337 and high 600x825.
- Scryfall: https://scryfall.com/docs/api — provider API rules and usage requirements must be checked before acquisition.
- YGOPRODeck: https://api.ygoprodeck.com/api-guide/ — explicitly requires downloaded/rehosted images rather than continuous hotlinks.

Once approved: acquire a bounded sample through provider adapters, retain a manifest of exact records and provenance, generate/copy sized content-addressed WebP renditions to first-party storage/CDN, give immutable filenames long-lived cache headers, and serve only that manifest. No runtime arbitrary-URL proxy. Never infer a commercial artwork license from an open-source API code license. Production approval remains separate.

Riftbound requires Riot-authorized API assets. No unofficial art is used. One Piece also remains pending an appropriate source; the existing reference image is not treated as a production license.

## Verification

Tests cover ordered rendition retrieval, variant precedence, source revocation, bounded batch reads and fallback behavior. tests/catalog-images-browser.mjs injects existing local reference artwork into isolated Playwright responses only, checks all six public routes in both languages/themes at mobile/tablet/desktop sizes, and exercises gallery controls, broken images and homepage logo links. Its evidence must not be described as live provider imagery.
