# Next presentation correction prepared

Observed on the deeper pass, application d862a55. P3 bilingual singular-count copy only:

- Search Pidgey result: EN '1 products on this page' in auditor capture137-search-1440-en-light-Pidgey.png. PublicMarketplace.tsx result count should use product/produit for exactly one.
- Store product tile: FR '1 vendeurs' in author Maple storefront catalog render. Same file availability should use seller/vendeur for exactly one, retain existing counts and availability meaning.
- Cart seller group with one card: FR '1 exemplaires' in author live demo Nord/Maple render. CartGroups.tsx seller heading and item disclosure should use unit/exemplaire for exactly one.

Product/search/cart source remains frozen pending current independent cart retest. These are actual rendered grammar issues, not changes to counts, calculations, API or card identity. Apply a narrow display-only correction after safe handback, then check one/many EN/FR and ask auditor for scoped revalidation. Existing plural translation keys remain compatible; no shared translation/schema expansion needed. No implementation claimed in this note.
