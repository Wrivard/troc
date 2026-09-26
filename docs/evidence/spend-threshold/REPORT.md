# Spend-threshold complete local journey

## Spend-threshold promotion journey — September25

Optional minimumCents added to saved draft schema, planner and publication conversion; omitted legacy drafts remain valid. CAD text accepts dot/comma with at most2decimals and integer-cent bounds0..100000000. Quantity AND spend semantics explained in form and publication review (merchandise before basket discounts/shipping/tax). Existing commerce engine reused; no duplicate calculation. Pure illustration explicitly not an eligibility quote. Conflict form retains raw spend edits.

12publication/commerce tests pass: omitted/invalid amount handling, quantity-alone rejection, just-below threshold rejection, exact-cent acceptance and sale exclusion; existing transaction regressions pass. EN/FR intercepted old-draft edit12,50->1250save passes. Real EN1440/FR390 local publish with spend threshold -> below threshold no target discount -> exact threshold discount -> withdraw restores total -> replay no reactivation passes. Test-only rules/drafts removed; no order/payment/stock mutation. Evidence docs/evidence/spend-threshold*/. API/frontend types/scoped lint/API/client+SSR builds pass.

Deliberate API39372->47756restart applies tested0029and loads new schema/services; APIreadiness confirmed. Initial test ran before startup completed and got500; readiness precondition added, corrected real run passed. No seller level or free-shipping threshold changed persistently.0029now applied locally only.

NEXT coherent batch: free-shipping eligible disposable seller Settings->loadCommerce->quote round-trip covering exact threshold after discount, zero/null/level downgrade and public policy consistency, then reconcile remaining E4.5 negotiated-offer requirement versus delivered buyer messaging and seller controls. Native concurrency/pending-checkout policy and hosted acceptance remain separate.146IDs retained; remote/production/source/stock/money holds unchanged.
