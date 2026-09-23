# Homepage Smart Cart reference handoff

Baseline e7059e6. Existing homepage section refined; no controller changes.

Shared SmartCartComparison now accepts opt-in panels variant, used by HomeSections and the style-guide editorial example. Default plain variant remains unchanged for SmartCartDemo. Neutral outer/card borders, restrained red recommended border/saving, explicit totals, equal desktop panels, wide savings/disclosure block, tablet stacking and full-width mobile cards with transition arrow. Original copy, CTA route, integer-cent inputs and arithmetic preserved:675+750=1425;722+400=1122;303saving,47more cards/350less shipping,30-card demo.

Validation: marketplace typecheck PASS; lint PASS after correcting browser globals in new test; client+SSR builds PASS. Six viewport/locale/theme cases in tests/smart-reference-preview.mjs PASS (1672ENdark,1440FRlight,834ENdark,390FRdark,390ENlight,320FRlight): totals/disclosure, equal panels/stacking, no document overflow, keyboard CTA focus and original destination. First run used stale build and failed mobile stacking; rebuilt before final checks. Actual supplied reference plus final desktop1672,tablet834,mobile390FRdark JPEGs inspected. Visual findings (raw HSL border token and inherited hidden arrow) fixed and rechecked. Other three screenshots captured, not visually inspected. Evidence verification/smart-reference.json and smart-reference-*.jpg stays local.

Existing tests/smart-cart-demo-preview.mjs verifies plain interactive demo amounts, keyboard/steps/reset, cart bytes and zero network writes across ENFR/themes/390and1440. Independent UX and final A integration remain open. No deployment/push.
