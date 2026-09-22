# Cart estimate freshness DCD02

Author correction, 2026-09-22. Independent B review required; no release claim.

Reproduction before correction: qty1 eligible quote CAD1.05, qty2 request503; old amount remained and checkout re-enabled. Earlier temporary cart-drawer-quote-repro.mjs asserted this defect; replaced by cart-quote-freshness-preview.mjs regression.

Request identity now invalidates estimates synchronously for lines/applied coupon/checkout province and explicit retry. Only latest active successful response restores eligibility. Previous amounts are labelled, stale quote-derived item editing is disabled (it would write old quantities); coupon changes and repair/retry remain available. Checkout/optimization/apply buttons and action handlers reject stale input. Smart proposals are tied to their original inputs so a late proposal after a coupon edit cannot become applicable. Quote errors have separate state: estimate retry cannot clear a cart save failure. Quote retry repeats only the quote request; existing analytics remain unchanged.

Author checks: route and drawer intercepted quantity503/retry200, exact quote payload, one held then failed PUT retained, newer coupon success followed by stale200/503, checkout province QC delayed then BC success, drawer remount, delayed Smart Cart proposal after coupon change. No real checkout, auth, mutation, payment or optimization applied. Source inputs/backend calculations/payloads unchanged. Browser checks use Chrome + Playwright, UI4313; commerce APIs intercepted. Latest types/lint/client+SSR build PASS. Tests ran with dirty drawer presentation alongside the separately staged correction; independent exact-commit route retest remains required.

B acceptance: reproduce original red behavior and retest quantity/coupon/province pending/error/retry, input A->B->A, latest-only response, initial no-quote failure recovery, stale proposal/apply, repair recovery, failed save visibility and request counts. Freeze this candidate separately from drawer shell. Drawer UX40/B review remains separate.

DU01 copy follow-up: quote-specific service_unavailable now names the estimate in EN/FR; account/mutation errors retain original mapping. No retry/state/handler logic change. tests/cart-quote-copy-preview.mjs4cases PASS: quote503, account503, both languages, quote retry clears its message. Types/lint/client+SSR PASS. UX48 independent retest required.
