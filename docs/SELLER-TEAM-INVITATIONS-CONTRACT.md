# E4.2 Team invitation / acceptance contract (local implementation queue)

Existing member() directly grants roles to an existing active account. Preserve its owner checks, seller-row lock, last-active-owner guard and audit. Do not relabel this operation as an invitation. No real email dispatch is authorized.

First vertical slice: in-app invitations to existing active TROC accounts, addressed to immutable user UUID after owner-authorized email lookup. No bearer acceptance links needed for this slice. New/unregistered-account email invitations remain explicitly unavailable until delivery and verified-email lifecycle are connected.

Proposed private table: id, seller_id, recipient_user_id, role, invited_by, created_at, expires_at, status(pending/accepted/declined/revoked), resolved_at. Enforce allowed roles, backend-only RLS and one pending invite per seller/recipient. Expiry is checked at read/accept time; expired pending invite can be atomically replaced by a new invitation after locking seller. Seven-day default expiry; no membership exists until acceptance. Do not grant owner through initial invite UI; ownership transfers continue through existing protected member flow.

Owner workflow: explain role, select existing-account email, send in-app invitation, view pending/expired entries, revoke. Recipient workflow: authenticated account inbox, see store/inviter/role/expiry, explicit Accept or Decline. Calling recipient must match invitation UUID and be active; verified Supabase session remains auth authority. No credentials or email verification bypass. States must distinguish invitation created from email delivered (no delivery in this slice).

Transactional acceptance: acquire seller-row lock then invitation lock, verify active store/recipient, pending/nonexpired invite and inviter still active owner at acceptance, verify target not already a member. Insert membership and resolve invite with append-only audit atomically. Never overwrite a role granted since invitation creation. Replay must return a stable resolved state without granting again; declined/revoked/expired conflicts do not grant access. Use same lock order for create/revoke/accept to avoid new deadlock paths. Fresh authority checks are required on every write; stale client memberships are insufficient.

Verification before local activation: cross-store/nonowner denial, recipient mismatch, expired/revoked/inactive cases, inviter removed, existing-member nonoverwrite, same-request retry, rollback/audit, backend-role/RLS, permission scope after acceptance, bounded list paging and EN/FR loading/error/retry. Native concurrent accept/revoke needs real PostgreSQL evidence separately; PGlite cannot certify it.

Next implementation: additive private invitation schema and transaction service with isolated database tests, then bounded routes and existing-Team/Account UI integration. Review schema names/migration sequence immediately before implementation. No production migration, email delivery, paid services or changes to Supabase Auth.

Implementation clarification: current service.access permits database administrators in addition to active owners. Reuse that existing rule for creation/revocation and fresh inviter authority at acceptance; historical milestone admin text is stale. Transaction service/schema tested locally; routes/UI pending.
