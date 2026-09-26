# Promotions draft read recovery

## E4.5 reconciliation and draft read recovery — September25

Confirmed existing server draft planner and commerce rules are distinct: draft dates have no equivalent in live Promotion contract,100drafts versus20live rules, minimum in planner is card quantity. Direct activation would lose schedule semantics. Detailed reuse/dependency contract: Troc-UX-Design/docs/SELLER-PROMOTIONS-ACTIVATION-CONTRACT.md. Keep existing best-single-rule/sale exclusion/threshold calculations; no new pricing engine or live activation.

Fixed initial promotion-draft GET recovery with explicit Retry loading drafts and loading state. Create remains disabled until read succeeds; no reload or mutation replay. EN1440/FR390 intercepted503->200 checks pass: exactly2GET,0POST, editor opens after recovery. Frontend types/scoped lint and client+SSR build pass. Evidence docs/evidence/promotions-read-recovery/check.json. Backend unchanged; API10136retained. No stock/money/external mutations.

NEXT ready batch: promotion draft409 conflict recovery with edited/deletion/import intent preserved and explicit current-server resolution; never overwrite whole remote draft collection automatically. Then dated activation semantics/versioning and quote/checkout parity in documented order. E4.5 remains partial, shipping/spend/negotiated offers separate;146IDs retained. Solo/remote/source/production holds unchanged.
