# D17 Smart Cart application currentness

## Reproduced defect
The authenticated apply endpoint recalculates and saves a SmartResult against current offers. CommerceApp ignored that response and wrote the older comparison's lines into browser storage. In the isolated regression, the server returned fixture-applied but the browser retained fixture-preview. Before output: before.log.

## Correction
Authenticated application now uses the returned SmartResult for lines and quote. Guest application retains the existing local-preview behavior. A failed request preserves the original cart and comparison; retry clears the previous action error. Existing quote-input freshness guards and follow-up quote remain in place.

## Evidence
- tests/smart-apply-currentness.mjs: EN1440/FR390 authenticated and guest (4 cases), all commerce responses intercepted; no real cart POST or purchase.
- Authenticated503 preserves original lines, successful retry uses server lines, existing seller lock/quantity retained, fresh quote receives those same lines.
- Guest makes no apply request and uses its preview lines.
- Existing cart-quote-freshness-preview.mjs passes quantity failure/retry, out-of-order coupon responses, province change, failed save preservation and stale comparison rejection.
- Frontend TypeScript and scoped ESLint pass.
No layout change; no new visual certification. Optimizer algorithm, catalogue identity, stock and payment rules unchanged.
Client+SSR builds pass; existing bundle-size warning retained (.local/smart-apply-build.log).
