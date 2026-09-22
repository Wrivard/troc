# Canonical catalog and seller listings

Status: **In development** for the new inventory integration; existing public catalog implementation is retained.

The audited schema already separates `catalog_products → printings → variants` from `listings`. Products reference games and set releases; printings hold language, collector number and rarity; variants identify finish/attributes. Listings reference a TROC-owned variant UUID and hold seller condition, CAD cents, quantity, SKU and status. Multiple sellers do not create duplicate canonical cards.

External catalog IDs are stored in `external_catalog_mappings(provider, external_id, variant_id)`. Catalog image provenance remains with the existing asset/image tables and approved provider pipeline. Seller CSVs never insert canonical products, printings, variants or external mappings.

CSV matching accepts a variant UUID, an existing external provider mapping, or exact card name plus set slug/code, number, language and finish. Multiple matches require review. Unmatched records require corrected identifiers or separately approved catalog curation. No fuzzy guess is silently published. Graded/sealed item creation remains outside this bounded importer; existing graded listings are preserved.

Photo-required listings are saved as drafts according to the commerce setting photoThresholdCents. Activation requires existing listing photos; the later seller platform will supply the photo-upload workflow. No imported high-value item bypasses this gate.
