# AUTH02 isolated harness

Pure presentation only. Simulated controlled availability/consent/busy/parenterror; NO auth controller, API or OAuth call. Existing frozen A c1853c4 SignInLayout is reused for context; its generated baseline files are local and ignored, not a second shipped login module. Synthetic emailform only demonstrates retainedfield layout.

From worktreeroot run `node artifacts/marketplace/src/modules/account/google-sign-in-presentation/harness/prepare.mjs`. This exports exact frozenlayout/CSS/originalbg-login image fromgit, adjusting only layout's messagesimport path. No authlogiccopied. Requires c1853c4 inlocalGitobjects. Generatedbaseline must exist before typecheck/build ofharness.

From artifacts/marketplace:

```
node ../../node_modules/.pnpm/vite@7.3.6_@types+node@25.9_4aa3f31c6ec2040a2842a601e7a4a735/node_modules/vite/bin/vite.js --config src/modules/account/google-sign-in-presentation/harness/vite.config.ts --configLoader runner
```

Check4315free first. Add `build` before --config for isolated build toverification/google-signin-dist. Query?lang=fr&theme=light. Buttons atbottomsimulate states; noGooglelogin request. Sourcecomponent receives exact localizedcontrollerstrings; harness error/unavailablecopy matches c1853c4. Never deployharness.

Tests fromworktreeroot: `node tests/google-signin-presentation-preview.mjs` and `node tests/google-signin-accessibility-preview.mjs`. Screenshots/JSON remainverification/. ActualAPI/controller regression belongs toAafter approvedimport/return-onlyintegration.
