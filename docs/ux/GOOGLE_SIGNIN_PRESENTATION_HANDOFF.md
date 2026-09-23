# AUTH02 Google sign-in presentation handoff

2026-09-23. Sourcecandidate is commitcontaining thisreport. Isolatedpresentation only; noAccountApp/GoogleSignIncontroller/authAPI/hero/sharedCSS changes. A's AUTH01c1853c4/setupdoc inspected. A explicitly approved eventual import+return-only integration; hooks/start/API/browserlifecycle/email and parentstatus stayexact.

## Integration contract

Import GoogleSignInPresentation in A's existing GoogleSignIn.tsx and replace only its returnedsection with:

```tsx
return <GoogleSignInPresentation
  locale={locale} enabled={enabled} confirmed={confirmed} busy={busy}
  onConfirmedChange={setConfirmed} onStart={() => void start()}
  labels={{ action: t("googleSignIn"), canada: t("canadaConfirm"),
    loading: t("loading"), unavailable: t("googleUnavailable") }}
/>;
```

Remove unused oldButton/Checkboximports only. Keep allhooks/startguards/pending/active/errorreport/setBusy/destinationchecks unchanged. Keep AccountApp emailform/placement/parenterror andloading untouched. Checkboxdisabled remains busy||enabled!==true; buttondisabled remains busy||enabled!==true||!confirmed. CheckedState maps value===true exactlyasbefore. Component has nofetch/stateexcept useId, noauthredirect orsecondSDK. Busy issharedpagebusy, so nofalseGoogle-specificprogressclaim; parent retains loadingstatus. Providerchecking/unavailablestatus retained and describedbybutton.

OfficialGoogle standardgradientG fromcurrentbundle, whitebuttonlightstyle inboththemes, locallybundled GoogleSansMediumsubset5.5KB, officialfontOFL andassetprovenance included. Full1.9MBfont replaced afterbuildsizecheck. No logo recolor/stretch. Localfontsubset covers existingENFRactionlabels only; see assets/PROVENANCE.md. No changetoTROCglobaltokens/type.

## Author validation

PASS marketplaceTypeScript; scopedcomponent/harness/testESLint; isolatedViteproductionbuild. Harness reuses exact c1853c4 SignInLayout/CSS/background prepared fromGit, noauthcontrollercopied. Generatedbaseline ignored; runharness/prepare.mjs first. This is not integratedauthflowvalidation.

PASS tests/google-signin-presentation-preview.mjs:1440ENdark,834FRlight,390ENdark,320FRlight. Nativeunchecked actiondisabled; keyboardSpaceconsent+Tabaction+Enter; actioncount1, repeatnativeclickonbusydisabled doesnotincrement; checkbox/actiondisabledwhenbusy; retainedsyntheticemailvalue; parenterrorallowsretry; providerchecking/unavailabledisableboth; consentstatepreservedwhenavailableagain; nooverflow; official20pxlogo/loadedfont/2pxfocus; negligibleDSreduced-motionduration. Zero/api/authrequests.

PASS tests/google-signin-accessibility-preview.mjs:320FRbothlight/dark, fontsubsetactuallyloaded; scopedaxe0violations. Notscreenreadercertification.

Actualinspection: finalgoogle-1440-en-dark-ready.jpg,google-320-fr-light-ready.jpg,google-320-unavailable.jpg; earlier390erroractualrender alsoinspected. Initialrenderfound inheritedSignInLayoutlabel rule forcingcheckboxabovetext; scopedselectorfixed, addedgeometryregressionpassed. Finalallcasecaptures regeneratedafterfontsubset. Otherbusy/checking/errorcaptures exist, not allviewed. JSONverification/google-signin-presentation.json andgoogle-signin-accessibility.json.

Preparation initialPNGexport exceededNode1MBbuffer; corrected bounded4MBexport. Test-only selectors corrected foroutput'simplicitstatus and approvedDSreducedmotion1e-05s. No uncertainwrites/noACLchanges. Publicofficialdocs/font/asset read/download only, noGoogle/Supabaseconfig orauthattempt.

## Remaining gates

A import/return-onlyintegration and realc1853c4controller/interceptedAPI regressions; independentUXacceptance; realGoogle/SupabaseOAuthAUTH03 remainsblockedperAsetupdoc. No remoteenabledprovider/consent/callback/sessionclaim. True200%zoom,physicalmobile/crossengine/screenreader remainopen. Emailform inisolatedharness isdemoonly; liveAccountApp preservedbyabsenceofedits, not certifiedbyharness.

Ownedharness4315 execsession59082 remainsavailable; priorsearch4314 session33303 alsoowned/frozen. Existing4313/5313 untouched. Coordinatorongoinghero/HomeSections/assets preserved. No push/deploy. Nextpreauthorizedscope: audit fullSmartCart educationpresentation against frozen11f699c androotchecklist; nooptimizer/controllers/homebackdropedits.
