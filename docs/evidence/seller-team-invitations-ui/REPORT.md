# In-app team invitations UI

Team new-member action creates pending invitations for existing active accounts; excludes owner role in invitation selector, while preserving direct existing-member management and protected ownership changes. Owner panel shows invitation history and revocation. Account preferences mounts recipient panel with store/inviter/role/expiry, explicit accept/decline. In-app-only wording: no email sent. Session refresh after successful acceptance; failed actions do not claim success, refresh/retry available.25row cursor panel, previous/next, scoped response identity and unmount guards retained.

Verification:
- check-team-invitations-ui.cjs EN1440/FR390: initial read503/retry, creation uses invitations endpoint not member grant, owner revoke, recipient accepts, no horizontal overflow; screenshots and check.json. FR screenshot inspected.
- check-team-invitations-actions.cjs: next/previous pages, decline503preserves action and subsequent retry succeeds. actions.json. Harness initially matched both status notice and loading status during refresh; narrowed notice assertion, rerun passed.
- check-team-invitations-live.cjs: real local owner/recipient endpoints return200and empty states. No membership writes. Migration0026activated on deliberate verified-process restart46528->54576; startup ready confirmed. No production migration or external message.
- Marketplace types, scoped ESLint and client/SSR builds pass. Public artwork copying skipped; existing assets preserved.

Limits: browser mutations intercepted; database/HTTP mutation correctness covered by prior isolated tests. Full real-endpoint multi-account browser lifecycle is next, not claimed complete. Hosted concurrency/suspension lifecycle and new-account email delivery remain open. No purchases or account-provider changes.
