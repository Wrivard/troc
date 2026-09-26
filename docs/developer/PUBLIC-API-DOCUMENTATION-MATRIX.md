# Public API documentation readiness

Status: planned contract, not a published partner API. September 24, 2026.
Source: root MILESTONE-4.5.md; current DeveloperGuide.tsx. Internal browser routes are not supported integration endpoints. This matrix closes no engineering or hosted-readiness gate.

| Topic | Current evidence | Required before public documentation is complete |
|---|---|---|
| Overview | Developer page distinguishes local CSV and planned API | Approved scope, supported environments, canonical resource vocabulary |
| Authentication | No public credential issuance offered | Revocation, scopes, secret handling and tested seller isolation |
| Cards | Canonical catalogue separate from seller offers | Versioned read schema, pagination, licensing and fixture examples |
| Listings/inventory | Local reviewed imports and inventory exist | Validated write schema, stock semantics, idempotency/conflict rules and batch limits |
| Orders | Local seller/buyer services exist | Authorized seller retrieval contract, statuses, pagination and redaction |
| Webhooks | Signed events are roadmap requirements | Exact payload/version, verification, event identity, ordering, retries and replay policy |
| Errors | App-specific errors are internal | Stable public code/schema, safe details, retryable vs terminal classification |
| Limits | Preview limits are implementation details | Published rate/batch/payload limits and retry response semantics with tests |
| Versions/changelog | No public release or compatibility promise | Version policy, dated real releases and approved deprecation process |
| Connectors | Names are compatibility targets | Provider-specific permissions, mapping, sync reconciliation and verified integration evidence |

## Publication gate
Only document example requests as runnable after the corresponding versioned route and authorization contract have been implemented and tested. Use fictional data. Do not expose secrets, internal database access, private administrative routes or operational credentials. Real external delivery and activation remain held under current coordination requirements.

## Safe work available now
Maintain /developers availability and FAQs, the CSV mapping guide, inventory source explanation and this evidence matrix. Defer numerical public rate guarantees, API keys, signed-event examples and production URLs until their contracts exist.
