# Settings conflict recovery and Team/Settings reconciliation

Existing foundations: service.team/member authorize owners/admin, paginate members, protect last active owner and modify existing active accounts. This is not an invitation/acceptance flow. Settings read/write already persists store text, handling and minimum with server version checking and permissions. UP01 hosted media remains separate.

Reproduction: intercepted valid settings read followed by POST409settings_changed. Existing UI retained draft and told user to reload, but exposed no reload/review control. Browser regression failed because Review latest settings did not exist. Cause: load retry was rendered only when saved settings were absent.

Fix: explicit conflict state prevents repeated outdated saves and discard hiding the recovery action. Review latest settings GET refreshes baseline/version while preserving locally edited fields; untouched fields accept remote changes. No automatic write or force overwrite. User reviews and explicitly saves. Refresh failure retains draft/conflict/retry. Existing server locking, version checking and role gates unchanged.

Verification: check-settings-conflict.cjs drives real page with intercepted backend EN1440/FR390.409blocks save, recovery503preserves draft, successful re-read keeps local name and merges remote handling5/minimum500, subsequent POST carries v2 and exact values, successful save clears dirty state. Both pass; no viewport overflow. FR screenshot inspected. Frontend typecheck/scoped lint pass. No debug instrumentation. No real settings writes from this harness.

Prevention: conflict error contracts need an executable recovery interaction test, not just a message assertion. Existing local checklist/evidence workflow reused; no issue tracker migration or external issue created.

Next: verify Team state isolation when switching seller on a later page or with a modal open; then invitation/acceptance contract. Existing hosting/media/remote approvals and scale limits remain open.

Client and SSR production builds passed; public catalogue asset copying skipped, existing assets preserved (.local/settings-conflict-build.log).
