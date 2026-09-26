# Sale-price parity evidence

## Sale-price local journey delivered - September 25

E4.5 sale-price control now locally activated and tested. EN1440/FR390 intercepted UI covers set625cents, reopen and clear; real local UI repeats set/clear on isolated zero-stock listings, validates database sale value, regular1000price and unchanged zero quantity, then archives only test fixtures with sale cleared. Synthetic login200 verified before real flow. API47756 deliberately replaced by owned API57684; migration0030 applied locally. No production changes. Evidence docs/evidence/sale-price-parity/ui.json and real-ui.json; scripts/check-sale-price-ui.cjs and check-sale-price-real.cjs.

Additional tests prove reserved listings reject sale edits and EN/FR suggestions report effective sale cents for the same canonical variant. An initial test incorrectly assumed suggestions choose the first product variant; corrected fixture selects the canonical sorted variant rather than changing production identity. Inventory17 tests pass; catalogue21 pass; scoped lint and prior types pass; client+SSR builds pass. Failed intermediate logs retained. No native concurrency or million-listing query-plan certification claimed; effective-price expression needs representative scale evidence before a new index is justified. Public API exposes effective price, not a new regular-price strikethrough UI.

Sale-control batch locally delivered; E4.5 remains Partial. Next: promoted-listing percentage contract from original scope. Existing promoted_attributable boolean and global200basis-point fee are attribution/fee implementation, not seller percentage consent or campaign controls. Preserve money authority; do not activate seller-selectable fees without approved bounds/attribution policy. All146IDs maintained; remote/hosted/native gates unchanged.

