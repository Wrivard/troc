# Real publication lifecycle

## Publication lifecycle verified locally — September25

Real EN1440/FR390 synthetic owner UI publication -> actual commerce quote applies target promotion -> UIwithdrawal -> original quote total restored -> replay old publish request does not reactivate. Uses existing synthetic listing/coupon and read-only quote endpoint; no cart persistence, reservation, payment or stock mutation. Test-only rules and drafts removed, original rule collection preserved, audit receipts retained. Evidence docs/evidence/publication-real/check.json.

Closed a late-read hazard in review modal: sequence guards invalidate reads on close and ignore older read responses on reopen; clear stale snapshot while reading. Intercepted EN/FR delayed first read after newer reopen retains latest choices. Frontend types/scoped lint/client+SSR build pass. Evidence stale-read.json; API39372unchanged.

Checkout source review: loadCommerce reads seller rules before quote calculation; quote stored in order snapshot. Publication locks seller/settings/draft; it never rewrites existing orders. No new seller lock added to buyer/listing checkout lock order. Native concurrent publish/checkout withdrawal timing remains unverified; local sequential lifecycle and source review are not concurrency certification. Existing paid snapshots remain by design; pending checkout snapshot policy needs explicit acceptance before claiming full readiness.

NEXT ready batch: reconcile E4.5 spend-threshold and free-shipping seller controls against current Settings and commerce validation, design missing fields and exact CAD contract before bounded implementation. Quantity/coupon scheduled publication foundation delivered locally; negotiate-offer workflow remains separate. Native concurrency and broader operational acceptance remain gates.146IDs preserved; no production/remote/source expansion or real transactions.
