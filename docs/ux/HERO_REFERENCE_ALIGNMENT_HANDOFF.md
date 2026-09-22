# Hero reference alignment correction — UX54

2026-09-22. User rejected previous broad hero acceptance and requested actual fidelity to new1672×941 reference Temp/codex-clipboard-239d084f-a69d-471c-8be8-d4400b529c1f.png. Original assets-for-ui/bg-image-hero-section.png and optimized derivative remain unchanged, including signature. Original three card sources and interaction component unchanged. Seller work paused, no seller edits.

Reference coordinates are approximate raster observations; actual measured in tests/hero-alignment-preview.mjs at1672×941 ENdark/reduced motion.

| Anchor | Reference | Before242ed44 | Corrected |
|---|---|---|---|
| Header bottom / hero top |70/70 |68/143.5 |68/68 |
| Front card transformed box |x1015 y178 ≈335×460 |x1049 y305.5 342×461 |x1015 y176.6 332×450 |
| Search |x95 y525 ≈678×70 |x92 y631.5 744×62 |x92 y524.5 680×70 |
| Primary CTA |y620 ≈198×57 |y717.5 ≈158×52 |y618.5 198×56 |
| Benefits content |≈760 |≈859 |≈760 |
| Bottom label |≈888 |951.7 |886 |

Removed home-only standalone demo band and top padding; truthful fictional seller/price/inventory/no-purchase disclosure remains at top INSIDE hero. Other routes retain existing full notice. Card stage anchored from reference geometry, with width interpolation compensating for supplied background cover crop below1672 desktop. Tablet/mobile use separate framed scene. Background bottom-cover and restrained tonal overlay fade rock before benefits. No recreated maple/smoke/rock/signature. Larger primary/search actions,16/14benefit text and46px square icons reflect new reference, intentionally superseding former38px size while preserving circular shape. Homepage-only header padding/search width refined; no navigation/handler change.

Actual inspected: reference and original background; hero-alignment-before.png,iteration1.png,iteration2.png; side-by-side hero-reference-comparison-overview.png (full resolution comparison also saved); updated hero-cinematic-834-en-dark.png,390-fr-dark.png,1440-fr-dark.png; final1440-fr-dark-final-detail.png and390-fr-dark-final-detail.png. Desktop final source matches inspected iteration2 at1672; last adjustment affects narrower desktop positioning/mobile leading only. hero-alignment-final.png and metrics JSON saved at exact reference viewport.

PASS: exact desktop anchor checks;6hero responsive cases1672ENdark/1440FRdark/1440ENlight/834ENdark/390FRdark/320ENlight (original loaded cards,four benefits,bilingual headline,dark hero,no overflow,localeCTA/Entersearch);3icon cases46×46; marketplace typecheck,workspace lint,client+SSR builds. Harness lint globalThis.getComputedStyle corrected before finalPASS. Local demo API/noDB, no real commerce writes.

Intentional differences: approved TROC font/header functions/original card assets preserved; provided background has Built for Canadians signature instead of reference Collect/Belong lettering. Public notice remains. Independent UX54 exact-candidate reference-fidelity review and A integration required. No push/deploy/platform acceptance.
