# D02 / D04 — persistent navbar and stats placement

Basea043e6f. Stable candidate uses only HomeSections.tsx,SiteChrome.tsx,scoped marketplace.css plus targeted test/docs. A retains controllers/integration/push. Updated two-implementer COORDINATION and relevant MASTER-CHECKLIST sections read; no new worker spawned, no parked worktree merged.

## Change

D02: existing MarketplaceHeader wrapper stays at viewport top using CSS sticky (retains its normal-flow space). Its ResizeObserver measures only header geometry and sets --troc-header-height for document scroll-padding; cleanup restores prior value. Existing cart/search/auth/theme/locale callbacks unchanged. Portal drawer stays above header. Existing product/full-cart sticky offsets include measured header height. Narrow<=360px controls keep the French navbar to3rows; actual320px height262->158. No nav label/route removed. No new mobile menu invented.

D04: move the exact existing category block before exact existing MarketplaceStats block. Metrics, localization, disclaimer, unavailable/source logic and original assets unchanged. Existing red maple-leaf.webp right/bottom visible at divider; raw alpha bounds prove original700x700asset reachesright699/bottom699, no asset crop/edit. Source copy reserves clear space. Scope limited to homepage composition; style-guide primitives unchanged. This does NOT implement D05marquee or resolve D03Riftbound.

## Checks and visual inspection

- Marketplace typecheck PASS; lint PASS; client and SSR builds PASS. SubsequentCSS-onlypanel offsets rebuiltclient.
- tests/navbar-stats-preview.mjs:5cases1440ENdark/2560FRlight/834FRdark/390ENlight/320FRdark PASS. OriginalENFR stats text captured BEFORE firstbuild inverification/nav-stats-baseline-en/fr.json; final matchesexactly. Do not regenerate baselines against changed copy to manufacture preservation.
- Checks categories precedestats,1pxbottomdivider,leafright0/bottom-1px(borderedge),nooverflow,header y0at1200scroll,skiptarget belowheader,draweraboveheader viahit-test,Escapefocusreturn. Initial stacking assertion ran during existing entrance transition; corrected to wait for actual hit-test condition. Narrowlabel/cart overlap assertion added after actual pixels caughtspecificityissue; finalPASS.
- Product targeted read-only browser check1440EN:headerbottom68,paneltop84; realresize390px updates measured CSSheight. Full-cart offset sourceupdated, not separately exercised with populated fullcart in thisbatch.
- Local evidence:verification/nav-stats.json,nav-product-offset.json,nav-stats-*.jpg,nav-header-*.jpg. Actual inspected initialdesktopdarkstats/narrowFRstats+header,lightultrawidestats,intermediate/final320FRheader. Final320FRheadervisually nooverlap. Other captures measured only. No repeat of prior cart/CardImage matrices.
- Earlierapprovalreadtimedout twice with no process; new currentstatus/ownership read succeeded then sourcework resumed. One typo incommandworkdir failedbeforeprocess/no mutation; correctedactualpath. No unresolvedoperation/restart/config/account change.

## Gates

On-demand UX1 affected D02/D04 review required; A selectiveintegration. Actual200%browserzoom/textresize,cross-engine and broaderroute sticky/focus coverage remain open; no platform/production approval. GitHub gate unchanged; no push/deploy. Continue masterchecklist sequence after bounded findings, preserving frozenCart/CardImage candidates.
