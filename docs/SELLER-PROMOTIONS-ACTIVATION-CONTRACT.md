# E4.5 promotions reconciliation and activation contract

## Existing foundations — source verified September25

- SellerPromotions.tsx is a bilingual sample/draft planner with server persistence, optional legacy browser-draft import,100draft cap, optimistic version and retry keys. Its minimum is a card quantity, not CAD. Samples are fictional and publishing is explicitly unavailable.
- seller-writes.ts validates percent1-90, minimum1-10000cards, optional uppercase coupon3-24characters, inclusive calendar-date strings and unique coupon/IDs. Draft writes cannot affect seller_settings.promotions.
- Commerce Promotion contains id, minimumCards, minimumCents, basisPoints and optional coupon. No dates/status/timezone/version fields. seller_settings.promotions holds at most20rules. Repository reads it directly; calculation chooses one largest eligible basket discount with deterministic ID tie break, excludes sale-priced lines from discount base, tests quantity AND spend eligibility. Free shipping uses its own seller threshold and discounted merchandise. Seller minimum uses merchandise before promotion.
- Thus direct draft-to-live copying would silently drop dates. Draft count100also differs from live capacity20. Do not activate existing drafts as-is or build another pricing engine.

## Dependency-ordered remaining work

1. Close draft409recovery: preserve edited/deletion/import intent and present current server state with explicit resolution. Never automatically overwrite the full draft collection. Initial GET failure now has read-only retry verified EN/FR.
2. Define a versioned activation command and authoritative dated rule contract. Keep canonical rule IDs and immutable audit; validate maximum20, coupon collisions, bounded basis points/thresholds. Start/end must have explicit timezone semantics visible in UI; do not guess a timezone from province (multiple zones) or silently reinterpret saved date-only drafts. Until specified, preserve draft-only status.
3. Reuse quote/Smart Cart/checkout calculation for preview and activation parity. Evaluate active time with an injected server clock in quote and checkout. Scheduling needs authoritative runtime eligibility, not browser timers. Revalidate at checkout; test expiry at exact boundaries, sale exclusion, best-rule tie, quantity/spend, coupon and free shipping interactions. Existing rules without schedules need explicit backward-compatible behavior.
4. Activation/deactivation must serialize seller changes and use optimistic version/idempotency with no implicit changes to stock, paid orders or existing order snapshots. Review checkout lock order before writing; native contention remains separately gated.
5. Add missing spend and shipping controls only after their contract, permissions and exact CAD validation are verified. Shipping thresholds are not percentage promotions; negotiated buyer offers are not coupon rules. Source review has not established an implemented negotiated-offer workflow.

## Verified scope and holds

This is a source reconciliation and implementation sequence, not production approval. No live-price activation, schema changes or checkout behavior changed in this batch. Existing commerce tests are prior evidence, not rerun certification. Next ready local work is draft409recovery, then activation/time semantics contract implementation under current holds.


Draft409UI recovery implemented;6intercepted EN/FRcases and failed recovery retry pass. Real two-session API/UI verification next.


## Latest implementation supersedes earlier missing-runtime statement
Real two-session EN/FRdraft conflict lifecycle passes, original drafts preserved. Promotion now accepts optional startsAt/endsAt as canonical millisecond UTC instants, both required together; start inclusive/end exclusive; malformed schedules ineligible. Unscheduled rules retain prior eligibility. quoteCart/Smart Cart share a captured server instant per computation.9commerce tests and API build/types pass. No publishing endpoint, stored schedule writes or date-only conversion yet; API10136not restarted. Publication review must explicitly show timezone semantics before converting dates; runtime UTC representation does not decide user-facing calendar timezone.


## Publication service candidate
## Promotion publication command candidate — September25

Added local-only PromotionPublication service: owner/admin current DB access, seller->settings->draft lock order, versioned single-rule publish/unpublish preserving other rules, explicit calendarTimeZone UTC, inclusive draft end converted to next-day exclusive UTC instant,20rule cap and coupon collision checks. Command receipt keyed seller/request/actor persists normalized request+response; same request replay returns prior result without reapplying even after unpublish. Draft version checked before conversion. Audit and receipt atomic with rule update.0028adds existing settings promotion_version and private immutable command receipts/backend-only grants. No HTTP route/UI or persistent activation yet.

2focused tests pass (many transaction assertions): leap-date conversion, missing timezone/invalid date rejection, forged role denied, stale draft/live versions, same-key mismatch, publish/unpublish/replay no reactivation, cap/coupon rejection, audit failure rollback, browser-role table denial. Initial test expected nonexistent anon role; corrected fixture creates an unprivileged role before permission check. APItypes/scoped lint/build pass. Evidence tests/promotion-publication.test.ts and docs/evidence/promotion-publication/REPORT.md. Native contention/hosted certification not claimed. API10136unchanged;0028NOT applied to persistent preview. Do not restart local-accounts casually (it applies pending migrations).

NEXT coherent batch: authenticated publication read/command HTTP contract and review UI. Explicit UTC calendar interpretation and inclusive end-day disclosure, display actual start/end instants; never automatic conversion/activation on draft save. Read live rules/version and draft version, require fresh explicit confirmation, show stale conflict/current state without automatic overwrite. Test permissions/no-store/HTTP and UI before deliberate isolated local activation. Also verify quote/checkout transaction linearization with live-rule update before broader acceptance.146IDs preserved; E4.5 remains partial; stock/money/production/remote holds unchanged.


## Local lifecycle delivery
## Publication lifecycle verified locally — September25

Real EN1440/FR390 synthetic owner UI publication -> actual commerce quote applies target promotion -> UIwithdrawal -> original quote total restored -> replay old publish request does not reactivate. Uses existing synthetic listing/coupon and read-only quote endpoint; no cart persistence, reservation, payment or stock mutation. Test-only rules and drafts removed, original rule collection preserved, audit receipts retained. Evidence docs/evidence/publication-real/check.json.

Closed a late-read hazard in review modal: sequence guards invalidate reads on close and ignore older read responses on reopen; clear stale snapshot while reading. Intercepted EN/FR delayed first read after newer reopen retains latest choices. Frontend types/scoped lint/client+SSR build pass. Evidence stale-read.json; API39372unchanged.

Checkout source review: loadCommerce reads seller rules before quote calculation; quote stored in order snapshot. Publication locks seller/settings/draft; it never rewrites existing orders. No new seller lock added to buyer/listing checkout lock order. Native concurrent publish/checkout withdrawal timing remains unverified; local sequential lifecycle and source review are not concurrency certification. Existing paid snapshots remain by design; pending checkout snapshot policy needs explicit acceptance before claiming full readiness.

NEXT ready batch: reconcile E4.5 spend-threshold and free-shipping seller controls against current Settings and commerce validation, design missing fields and exact CAD contract before bounded implementation. Quantity/coupon scheduled publication foundation delivered locally; negotiate-offer workflow remains separate. Native concurrency and broader operational acceptance remain gates.146IDs preserved; no production/remote/source expansion or real transactions.


## Spend threshold delivered
## Spend-threshold promotion journey — September25

Optional minimumCents added to saved draft schema, planner and publication conversion; omitted legacy drafts remain valid. CAD text accepts dot/comma with at most2decimals and integer-cent bounds0..100000000. Quantity AND spend semantics explained in form and publication review (merchandise before basket discounts/shipping/tax). Existing commerce engine reused; no duplicate calculation. Pure illustration explicitly not an eligibility quote. Conflict form retains raw spend edits.

12publication/commerce tests pass: omitted/invalid amount handling, quantity-alone rejection, just-below threshold rejection, exact-cent acceptance and sale exclusion; existing transaction regressions pass. EN/FR intercepted old-draft edit12,50->1250save passes. Real EN1440/FR390 local publish with spend threshold -> below threshold no target discount -> exact threshold discount -> withdraw restores total -> replay no reactivation passes. Test-only rules/drafts removed; no order/payment/stock mutation. Evidence docs/evidence/spend-threshold*/. API/frontend types/scoped lint/API/client+SSR builds pass.

Deliberate API39372->47756restart applies tested0029and loads new schema/services; APIreadiness confirmed. Initial test ran before startup completed and got500; readiness precondition added, corrected real run passed. No seller level or free-shipping threshold changed persistently.0029now applied locally only.

NEXT coherent batch: free-shipping eligible disposable seller Settings->loadCommerce->quote round-trip covering exact threshold after discount, zero/null/level downgrade and public policy consistency, then reconcile remaining E4.5 negotiated-offer requirement versus delivered buyer messaging and seller controls. Native concurrency/pending-checkout policy and hosted acceptance remain separate.146IDs retained; remote/production/source/stock/money holds unchanged.
