# UX section 01 — product offer discoverability

Independent source: build-pack UX-AUDIT/01-FICHE-CARTE.md, findings F01–F04. Baseline512a37e; local preview4313/API5313. Status: implemented, independent revalidation pending. No push/deployment from this task; A integrates.

- F01: available-price/printing summary with a first-screen View offers / Choisir une offre action. Keyboard/touch activation focuses and scrolls to seller-offers without changing printing, language or cart. Mobile art is compact; full-image access remains.
- F02: CAD per-card price and shipping-excluded/simulated-combined-shipping explanation beside the action. Reference and median are moved to history context; no delivered-price promise.
- F03: condition code followed by translated meaning rather than repeated code; seller-specific quantity/action accessible names. Stock/minimum/handling values unchanged. Sold-out fixture hides purchase controls.
- F04: success/error message beside its offer; success names quantity/seller and offers View cart. Local storage error cannot show success or success link. Cart persistence/domain behavior unchanged; add is a synchronous local write, not an asynchronous payment submission.

Verification: tests/ux-product-browser.mjs checks 12 viewport/language/theme cases, CTA above fold and44px height, focus jump, seller/quantity persistence, minimum/stock bounds, visible feedback, contrast, overflow, console errors; additional two-printing switch, storage failure, filtered empty and sold-out fixtures. Screenshots verification/ux-01-* remain local. Baseline first Add to cart y1068 desktop and1962 mobile on Alakazam; the explicit offer-selection action now appears around y400/y550, with actual seller selection still required.

70 domain/database tests and lint passed. Full workspace build and typecheck passed. Independent reviewer revalidation is pending. Existing hosted account/database activation limits are untouched. No shared routing, contracts, package/lock, inventory, seller-platform or prelaunch edits.
