# Contact seller: sign-in return continuity

Existing guest Contact seller dialog linked to /sign-in?lang=en without a return target. Email login also excluded store paths from its return allowlist, sending the visitor to /account. Reproduced before change in before.log.

ContactSeller now receives the canonical store path from the existing seller record and encodes it in the sign-in link. Email and Google return validation accept only a bounded lowercase alphanumeric/hyphen store slug; arbitrary queries, fragments, encoded slashes, traversal and external paths remain rejected. No permission or provider configuration changes.

Verification:
- scripts/check-contact-auth-return.cjs: EN1440 / FR390, keyboard dialog opening, Escape focus return, guest link -> mocked email login -> same localized store.
- Five hostile/malformed return paths rejected per locale.
- Twelve sign-ins intercepted; no real sign-in, messages or other mutation requests.
- tests/google-auth.test.ts: return-path checks plus installed SDK with simulated provider, session staging and failure cases pass.
- Frontend/API TypeScript and scoped ESLint pass.

This restores the store destination, not automatic reopening or sending of a conversation. Hosted Google remains unverified.

D21 reconciliation: existing ux-product-browser.mjs, product-vision-preview.mjs, check-offers-help-a11y.cjs and check-price-history.cjs already cover CTA focus, localized theme cases, offer states and keyboard price-table disclosure. No unchanged suites rerun or full D21 completion claimed. Real assistive-technology/browser zoom coverage remains open.
Client+SSR builds pass; existing bundle warning remains (.local/contact-auth-build.log). An initial patch escaped regex slashes incorrectly; compilation caught it, syntax was corrected, all listed checks then passed.
