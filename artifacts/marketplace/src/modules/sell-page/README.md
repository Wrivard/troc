# Sell-page complementary presentation

D29 bounded supplement, not a new routed page or controller. Preserve the existing InformationPages /sell intro, seller benefits, CatalogPreview and global chrome at integration. Insert SellPageDetails after existing benefit sections; remove the old redundant CTA pair for /sell only once the new founding CTA is present. Do not change other InformationPages branches. Component headings start at h2; the host owns h1.

Props: locale en/fr, fees:SellerFeePresentation, foundingHref, smartCartHref. Parent supplies localized destinations and a safe public projection of the actual fee configuration. The production component imports no server modules, uses no fetch/storage, and never computes a payout. `mode: demo` intentionally limits this copy to the current simulation. Do not change to live by casting: live release requires verified policy and revised status copy.

Only the development harness imports commerceConfig from api-server/src/modules/commerce/config.ts. It shows current800bps merchandise,0shipping,200promoted and290processing+30cents. The actual fee calculation deducts discounts, attributes promotion charges to promoted items and allocates processing across seller orders (not a fixed fee per card). No calculator or independent magic-number schedule was added. Planned zero-listing/no-buyer-service model comes from locked decisions, not an implemented fee claim. Real processing terms/taxes and program approval stay explicit gates.

From artifacts/marketplace run `pnpm exec vite --config src/modules/sell-page/harness/vite.config.ts --configLoader runner`; append build after vite to build. Preview4318 supports ?lang=fr&theme=light and en/dark. From repo root run `node tests/sell-page-details-preview.mjs`. Existing dependencies only.

Harness shows only the new supplement with the existing title, not the full existing storefront/chrome. Both navigation URLs point to current4313 routes; no application or lead is submitted. No new asset, configuration, route or backend change.
