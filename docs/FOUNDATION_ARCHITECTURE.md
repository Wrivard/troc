# TROC foundation

The approved style guide is Milestone 0, complete by user approval. The numbered
post-style-guide specifications are the product authority. Earlier scope/approval
notes retained inside design-system reference files are historical.

## Existing stack retained

pnpm workspace, React 19, Vite 7, TypeScript, Express 5, PostgreSQL and the existing
Drizzle/pg package. No Next.js migration, project reset, or replacement design system.
The marketplace is a consumer at `artifacts/marketplace`; the approved guide remains
self-contained. Two package exports expose its existing preview and preview CSS.
All new account controls import approved components. Account layouts use semantic
Tailwind utilities; no additional visual primitive or token was introduced.

## Boundaries

| Module | Owns now | Later consumers/work |
|---|---|---|
| auth | Supabase adapter, validated identity, server permissions | invitation, recovery enhancements |
| users | account, preferences | addresses, privacy requests |
| sellers | application validation/submission, account/team schema | approval workflow and dashboard, M4 |
| providers | eight typed external service contracts | adapters implemented in owning milestones |
| shared | money, locale/theme contracts, launch defaults | domain services; no UI dependencies |
| demo | repeatable batch service, immutable provenance triggers | seed/purge operator workflow, M6 |
| catalog | canonical relational schema in migration | imports/search/public pages, M2 |
| listings/inventory | listings, photos, events, reservations schema | publish validation, bulk workflows, M4 |
| pricing | provenance/reference/FX schema | reference provider/import history, M2 |
| orders | marketplace/seller order and item relationship schema | state machine and settlement, M3 |
| audit | append-only events, restricted backend access | administrative tooling, M6 |
| real leads | separate consent-bearing tables | public forms and lead management, M6 |

Reserved modules: search, shipping, promotions, cart, smart-cart, checkout, payment
simulation, fee-ledger, credit/rewards (M2/M3); collections, want-lists/wishlists,
price-alerts, storefronts, reviews, messages, notifications, offers (M4/M5); buylist,
admin and catalog corrections (M6). Add services under `api-server/src/modules/<domain>`
and thin controllers under routes when that milestone is authorized. Do not add
empty pretend implementations or business logic inside React.

## Identity and permission model

Supabase owns passwords, confirmation and session rotation. Its verified user UUID
is the application user ID (a trusted auth-subject mapping, distinct from catalog
provider IDs). No passwords are stored in TROC tables. The BFF uses Supabase SSR
cookies, HTTP-only, Secure in production, SameSite=Lax. Browser JS never handles
tokens. `getUser()` verifies identity with the auth service on every protected
request. User metadata and client role headers are never authorization sources.
Buyer access is implicit for an active confirmed account; global roles and
seller-scoped memberships are loaded from PostgreSQL. Suspended accounts fail closed.
Support is read-only in its scope; catalog moderators do not gain seller/admin
permissions. No self-service endpoint can grant roles or approve a seller.

All mutations require the exact configured Origin. Authentication is rate limited
per process; configure trusted proxy handling and a shared rate-limit store before
multi-instance deployment. Auth responses are no-store. Provider/SQL failures return
stable error codes translated by the client; request logs omit query, body and cookies.

Official adapter references: [server clients](https://supabase.com/docs/guides/auth/server-side/creating-a-client)
and [verified getUser](https://supabase.com/docs/reference/javascript/auth-getuser).

## Database

Versioned SQL in `lib/db/migrations` is authoritative. The retained Drizzle connection
is available, but do not use schema push: it cannot represent the policies/triggers
in these migrations and could conflict with SQL ownership. Parameterized repositories
use pg. The migration runner locks, checks checksums and applies each file atomically.

All instants use timestamptz; connections/display may choose timezones without changing
stored instants. Calendar release/FX dates use date. Money is integral cents; large
PostgreSQL bigint values must stay decimal strings until explicitly checked against
JavaScript's safe integer range. There is no per-card transaction fee or seller-level
payment capture. One-cent listings, seller minimum settings, and marketplace-order
to seller-order relations preserve low-value consolidation. Canonical variant UUIDs
support inventory and future collection matching; provider IDs exist only as mappings.
Variant attributes are data-driven JSON rather than universal game-specific flags.

RLS is enabled with no browser grants. Migration 0002 grants a narrow NOLOGIN backend
group access only to the foundation tables/operations used by the API. API authorization
still enforces individual account and tenant scope. The runtime cannot grant roles,
approve sellers, read real leads, or change audit records. New tables default closed.

Heavy imports, payment idempotency execution, listing photo/level gates, complete
order-state/ledger invariants and demo purge are intentionally later milestones.
Schema support is not a claim those workflows are implemented.

## Preferences

The original preference provider and storage keys are reused unchanged. Explicit
device selections persist and win; account defaults are used on a new device.
The account save action persists EN/FR and dark/light in PostgreSQL with an audit event.
All new visible copy lives in paired typed messages. API error codes carry no display
copy. CAD display at domain boundaries must divide integer cents by 100 once.

## Demo data

No catalog/artwork was downloaded and no production data was seeded. Test fixtures
use invented names and example.invalid addresses in an ephemeral database only.
Repeatable seed keys identify batches; triggers record batch provenance and prohibit
changing a record's batch. Explicit purge allowlists exclude catalog/mappings and
all four real lead tables. Foreign keys restrict deletion. The full safe purge
transaction, preview and admin UI belong to M6; no purge endpoint exists now.
