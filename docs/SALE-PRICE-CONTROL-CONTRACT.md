# Next E4.5 batch: existing sale-price control

Reuse listings.sale_cents, existing quote sale exclusion and inventory version/reservation guard. Do not create a second discount table. Optional edit field in CAD; blank explicitly clears, omission preserves existing value. Accept positive integer cents <= resulting regular price; reject fractional/negative/overlimit values. Validation must consider simultaneous regular and sale-price change atomically. Update under existing seller/listing locks with existing audit/outbox. Do not bypass photo activation threshold or reserved-stock snapshot guard.

Show regular/sale distinction in inventory row and edit. Export should distinguish regular price and sale price; current price CSV remains regular price to preserve import compatibility. Import remains new-listing/duplicate-review, not update roundtrip. Catalogue/commerce already read sale_cents; verify quote after edit and removal, including no basket discount stacking, unchanged stock and optimistic conflicts. Public display gap must be evaluated before claiming complete sale UX.

No production/fee/payment mutations. Promoted listing percentage and negotiated offers are separate requirements with separate original IDs and gates.
