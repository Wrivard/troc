# Publication review integration

## Publication HTTP and explicit review UI — September25

Added authenticated GET/POST seller/platform/:seller/promotions with no-store. Single-statement read returns live rules/version and saved drafts/version together. Dedicated review modal selects saved draft publication/replacement or existing-rule withdrawal, shows explicit UTC calendar-day start/end including exclusive end instant, requires checkbox confirmation, resets choice after refresh, blocks stale409until rereview. Draft save remains separate; adjusted outdated disconnected/publication copy. Error retry retains same command key; successful mutation rereads current rules. No automatic publishing on draft save.

Focused disposable service tests plus HTTP read/version/no-store/forbidden/invalid-timezone checks pass. EN1440/FR390 intercepted review tests verify unchecked confirm disabled, exclusive end visible,409reread/reselect/reconfirm and fresh version/key. Frontend/APItypes/scoped lint and API/client/SSR builds pass. Evidence docs/evidence/publication-ui/check.json and tests/promotion-publication.test.ts. Not yet real UI publication/withdrawal or native contention acceptance.

Deliberate localAPI10136->39372restart applied tested0028only to isolated persistent DB and loaded schedule runtime; readiness verified. Real authenticated GET200/no-store returns live version0,0rules,draftVersion11,0drafts. No live rule writes performed. No production/remote mutation.

NEXT coherent batch: isolated synthetic local UI publish -> quote eligibility -> withdraw -> no discount -> replay no reactivation, with test-only rule/draft cleanup and preservation of existing rules. Include actual boundaries/paid-order snapshot semantics where feasible; review loadCommerce/checkout linearization separately before claiming concurrency. E4.5 partial;146IDs retained, solo/source/stock/money/remote holds unchanged.
