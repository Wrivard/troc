# Promotion conflict recovery

## Promotion draft409 recovery — September25

SellerPromotions now offers read-only Load latest drafts on409. Local editor/deletion/browser-import intent retained; latest collection/version/permissions replace only the baseline. Current selected remote draft details are displayed (or absence disclosed). No automatic write: explicit save/delete/import required again, with new retry key and fresh version. Unrelated remote drafts preserved; browser import excludes IDs already present remotely. Recovery read failure preserves edits and allows retry. Existing saved drafts remain planning-only; no live-price/checkout changes.

Six EN1440/FR390 intercepted edit/delete/import cases pass, including recovery503then retry in both edit cases. Assert local form retained, exactly2POST (initial409+explicit retry), new key/version2, remote B retained; import retains remote A and adds C; delete removes only A. Frontend types/scoped lint/client+SSR builds pass. Evidence Troc-UX-Design/docs/evidence/promotions-conflict/check.json; script check-promotions-conflict.cjs. This is intercepted conflict UI evidence, not a fresh real concurrent DB or hosted acceptance test. API10136unchanged.

NEXT coherent batch: verify existing synthetic seller promotion draft version conflict through actual local API with two isolated sessions and UI, preserving preexisting drafts and restoring test-only additions through versioned writes. Then scheduled activation contract/runtime eligibility per docs/SELLER-PROMOTIONS-ACTIVATION-CONTRACT.md; date-only timezone semantics still require an explicit visible contract before activation.146IDs retained; E4.5 partial. No stock/money/source/production/remote changes.
