# Promoted listings: scope and authority contract

Original scope: 08_SELLER_PLATFORM.md includes promoted listing percentage. 01_LOCKED_PRODUCT_DECISIONS.md allows an attributable percentage. Existing implementation uses listings.promoted_attributable and global config.promotedBps=200; checkout snapshots the calculated promotion allocation into ledger entries. This is not seller consent or a configurable campaign.

Preserve existing fee behavior until a complete policy is accepted. A seller edit must never set promoted_attributable: attribution belongs to a verified buyer discovery/conversion event, not a seller checkbox. Campaign participation, selected basis points and sale attribution are different facts.

A future control needs explicit percentage bounds, eligibility, attributable event definition/window, cancellation timing, treatment of already-created checkout snapshots and refund allocation. Original sources do not define these; do not invent chargeable policy. Use integer basis points and versioned seller consent with exact policy revision. Existing orders retain their fee snapshots. Ordinary inventory edits cannot change those snapshots.

Implementation-ready noncharging work: map missing decisions, identify current fee calculation tests and design review/consent/withdrawal states. Do not expose an apparently live percentage slider backed by the global fixed fee. No migration or change to fee calculations in this contract batch.

Next dependency-ready work while fee policy remains unresolved: consult E4.3 photo/graded eligibility and remaining seller listing requirements; implement only already-defined nonfinancial gaps. Track negotiated offers separately from promotion discounts.
