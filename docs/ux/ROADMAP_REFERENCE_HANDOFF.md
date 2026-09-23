# D36 roadmap reference — frozen candidate handoff

2026-09-23. Priority scope after D34 reconciliation. D34 rejected write never executed; no condition-guide module or InformationPages changes existed at resume. Existing reference and both supplied leaf assets actually inspected. Originals retained, optimized alpha WebP derivatives960square/96×83;244674/3644bytes. Exact hashes in module assets/PROVENANCE.json. Existing page-grain asset reused.

## Route discovery / lease

No /roadmap public route/component existed in Design or A: only docs/product/roadmap.md and unused roadmap CSS class. Existing main dispatcher uses isInformationPage metadata. Orchestrator explicitly authorized minimal InformationPages registration/render seam and SiteChrome footer link in Design only after A response remained pending. Shared behavior/main/router/API/auth/cart/homepage unchanged. Do not add duplicate harness or disconnected demo.

## Factual phase mapping

Visual phases are editorial groups, not new milestones or strict execution ordering. In particular early6.5 work was explicitly authorized before later dependencies. The first two groups use checkmarks only for local implemented subfeatures; neither status nor checks assert hosted/production availability. Current phase is3 (not placeholder reference phase1). Correct sequential phase labels1–6 replace reference duplicatePHASE2. No live label, launch date, invented percentage, reward or unproven shipped milestone.

| Phase | Source milestones | Public status and rationale |
|---|---|---|
|1 Foundations|0,1,2,2.5|Implemented locally: approved design system, canonical IDs, ENFR, bounded sample. Preserve provider/licensing/hosted gates.|
|2 Cards into orders|3,3.5|Implemented locally: multisellercart/deliveredcomparison/simulatedcheckout/CSVtools. Historical3.5appdeployment documented, current authenticated hostedactivation stillpending.|
|3 Prepare for launch|4,6,6.5|In development: bounded seller/prelaunch work exists, broader scope/readiness incomplete. No completion checks for whole-workspace/hostedauth/release.|
|4 Connect sellers|4.5,5.5|Planned: sellerAPI/live-sync/webhooks and configured qualification/referrals. No public integration or foreverperk claim.|
|5 Collect with intent|5,7.5,8.5|Planned: collection/trust/wishlist/demand/alerts and SmartCart expansion. Does not mislabel existing milestone3SmartCart as entirely unimplemented.|
|6 Learn and grow|9.5,10.5|Planned: eligibletransaction-based Canadianmarketdata and collection→marketplace flow. No invented integer7–10 milestones.|

Sources read:16_IMPLEMENTATION_SEQUENCE.md; docs/product/roadmap.md; MASTER-CHECKLIST; PROJECT-DASHBOARD; MILESTONE-REVIEWS/C/ROADMAP-GAP-MATRIX.md (its known audit caveats retained); currentacceptedfrozenDesign/A work. Root specs define scope, not delivery evidence. Snapshot explicitly datedSeptember23,2026; later milestones require status maintenance by integrator.

CTA Follow our journey links to the supported About/story page and has explicit Discover the story helper. No signup/subscription/notification promise or fake success. Brand leaves are decorative, noninteractive; smallleafusedonlysignature, not logo replacement.

## Final author evidence / exact integration

Actual route /roadmap uses existing InformationPages dispatcher/header/footer (no main.tsx or API change). Shared diff is25addedlines in InformationPages: import, metadata key, dedicated render after existing hooks; one localized About-group footerlink in SiteChrome. Preserve all divergent A searchSlot/controller and otherpage hunks. No other InformationPages content or SiteChrome handler changed. New component/CSS/content/assets, test and this doc complete the candidate. Footerlink makes the page discoverable. Existing information-page CSR behavior preserved; no new SSR/SEO guarantee.

PASS marketplace typecheck; scoped ESLint; fullclient2563modules andSSR2463modules builds into verification/roadmap-client androadmap-server, leaving liveoutputs untouched. Existing4313 used; no new harness/process.

PASS8actual cases:1440ENdark,1440FRdark,1672ENdark,2540FRlight,768FRlight,1024ENdark,320FRlight,390ENdark.1h1,7orderedcards,1currentstep,8explicitlocalcheckmarks, allleafassetsloaded, nooverflow, centeredhorizontalmarkers/orderedverticaltimeline, localizedAbout/footerlinks, visiblekeyboardfocus,8scopedaxe0.1672EN Enter navigated About with expectedheading. Reducedmotion enabled for allcases; no animatedmeaning. Results verification/roadmap-responsive.json. Tests inspect localimplementation semantics but do not independently approve historic milestone evidence.

Actually inspected: suppliedreference andbothassetpreviews; initial1672ENdark; final1440FRdark;2540FRlight composition resized1600wide;768FRlight and1024ENdark currentcards;320FRlight and390ENdark heading/current/closing nativewidth composites. Files verification/roadmap-first-1672.jpg, roadmap-1440-fr-dark.jpg, roadmap-ultrawide-inspect.jpg, roadmap-768-fr-light-current.jpg, roadmap-1024-en-dark-current.jpg, roadmap-320-inspect.jpg, roadmap-390-inspect.jpg. Final1672capture and1440ENcapture exist but only initial1672andFrenchdesktop inspected. Allothercaptures clearly not claimedvisuallyreviewed. Desktop matchescenteredheading/leaf/7columns/markers/cardstructure/CTA/signature; realFrenchcontent makes cards taller than placeholderreference. Tablet switchesbelow1300 to coherentverticaltimeline/two-columncard; phones onecolumn. Nearblackcanvas remainsintentional in bothglobalthemes.

Real200%browserzoom remains UNVERIFIED: Control+Equal attempt inheadlessChrome left1440innerWidth/dpr1/viewportscale1unchanged; verification/roadmap-zoom-attempt.json. No CSSzoom/deviceemulation substitute claimed. Physicaltouch,screenreader/crossengine also unverified. Request UX2independent exactcandidate review including realzoom if available. No self-acceptance, remote push/deploy or launchclaim. D36authorimplementation frozen for review; D34 remainsinspected-only, D37newpriority follows beforeD33audit.
