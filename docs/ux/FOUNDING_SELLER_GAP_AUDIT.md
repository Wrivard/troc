# D30 founding-seller page gap audit — no implementation

2026-09-23. Audit-only as assigned. No program rules, application handlers, schema, perks, counters or UI changed. Current Design base fed4e4f; read A current code as noted below. This is a gap/claim inventory, not independent program or production approval.

## Sources and evidence

Read root MILESTONE-5.5.md, 08_SELLER_PLATFORM.md founding section, 01_LOCKED_PRODUCT_DECISIONS.md founding/fees, MASTER-CHECKLIST E4.7/E5.5; current InformationPages /founding-sellers content/process/callout; A modules/shared/domain.ts launchPolicy, foundation migration0001 settings; PrelaunchApp/copy.ts, prelaunch service/validation, routes/prelaunch.ts and app.ts wiring. Searches found foundingSellerLimit250 only in launchPolicy and foundation seed, not an implemented qualification/award counter. Do not infer hosted platform_settings values from a migration seed.

Existing4313/founding-sellers French light DOM read, full-page screenshot captured at390 but NOT visually inspected. Existing4313/early-access/seller EN route loaded after hydration; actual heading/form text observed. All nonGET API requests blocked during read-only observation. No form submission, account mutation, interest registration or remote access. This evidence proves a rendered form exists, not service readiness or delivery.

## Supported claims and limits

- Buyer account does not grant seller approval or benefits: preserve.
- Seller application review and approved seller access are separate from expression of interest: preserve and make explicit.
- Program terms/benefits await confirmation: appropriate while no authoritative active reward read model is available.
- Founding limit250 exists as launch default/seed and earlier direction. No observed awarded/remaining-slots count or current hosted campaign state. Never show remaining places or a scarcity countdown.
- Prelaunch seller lead capture and referral attribution code exist; the form says interest is not seller approval and no invitation/badge/financial reward is guaranteed. This does not implement5.5inventory/order qualification, earned rewards or referral dashboards.
- Router readiness requires PRELAUNCH_ENABLED, PRELAUNCH_SCHEMA_READY plus database/runtime prerequisites, app origin and signing key. Values were not inspected; no claim that capture works locally/hosted. Configuration access belongs to A.

## Gaps

1. Existing public page says no waiting-list form exists in this demo and seller application flow is merely planned. The codebase now contains seller application and early-access seller-interest routes. A must distinguish implemented, available and program-approved statuses. Current universal absence claim is stale; do not replace it with a universal live claim.
2. Existing last actions send visitors to shopping/help, not a clear status-aware expression-of-interest path. Smallest presentation improvement: three distinct labels (interest / seller application review / program qualification) and an early-access CTA only when A supplies verified availability; otherwise retain an unavailable state. No new form or duplicate lead controller.
3. Program conditions and qualification are not explained beyond approval. Explain only configured requirements once an authoritative read model exists. Root5.5 lists potential criteria, not activated requirements; no invented inventory/order thresholds.
4. Earlier08 and locked decisions promise first250approved sellers Founding badge+Profreeforever. Later5.5 says configurable rewards and do not permanently hard-code economics; MASTER-CHECKLIST E4.7 explicitly requires resolving old forever language before activation while retaining first250direction. This is a real policy/configuration gate, not permission to drop or promise a benefit. Keep neutral benefits copy pending the existing owner/user resolution; do not reopen unrelated locked decisions.

## Smallest next presentation brief (not implemented)

Preserve approved page shell, headline, callout and three-step visual. Replace stale blanket absence copy with accurate separate states supplied by A; add status-aware link to existing /early-access/seller (localized, preserving the existing consent journey) once availability is verified. Link seller application only under the established eligibility/access contract. Explain that registering interest grants no seller/program status. Keep benefits neutral until authoritative campaign configuration resolves earlier-versus-later policy. No fake metrics, perks, dates, rewards, fee waivers or new dashboard.

Acceptance later: source-backed readiness states; ENFR truthfulness; working existing destinations and unavailable/error states; no signup/reward implied by navigation; approved page hierarchy/mobile/themes/keyboard. Policy/read-model readiness gates remain with A/orchestrator. Audit complete; implementation not authorized by this audit-only slice.
