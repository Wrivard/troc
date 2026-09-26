# Seller photo storage lifecycle — current contract

Status: server-only local candidate; unmounted HTTP adapter candidate, no active upload route or seller UI, real storage/scanner provider or public publication. Migration0032 has only run in disposable tests, never persistent preview. API37280 remains unchanged. Historical evidence lives in docs/evidence/photo-quarantine/REPORT.md.

## Implemented and locally tested

- Raster preparation: JPEG/PNG/WebP full decode, MIME match, no animation, metadata removal/orientation,10MiB/24MP/12000px input caps,2400px display edge and SHA256. Two simultaneous decodes; configured5second Sharp processing timeout is not a hard worker-kill guarantee.
- ImageIngress: shared-process4jobs/2per authenticated owner, no waiting queue,30second cooperative deadline; stream byte counting with bounded allocation. Slot held through downstream completion even if cancellation ignored. No distributed/global-host admission claim.
- Private stage: server UUID, immutable actor/seller/listing/version/input-hash/MIME binding; database-clock1hour expiry;12unexpired requests/listing and120/seller under seller lock. These are technical staging budgets, not plan entitlements. Current permissions rechecked after external work. Ready means scanned PRIVATE bytes.
- Private attachment: current authority plus actor/target/version binding, reservation guard,12attached cap, revision/audit once, durable replay receipt. No public listing_photos association, no stock/price/status changes and no satisfaction of photo-required activation.
- Private read: attached records only, fresh inventory authority before and after signing; recheck attachment after external I/O. Request60second URL; reject HTTP, embedded credentials, fragments, invalid/expired dates or expiry beyond5minutes from request start. Provider errors mapped to generic code without credential-bearing text. Real provider must enforce expiry; validation cannot prove remote revocation.
- Private removal: revision/reservation guard, removed receipt, no resurrection by attachment replay, no new signed reads after removal. Existing URLs may remain valid until expiry.
- Cleanup: private object hash persisted before I/O; bounded UUIDpages mark expired under upload lock before deletion. Attached objects excluded, removed objects eligible immediately. Keep receipts and resweep from beginning to remove late provider writes; deletion errors reported for retry. No scheduled worker or guaranteed cleanup deadline yet.

## Provider and HTTP activation gates

Use explicit configured private immutable object storage and trusted scanner; never silently accept a missing scanner or substitute public-base URLs for quarantine. Fake providers prove service contracts only. Real adapters must verify hashes, idempotent same-key writes/deletes, enforce private access, signed URL TTL and cancellation. Authenticate using existing Supabase principal and current inventory authority before admission/body consumption. Set no-store on private responses and apply existing origin/CSRF/rate-limit rules. Raw image stream must not pass through JSON parsing. Retry with same operation identity and bytes; request cancellation never reverses an already committed transaction.

0032activation, actual provider setup, HTTP handling, scheduler, native races and UI remain separate checks. Do not restart preview casually while0032is still a candidate.

## Buyer-visible publication remains unimplemented

Publish a distinct scanned immutable public derivative with compensation/outbox for provider success followed by database failure. Only committed publication may insert listing_photos. Never insert a quarantine key; PublicListingPhotoStorage explicitly rejects that namespace. Preserve canonical catalogue artwork identity separately.

Public withdrawal needs its own policy and tests: enforce photo-required active listings (pause or reject), protect reservations/order snapshots, remove public references before provider deletion, and preserve replay receipts. Do not expose a live upload/publish button until this whole journey and configured providers are verified.

Connected HTTP/disposable SQL/real decode/fake-provider lifecycle is verified. Next photo work requires actual provider conformance and public publication outbox design; keep public upload UI disabled. Tests must cover upload/attach/remove/replay, cancellation, cross-owner access, stale permissions, scanner outage, cleanup/provider failure and reserved inventory.
