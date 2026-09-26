# E4.2 invitation schema checkpoint

Migration0026 applied only to disposable PGlite with all prior migrations. tests/seller-team-invitations.test.ts passes invalid/owner/admin/self roles, duplicate pending constraint, resolution timestamp and expiry consistency, pending replacement after revoke, no automatic seller membership, backend DELETE denial, unprivileged browser SELECT denial and RLS flag.

Backend-only SELECT/INSERT/UPDATE; no public grants, no raw tokens/email delivery. Not integrated or active in persistent preview. Native concurrency not certified. No production migration.

Next: service create/revoke/accept/decline with fresh permissions and seller-first ordered locks, audit and replay tests, then routes/UI. Contract docs/SELLER-TEAM-INVITATIONS-CONTRACT.md. API46528still runs pre0026source; next deliberate restart will apply new migration and must be checked.

## Transaction service verified
TeamInvitations.create/resolve uses seller-row then invitation-row lock ordering, matching member mutation serialization. Create targets existing active user by email and does not grant membership. Identical pending creation replay returns the invitation; differing role/inviter conflicts. Expired pending invitation is atomically resolved/audited before replacement. Accept verifies recipient/current actor/current active store and inviter current owner/admin authority, rejects existing membership rather than replacing it, inserts role and terminal status/audit atomically. Decline/revoke create no access. Terminal same-action replays do not duplicate audit or regrant a removed role.

Expanded tests pass schema plus service cases: cross-store/nonowner/wrong-recipient denial, invalid owner role/extra input/self recipient, create replay and conflicting role, audit failure rollback on creation and acceptance, accepted replay before/after access removal, revoke/decline replay, expired resolution and pending replacement, inviter demotion, recipient suspension, existing-member nonoverwrite. Typecheck/scoped ESLint/API build pass.

These are disposable PGlite tests, not native multi-connection contention tests. Concurrent account suspension remains part of the unresolved lifecycle locking contract; no claim of serializable global account lifecycle. Current service.access permits database admins, unlike stale milestone wording; implementation reuses that authority without broadening it. No real external messages.0026still not applied to persistent previewAPI46528. No HTTP/UI wiring yet.

Next: bounded owner/recipient read contracts and authenticated routes/tests, then existing Team/Account UI integration. Heartbeat paused on user return.

## Lists and HTTP integration
GET /seller/invitations returns only authenticated recipient history. GET/POST /seller/platform/:seller/invitations is owner/admin list/create. POST /seller/platform/:seller/invitations/:id/{accept,decline,revoke} invokes tested transaction service. Recipient path explicitly shares existing rate limiter; router no-store and parent foundation origin checks remain. No public auth bypass added.

Lists bounded25+1 with microsecond created_at/UUID descending keyset and scope-bound actor+seller cursor. Read-only expired status projection, store/recipient/inviter identity, expiry/role returned. No total-count scan or automatic fetch loop. This is not a frozen MVCC snapshot; concurrent insertions require refresh. No unsupported throughput guarantee.

Tests now include61additional historical rows with tied timestamps, exact full recipient traversal/no duplicates, owner-vs-recipient scope/actor cursor mismatch, malformed cursor and unsupported input, outsider owner-read denial and empty own inbox. Real isolated HTTP owner create/revoke, recipient list/accept, wrong recipient404, owner list403, invalidUUID400, no-store200 pass. Inviter identity assertion initially exposed a missing SELECT field during implementation; corrected and complete test suite rerun passed. Typecheck, scoped lint and API build pass.

API46528not restarted;0026still not applied to persistent preview. Next integrate UI then perform deliberate local activation. No email or production changes.
