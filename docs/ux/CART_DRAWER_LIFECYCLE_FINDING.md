# Cart drawer lifecycle finding DCD01 — open

Author synthetic reproduction, current uncommitted drawer after423638d. tests/cart-drawer-pending-repro.mjs deliberately reproduces the defect; exit0 means repro assertions succeed, NOT feature acceptance.

GET authenticated cart returns one fixture line. Removing the last line writes local [] and sends one PUT[] held pending. Close drawer, reopen (new controller by approved design). GET still returns old server line. Existing CommerceApp bootstrap checks !readCart().length and restores it, so removed item returns before PUT finishes. Output puts1/restored1. No real account/cart mutation; all commerce requests intercepted. Same underlying rule affects intentional empty state when a saved server cart exists.

Reported to A for exact behavior/storage ownership. Do not fix by hiding the test or keeping two controllers mounted; no release PASS until resolved. Current ordinary drawer samples pass empty/populated/open-close/focus/fallback at390FRdark/1440ENlight/320FRlight, scoped decorative Vaul pseudo-element overflow fixed. DelayedGET/quote/PUT acceptance otherwise remains pending. User new cover-crop feature stays separate backlog.

Author correction: canHydrateCart checks for a confirmed absent local storage key at GET response time. Existing valid empty/nonempty values preserve intent; malformed existing values and denied storage conservatively do not authorize replacement. No new marker or server changes. tests/cart-bootstrap.test.ts passes missing/empty/nonempty/malformed/denied and response-time edit cases. tests/cart-bootstrap-preview.mjs reproduces delayedPUT[] staleGET on route and --drawer and now verifies no restored line, one PUT only. This replaces the original temporary repro script; independent B retest still required. Drawer shell remains a separate uncommitted candidate.

## DCD02 — stale quote after failed quantity refresh (open)

Author intercepted request reproduction tests/cart-drawer-quote-repro.mjs: qty1 quote1.05CAD eligible; increase to2; refreshed quote503. Existing quote stays displayed1.05 and Simulated checkout is enabled after busy becomes false, despite changed local lines. This is reproducible controller behavior, not real checkout execution. Repro exit0 confirms defect assertions, not feature PASS. Reported to A for exact freshness/retry ownership. Proposed stale estimate labeling/disabled quote-dependent actions and read-only quote retry, preserving requested lines/coupon; no PUT or checkout replay.

DCD02 author correction frozen5991b22; see CART_QUOTE_FRESHNESS_HANDOFF.md and tests/cart-quote-freshness-preview.mjs. Repro file name above is historical. Independent B review pending; source/author PASS does not close independent gate.
