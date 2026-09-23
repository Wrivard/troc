# D37 existing prelaunch audit and proposed presentation contract

2026-09-23. Design audit only before dependent controller wiring. User brief WAITLIST-ONBOARDING-BRIEF.md read in full. Existing6.5 reused; no second backend or submission enabled by this document. A must approve exact field/API/identity/consent contract before dependent UI integration. D36 frozenb7eb9af; D34 inspected-only; D33deferred by D37priority.

## Current implementation verified from source

Existing /early-access, /early-access/collector, /early-access/seller, /early-access/withdraw and admin routes are handled by PrelaunchApp. Returning /account sign-in is separate. PrelaunchApp forms have a single long step, per-audience fields, required email-updates consent, optional analytics, busy/error/success and client-generated withdrawal secret. No account is created. Existing /early-access/seller was rendered/read during D30 without submission; no current real persistence/auth/verification evidence is claimed.

API routes/prelaunch.ts readiness requires enabled/schema/database/origin/key prerequisites via app.ts; defaults/currenthostedvalues not inspected. Auth Google/email foundations and localtests are not actual provideractivation. Waitlist interest must not imply login/emailverification/sellerapproval.

validation.ts Kind is collector|seller only. Session preferences choose audience once; switching between chosen kinds produces conflict or a newjourney. sessionStorage contains functional journeytoken/audience/analytics/expiry (not answer drafts). Signup stores details JSON and locale, requires countryCA and consent=true/versionprelaunch-2026-09-v1; seller additionally adult=true/contact/software/inventory/type/experience. Current lead tables separate buyer_waitlist/founding_seller_leads; normalized-email dedup is scoped to audience table and returns nondisclosing202. This is not oneperson/both-role identity.

capture transaction serializes samekind normalizedemail, preserves existing attribution/consent on duplicates, audits consent and marks serverevents only when analyticsconsent. Existing202does not disclose creation/dedup; UI generates its own withdrawalcode, so future success contract must not imply every retry/duplicate owns a newlyvalid withdrawalreceipt. A must define safe generic acceptance/verification/receipt behavior without disclosing registration.

Admin methods require adminprincipal. Current metrics count consentingsession events bykind/name/provenance and explicitly lack invitation/accountactivation/selleractivation/firstinventory/firsttransaction. These are not uniquelead/investordemand metrics. No existing protectedCSV export found in inspected PrelaunchAdmin/service; do not add public person-level export.

## Field mapping and gaps

|Requested|Current support|D37 contract requirement|
|---|---|---|
|Buy/sell/both intent|collector orseller journey/table|A canonical onelead/twointerests model, rolechange and legacydedup rules. Never submit twoindependentforms.|
|Games/province/preferredlanguage|games[] allowlist,province enum,locale en/fr|Reuse existing IDs and limits. Language is contactpreference, separate fromgame/cardlanguage.|
|Buyerfrequency|not_specified/occasionally/monthly/weekly|Reuse enum, optional.|
|Buyer monthlyspendrange|Absent|A-approved enums withprefer-not-to-say; no exactrevenue inference.|
|Buyer channels|Existing channels[]|Reuse ebay/shopify/tcgplayer/facebook/lgs/other; don't implyintegration.|
|Frustrations/wishlist|Optional500/1000char text|Preservebounded optionalanswers or approvedoptionmapping, no cardbycardinventory.|
|Desiredfeatures|Absent|Approved multiselect IDs/limits; distinguish plannedfeatures.|
|Seller type|individual/professional/online_store/hobby_shop|Preserve canonicalenum, friendlylabels.|
|Totalinventoryrange|under_1000/1000_9999/10000_49999/50000_plus|Reuse; explicitly self-reported totalcards.|
|Initial TROC listingsrange|Absent|Distinct approvedenum, never derive frominventory. Self-reportedintent, notimported/live/committedinventory.|
|Channels/software|Existing arrays|Reuse existingchoices/limits; software doesnotpromiseintegration.|
|Readiness tolist|Absent|A-approved rangeenum, no guaranteedlaunchdate.|
|Store name/site/salesrange|contact100only; website ishoneypot|New optional fields require exactkeys. NEVER bind storeURL to existing hidden websitehoneypot. Prefer-not-to-say salesrange.|
|Name/email|sellercontact100,email254;collectornameabsent|A define sharedname, emailnormalization; HTMLautocomplete name/email.|
|Canada/adult|countryCArequired;adultrequiredselleronly|PreserveCanada and existingadulteligibility includingbothsellerbranch; no inferredchangedagepolicy.|
|Waitlist purpose vsmarketing|Requiredprelaunch_updates consent,true|Newversionedpurpose/optionalmarketingseparation needs A persistence/auditcontract. Optionalmarketing andanalytics defaultfalse; currentvalidatorcannotaccept marketingfalse asconsentfalse.|
|Review/branchcleanup|No multistep|UIcomputessteps byrole, preservescommonanswers; omitsinactivebranch onsubmission usingapprovedadapter.|
|Persistedconfirmation|202genericok;unverified emailaudit|Typed serveraccepted result, noduplicate disclosure. No fakequeue/accountcreated/email-sent promise.|

## Proposed presentation flow (field contract pending)

1 Intent (buy/sell/both) ->2 Games/province/language ->buyerquestions whenselected ->sellerquestions whenselected ->Contact ->Review. Five steps forone role, six forboth; progresscounts computed from actual activepath. Noauto-advance. ChooseBack/Next explicit. Rolechange removeshiddenbranch from payload; previousdraftmay stay in volatilememory forBack but mustnever submitinactivevalues. Reviewedit uses explicitstepbuttons and returnsreview aftervalidation.

Buyer and seller branches use a fewrequiredshort choices withoptional details collapsed orskippable. Exactnewranges/fieldnames remainpendingA; do not cement arbitraryenums. Keeptotalinventory andinitiallistingintent visiblydistinct.

Contact explains waitlistpurpose, privateindividualdata and aggregateplanning; separate uncheckedoptionalmarketing andanalytics. No streetaddress/payment/password. Memory-only answerdraft proposed, explicit refreshlosesanswers copy; no newlocal/sessionstorage PII withoutprivacydecision. Existingfunctionaljourneytoken remainsA-owned.

Submit locked onceinflight. Errors preserveanswers, showfocusedsummary+fieldlinks, no automaticretry. Stablelogicalrequesttoken acrossretry andcanonicaldup behaviorA-owned. Genericaccepted screen only after awaitedverifiedadapterresult, emailunverified clearlyseparate, no promiseemailsent/queueposition/benefits. Unavailablebackend retainsreview and explainswaiting, not success.

## Reusing D20

A currentlyowns modules/account/sign-in-presentation/SignInLayout.tsx andsign-in-layout.css/bg-login.png. Layout hardcodes SignIn/Oneaccount text. Reuse exactstyles/art by an optionalcopy/slot extension with currentdefaults unchanged; avoidrouting signupthrough sign-in orcreatinganotherlogin. RequestA layoutlease or approvedgeneralizedframeexport. NewWaitlist presentation files can remain isolated untilbothcontract andlayoutseamareapproved.

## Ready independent work / blockers

Source/route/field/flow audit complete. Data-dependent UI, actualconfirmation andbothrole submission blocked onA typedcontract. Genericlayout/stepnavigation can be developed without backend but mustnot implyacceptedfieldmapping. IndependentUX2mockedflow tests remaindistinctfromBactualpersistence/retry/identity/adminreporting validation. True200%zoom/AT/hostedauth remainunverified. No newdependency/provider/schema/sharedcontroller edit.
