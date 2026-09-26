# Account-last signup implementation — September 23

Current site: Troc-UX-Design, UI4313/API5313. Solo implementation. Local changes only; no deployment, GitHub push, real signup, email or provider session.

## Delivered
- Sequence: intent -> Canadian contact/address -> games -> buyer and/or seller questions -> editable review/consents -> email/Google or existing account -> authenticated finalization -> receipt/account.
- One address/province source, full EN/FR province labels, independent contact language, multiline optional answers, exclusive software=None.
- Server drafts: opaque HttpOnly SameSite cookie capability, hash stored server-side, seven-day fixed expiry, optimistic revisions, bounded request-time expiry purge. No passwords in draft; allowlist drops arbitrary fields. Drafts are not verified accounts or marketing leads.
- Debounced serialized autosave, restore last saved answers/step, explicit unavailable/conflict states, unsaved exit guard, and mandatory successful complete validation/save before account creation.
- OAuth signup requires saved ready draft; entire signed flow context includes draft ID/revision, locale, return path and timestamp. PKCE/session staging preserved. Callback mismatch fails closed.
- Email signup requires ready draft. Awaiting-confirmation state survives reload; confirmation resend available. Callback failures return to sign-in with visible error.
- Authenticated finalization uses principal.userId, never submitted user ID/email. Profile FK, transaction, completion audit, idempotent retry. Other-account claim rejected. Existing profile is edited only through an account-owned draft; profile revision prevents concurrent overwrite. Legacy anonymous lead tables remain untouched and are not auto-merged by email.
- Account UI shows pending/completed/withdrawn waitlist status, resume/edit controls, preference review and explicit withdrawal. Waitlist selection grants no seller role.
- Final receipt after completed:true and status:waitlisted; removes new-account withdrawal-code burden.
- Sign-in error recovery, bounded API requests, double-submit lock, password recovery UI using an emailed OTP, and retained white Google styling.
- Admin APIs: /api/onboarding/admin/summary and /profiles. Verified principal with admin role required, reads audited. Lists exclude street/postal fields; counts distinguish verified account identity from self-reported, hypothetical inventory. Existing legacy prelaunch analytics remain separately labelled.

## Evidence
- tests/account-onboarding.test.ts: PGlite applies all migrations through0012; real SQL under troc_backend. Field allowlist, complete validation, ownership, stale revisions, finalization retry/no duplicate audit, conflicting edits, rollback, withdrawal, expiry/purge and awaiting-email restoration. HTTP tests verify forged user IDs ignored,401/403, private completed draft access, admin restriction and reduced PII projection.
- tests/google-auth.test.ts: installed Supabase SDK with simulated provider; PKCE, callbacks, signatures, staged sessions and signup return to early-access.
- tests/account-last.mjs:1440EN dark both /390FR light buyer /320FR dark seller. Refresh restores address and awaiting-email state; no auth before answers; save503 blocks final step; Google/email entry; verified-account confirmation; no overflow; scoped review axe0. APIs mocked.
- tests/account-recovery.mjs:390FR callback error, recovery code request, invalid-code retry, success and credential isolation. API mocked.
- Typecheck and targeted ESLint pass. Client/SSR builds pass. Captures in verification/account-last; mobile light confirmation and desktop review inspected (full-page sticky-header capture is not treated as an overlap diagnosis).
- Existing homepage/hero source untouched.

## Activation requirements — still blocked
1. Apply lib/db/migrations/0012_account_onboarding.sql with migration credentials; runtime uses its existing restricted role. Migration was applied only to isolated tests, not an external database.
2. Configure DATABASE_URL, Supabase URL/publishable key, APP_ORIGIN, provider callback allowlists and SMTP. Without a configured DB, /api/onboarding returns503 and UI does not pretend to save.
3. AUTH_GOOGLE_ENABLED=true and a securely generated shared AUTH_FLOW_SECRET of32+ characters for production multi-instance OAuth. Never VITE-expose it. Development restart invalidates outstanding flows.
4. Configure the Supabase password-recovery email template to include its recovery OTP (Token); this UI accepts a code, not an unhandled recovery link. Configure confirmation templates/redirects; test actual delivery, expiry and verification in an authorized staging environment.
5. Schedule scripts/purge-onboarding-drafts.ts --apply using approved database credentials. Without --apply it only counts expired drafts. Request-time purge is bounded; expiry immediately denies access but does not guarantee timely physical deletion without the scheduled cleanup.
6. Draft recovery is same-browser/cookie bound. Opening a PKCE confirmation elsewhere requires returning to the original browser. No cross-device recovery by an unverified email, no automatic merging of legacy leads.
7. Address validation is plausibility only, not proof of residency. Existing buyer age policy retained;18+ applies to seller branch. Provider-level registration policies and hosted access controls still need staging verification.
8. No claim of live OAuth, live database delivery, screen-reader certification, conversion lift, residency verification or100% perfection. This is tested implementation with explicit environment gates.

## Audit disposition
A01–A05 implemented locally (auth-last, FK linkage, drafts, safe profile updates, one address).
A06–A09 implemented locally with live-provider validation pending (errors/recovery, field focus, timeouts, receipt/account management).
A10: central profile/onboarding state added, no seller permission from self-reported intent; deployment/provider-wide policy and real residency proof remain open.
A11: account resume and explicit edit implemented; automatic email-only legacy merging deliberately prohibited.

Final edge-case check: response-loss retry after withdrawal cannot report waitlisted; returning completed-but-withdrawn drafts route to account status/rejoin. HTTP profile/identity protections remain enforced.
