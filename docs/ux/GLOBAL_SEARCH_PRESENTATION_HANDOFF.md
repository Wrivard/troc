# D19 global-search presentation handoff

2026-09-23. Isolated Design presentation candidate; exact source SHA is the commit containing this document. Built on catalogue5f600d5 without altering that candidate's files. Independent UX review and A live integration remain required. No push/deploy.

## Scope and source

Read full GLOBAL-SEARCH-REFERENCE-BRIEF.md and inspected supplied C:/Users/Kolyxe/AppData/Local/Temp/codex-clipboard-ead49ecf-3125-431e-ae37-d154e1fa7627.png. Compact grouped thumbnail/metadata/price rows follow the reference; written requirement governs input-anchored dropdown instead of modal. No backdrop, focus trap, command shortcut claim or fake recent history.

Own files only: artifacts/marketplace/src/modules/global-search/ (component, scoped CSS, isolated harness/fixtures/config/README), tests/global-search-{presentation,accessibility}-preview.mjs and this handoff. No shared header/search callbacks/API/ranking/auth/cart/HomeSections/marketplace.css edits. Approved Input/Button/CardImage/Skeleton/EditorialIcon reused. Existing GlobalSearch cannot express rich destination/price rows without shared changes, so this application composition defines the bounded adapter target.

## Typed wiring contract for A

`GlobalSearchPresentation` accepts:
- locale: en/fr; query: controlled unmodified string; onQueryChange(query): synchronous input callback.
- groups: ordered SearchPresentationGroup[] with kind cards/sets/products/sellers/games, canonical stable result id, real href/title, optional subtitle/detail/imageUrl, optional integer CAD lowestCents and sellerCount. Caller owns localized display strings and true data. Null price is omitted, never invented as zero. Results are capped4cards/2other per group; order retained, empty groups suppressed.
- seeAllHref: optional real group route. total: optional authoritative total; absence displays no count. Do not substitute a visible-page count for total. Do not supply duplicate group kinds or duplicate IDs within a group.
- searchAllHref: REQUIRED real full catalogue URL with base path, locale and encoded rawquery, including separators. Header must replace its plain input once; do not mount a second searchbox or wrap this in another form.
- loading/error: controlled request state; localized safe error string. Loading/error suppress stale groups but retain full-catalogue action. disabled optionally disables input. Adapter must handle debounce (~150–250ms), AbortController/currentness, errors and recent data; none implemented or claimed here.
- onNavigate(href): optional router callback for ordinary activation. Actual anchors retain href; modifier clicks preserve native navigation. Without callback, Enter navigates and click uses native anchor. Query transforms/ranking stay outside the component.

Canonical identifier inspection: lib/catalog Variant.number stores collector numbers; existing header uses plain GlobalSearch with no suggestions and `/search?q=encodeURIComponent(q)`. This presentation preserves slash/hyphen/# input exactly. It does NOT verify exact-match ranking, #normalization, mixed-token matching or API completeness; these are A/B gates. Supplied group routes include actual `/sets/:slug`, `/product/:slug?variantId=...`, `/store/:slug` and `/search`.

Host placement: component wrapper positionrelative, width100%; absolute popup width matches input,8pxgap, max480px and available visualviewport height. Host header ancestors must allow overflow and an appropriate stacking context. EN/FR strings and themes inherit DS tokens. No shared tokens/styles changed. Final shared-header/mobile integration, style-guide registration if adopted as a shared primitive, and integrated focus/overlap checks remain A/Design handoff work.

## Author evidence

PASS marketplace TypeScript; scoped component/harness/test ESLint; isolated Vite production build. Live app not rebuilt because hero is concurrently owned; isolated harness build is not an integrated marketplace build claim.

PASS tests/global-search-presentation-preview.mjs:1440ENdark,834FRlight,390FRdark,320ENlight. Each popup left/width exactly matchesinput,8pxgap,bottom withinviewport,no horizontaloverflow,no dialog. Arrow navigation/Enter real selectedhref; raw#123/167 becomes correctly encoded suppliedsearchURL; query editing clearsselection; Escape frominput and tabbablelink closes/restoresinput; Tab follows real links normally; clearfocus/emptyfocused state; loading/empty/error suppressgroups; outsideclickcloses. Nine options from bounded fixtures.

PASS tests/global-search-accessibility-preview.mjs: scoped axe0violations; ArrowUp wraps to last seller and scrolls it into view; all8unique supplied links resolve through real local catalogAPI with non-not-found kinds; changing query clears stale active option. Axe is not screen-reader certification. Initial test harness corrected to browser.newContext required byaxe. Actual fixture sethref corrected from incorrect singular/set to existing/sets after routecheck failed.

Initial keyboard test reproduced Escape-from-link reopening due focus event; fixed with one-event focus-open suppression and regressionpassed. Initial scripted edit had UTF8 decodefailure beforewrite; corrected encoding. No uncertainty about partialwrites.

## Actual visual inspection

Actually inspected verification/search-1440-en-dark.jpg, search-320-en-light.jpg, search-390-error.jpg, search-seller-scroll.jpg and search-390-loading.jpg. Desktopcompact rows, narrowmobile price/title legibility, visiblebackground, error/skeleton compactness and active seller scroll observed. Other matrix captures (834FRlight,390FRdark,other stateimages) exist but not all visually inspected. Reference image inspected as above. JSON verification/global-search-presentation.json, global-search-accessibility.json, global-search-destinations.json.

## Limits / ownership

Harness explicitly labels fixed approved demo rows: typing does not filter or simulate real ranking. No fake Charizard123/167 dataset, source/license expansion, productioncatalog fetch or invented reputation. Existing demo seller/price data remains fictional. API request cancellation/ranking/query coverage/live header adapter pending A. True200%zoom,otherengines,physicalmobilekeyboard/visualviewport behavior,screenreader and integrated navbar remain open. IndependentUX1 on-demand acceptance pending.

Harness server4314 was started by Design (execsession33303); existing4313/5313 untouched. Setup instructions and fixture provenance in harness/README.md. Coordinator remains owner of concurrent hero layers/signature/assets; no hero source was staged in this candidate. A productde2bf97 canonical CardImage generator correction must be preserved separately during integration.
