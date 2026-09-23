# Compact cart drawer reference pass

Base9bf248f. Presentation-only candidate; A sole integrator/pusher. Full CART-DRAWER-REFERENCE-BRIEF.md read and supplied Temp/codex-clipboard-c58b60c5-00dd-4349-b4d8-2804fa9d62a9.png actually inspected. Existing previews reused, no restart. No asset/catalog/backend/provider edits.

## Result

- Existing right-side Drawer remains620px maximum/full-width mobile. Header/full-cart link/close primitive and focus return retained. Removed duplicate header Smart Cart disclosure; existing real Smart Cart destination remains in summary.
- CartGroups adds optional compact presentation used only embeddedCart. Seller metadata, shipping, minimum/promotion details, exact-listing/seller locks and existing discovery links consolidated into native More seller options disclosure. Current items remain collapsible; pagination and change/removal/quantity/lock callbacks preserved. Full cart/Smart Cart defaults retained.
- Seller progress reuses approved Progress. Per group show outstanding canonical seller minimum first, otherwise applicable canonical free-shipping progress, otherwise actual nextPromotion. No invented5%/10% milestones. Supplied screenshot amounts/promotions never hardcoded. Null freeShippingRemainingCents remains inapplicable.
- Seller list scrolls separately from persistent summary; review action remains visible during list scrolling and coupon expansion. Neutral token surfaces/borders, smaller images/rows, price without redundant line-total prefix, compact tax explanation. Zero-value discount and unavailable tax row omitted in embedded view only; all actual amounts/discounts and before-tax semantics retained. Minimum blocking explanation/anchors/aria-describedby and quote freshness/error/disabled expressions unchanged.
- Demo disclosure remains in populated summary and empty cart. Existing approved CartItem/CartSellerGroup/Progress/OrderTotals/Drawer primitives reused; no new standalone design-system component or dependency.

## Verification

- Typecheck PASS, lint PASS, client/SSR builds PASS.
- CommerceApp function from declaration to main return is byte-equivalent to9bf248f (normalizing line endings); only new Progress import and render branch changed. Existing callbacks/disabled/eligibility expressions retained. A's7bd8d0f controller correction not cherry-picked; A integrates separately.
- tests/cart-drawer-polish.mjs PASS4cases1440ENdark,768FRlight,390FRdark,320ENlight at900height. Actual existing Pidgey offers from three branded demo sellers; no invented listings. One then three sellers, quantity1->20,22cards total, lock checked/storage asserted, remove/reopen persistence, hidden seller options, coupon open/review in viewport, list scroll/review+close in viewport, no horizontal overflow. Actual quote endpoint used; cart persistence unauthorized response/event endpoint intercepted locally, checkout/SmartApply blocked with0requests. No live authenticated write or checkout executed.
- Existing tests/cart-drawer-preview.mjs PASS9cases at320/390/1440,ENFR,themes,including844height mobile:empty/filled,close/Escape/backdrop,focus return/trap,minimum explanation,full-cart navigation/no recursive drawer. No repeated unchanged CardImage suite.
- Local results:verification/cart-polish.json. Captures cart-polish-one-* and cart-polish-three-* .jpg; existing drawer-*/drawer-summary-* .png. Do not commit screenshots.
- Actually inspected supplied reference; initial1440FRdark/320FRlight (caught excessive density); next1440ENdark3seller/320ENlight1seller/390FRdark3seller (caught inherited double padding/border token); FINAL1440ENdark3seller/320ENlight1seller after correction. Other final screenshots captured/measured only.

## Independent acceptance / limits

UX1 reference/render/journey retest and B behavior review through A remain required. Source scope: CartDrawer.tsx,CartGroups.tsx,CommerceApp return/import,scoped marketplace.css,new test/this handoff. A should merge with its controller candidate and run affected freshness/delayed request tests; author viewport checks are not concurrency certification. Many distinct line items/pagination >10,short landscape,real200%zoom,other browser engines and hosted/authenticated persistence were not newly verified. No production approval or GitHub push claim. Existing missing genuine Riftbound back and other full-platform queue remain separate.
