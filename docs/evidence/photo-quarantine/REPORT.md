# Photo quarantine candidate

## Private photo staging lifecycle implemented and tested - September25

UP01 now has server-only PhotoQuarantineService and migration0032_listing_photo_quarantine.sql. Reserve/replay binds seller, listing, actor, request UUID, listing revision, input SHA256 and MIME under seller/listing locks. Server-generated upload ID determines private object key. One-hour expiry checked using database clock; input changes, actor changes or stale listing revision fail. Normalization/scanner/private storage execute outside SQL locks; final transaction rereads current membership and revision before ready/rejected. Ready means scanned PRIVATE bytes, never public approval. No listing_photos rows or stock/status/version changes.

19inventory tests pass with real image decoding and fake private storage/scanner: same-request replay returns same record without rescan; changed bytes/actor rejected; foreign seller denied; expiry denied; scan rejection stores no object; scanner outage leaves retryable pending record; removal during scan cannot mark ready; browser role cannot read quarantine table. Inventory versions/quantity unchanged. Types/scoped lint pass. Evidence tests/inventory.test.ts and .local/photo-quarantine-tests.log.0032 NOT applied to persistent API37280. No route/UI/provider enabled.

Remaining lifecycle: private object cleanup after late permission/version failure (object can remain quarantined), bounded per-seller staging quotas/request admission/deadlines, attachment/public-read authorization and deletion/replay lifecycle. Do not activate0032casually through preview restart; finish service contract/tests first. Native concurrent staging and real provider immutability remain unverified. Next coherent batch: cleanup/idempotent compensation and explicit attachment authority design, then fake-provider adversarial tests before hosted integration.146IDs preserved; source/auth/stock/money/remote holds unchanged.


## Quarantine cleanup and staging budgets verified - September25

Persist normalized object hash before external I/O, so interrupted/late provider writes have a discoverable server-owned key. Internal cleanupExpired uses bounded1..100UUIDpages, deletes only expired private objects, reports failed IDs and retains records for subsequent full sweeps. Tests verify expired deletion preserves unexpired objects, a simulated late write is removed next sweep, storage failure is reported, invalid limit rejected. This is eventual cleanup machinery, not a scheduled worker or guaranteed cleanup deadline.

Added technical12unexpired requests/listing and120/seller budgets under existing seller lock; rejected attempts count until expiry, existing request replay bypasses new-slot admission. Listing-limit rejection tested before scanner call.19inventory tests/types/lint pass.0032candidate amended because never applied to persistent preview; migration includes object hash and seller-expiry index. API37280unchanged; no real object storage or database mutation.

Attachment contract now explicitly requires excluding attached assets from cleanup, atomic listing-version advance, idempotent association and separate authorized read/publication adapter. Current public-base URL resolver must never be used for private quarantine keys. Next coherent batch: attachment state/authority plus committed-photo read boundary and fake-provider tests; keep upload UI/routes off until complete. Native concurrency, whole-request admission/deadlines, cleanup scheduling and hosted providers remain open.146IDs retained.


## Private attachment and expiry arbitration verified - September25

UP01candidate now supports explicit PRIVATE attachment and seller-authorized signed-read adapter. Transaction locks seller/listing/upload, checks current authority, actor/target/original-version binding, unexpired ready state, pending reservations and12attachment cap. It advances listing inventory version atomically, records attachment receipt and audit, and returns same receipt on authorized replay without another revision. Stock/price/status remain unchanged. Private attachment intentionally adds no listing_photos row and does not satisfy public activation/photo requirements.

Cleanup now locks expired nonattached upload rows and marks expired before external deletion. Attached rows are excluded; attachment cannot claim an expired record after cleanup arbitration. Records retained for repeated late-write cleanup. PublicListingPhotoStorage rejects listing-quarantine namespace, preventing accidental public-base resolution. ReadAttached requires fresh current seller authority and committed attached state; fake adapter tested, no real signed URL provider.

19inventory tests plus1storage test pass: attachment/replay, stale second attachment, preattachment read denial, foreign scope/revocation denial, attached-object survival beyond stage expiry, unchanged draft/stock/price and no public association. Types/lint pass. Native concurrent race certification remains absent; lock order/source and sequential boundary cases verified. Evidence .local/photo-attachment-tests.log,photo-private-read-tests.log.0032still unapplied to persistentAPI37280; no route/UI or provider activated.

NEXT: public listing-photo publication contract and deletion/withdrawal lifecycle, then request admission/deadlines/provider orchestration and HTTP/UI. Do not confuse private attachment with buyer-visible publication or unblock photo-required listings prematurely.146IDs retained; existing remote/hosted/stock/money/source holds unchanged.


## Private photo removal lifecycle verified - September25

Added transactional private remove with fresh inventory authority, seller/listing/upload locks, expected listing revision and reservation guard. Durable removed state stores original/result revision, advances listing version once and audits. Replay returns same removal receipt after object cleanup; old attachment receives image_removed and cannot revive it. New readAttached calls fail after removal. Already issued signed URLs are not retroactively revoked; require bounded provider TTL before activation.

Cleanup includes removed objects immediately, preserves removed receipt/state and retains idempotent retry on provider failure.0032unapplied candidate extended with removal receipt columns/constraints; no published migration rewritten.19inventory tests pass including stale removal version, repeated remove, read denial, attachment replay denial, cleanup and exactly-one revision advance. Types/lint pass. Evidence .local/photo-removal-tests.log. PersistentAPI37280unchanged; no real storage/HTTP/UI activation.

Private staging->scan->attach->authorized read->remove->cleanup flow now covered with disposableSQL/fake providers. Public publication still absent: contract requires a distinct scanned public derivative, compensated/outbox publication and listing_photos association; public withdrawal must preserve photo-required activation and reserved/order snapshots. Next ready: bounded ingress admission/deadline integration and provider contract validation, then public publication implementation/tests. Hosted provider selection/configuration and native concurrent proof remain separate.146IDs retained; no stock/money/catalogue/source changes.


## Bounded image ingress and cancellation foundation verified - September25

Added shared-process ImageIngress:4concurrent jobs,2per authenticated-owner key, no waiting queue,30second cooperative deadline, counts actual streamed bytes through existing10MiBcollector. Excess work rejected before allocation; stream destroyed on timeout/abort/error. Admission remains held through downstream consumer/provider completion, including a provider that ignores cancellation, preventing repeated timeout requests from accumulating still-running jobs. Caller must authenticate before using the owner key; no HTTP route wired yet.

Passed AbortSignal through quarantine staging to scanner/private put adapters and checked cancellation across decode/scan/storage/final reservation boundaries. Cancellation during scanner fixture leaves pending record and performs no object write. This is cooperative cancellation, not forced termination of third-party work or rollback of an already-committed transaction.

23targeted tests pass (4ingress+19inventory): owner/global saturation, stalled stream timeout/destruction, aborted downstream slot retention, transport/consumer failures, preaborted request and staging cancellation. Types/lint pass. Evidence .local/image-ingress-integrated-tests.log and tests/image-ingress.test.ts. API37280unchanged;0032still unapplied; no storage/scanner provider, route or upload UI active.

NEXT coherent batch: validate provider private-read TTL/HTTPS boundary and integrate one authenticated bounded HTTP staging endpoint only when provider configuration is explicit; preserve fail-closed unavailable behavior. Public publication remains separate and unimplemented. Whole-host/distributed admission, native races, cleanup scheduler and real provider certification remain gates.146IDs retained; stock/money/catalogue/source/remote holds unchanged.


## Private signed-read boundary and current contract reconciled - September25

ReadAttached requests60second provider URL and rejects nonHTTPS, credentials/fragments, malformed/expired expiry or lifetime beyond5minutes from signing start. Fresh database authority and attachment state rechecked after provider I/O. Signing errors mapped to image_read_unavailable without returning provider exception text/credential URLs.19inventory tests pass including invalid URL/expiry matrix, signing error redaction and membership removal during signing; prior scoped types/lint passed before final error-redaction change. Evidence .local/photo-read-contract-tests.log.

Rewrote docs/SELLER-PHOTO-STORAGE-CONTRACT.md as current concise source of truth rather than appended obsolete claims; historical evidence retained in report. Explicitly distinguishes locally tested private lifecycle from missing real storage/scanner, HTTP/UI, cleanup scheduling, public derivative/outbox publication and native concurrency. Existing signed URLs can outlive permission removal until provider expiry; local validator does not prove remote enforcement.

0032still disposable-only candidate; API37280unchanged. Next ready batch: provider conformance harness and authenticated HTTP adapter with explicit unavailable configuration, no silently permissive scanner/public-storage fallback. Then public publication outbox/withdrawal policy tests before UI.146IDs preserved; no production/real provider/source/stock/money changes.


## Authenticated photo HTTP adapter candidate verified - September25

Added inventoryPhotosRouter explicit factory, NOT mounted in application. Requires injected verified principal, current seller/listing access callback and configured photo service. Missing configuration returns503image_storage_unavailable after authentication; no fake provider/scanner fallback. Mutations require exact configured Origin and reject cross-site fetch. Photo-scoped rate limit and no-store; raw JPEG/PNG/WebP staging validates revision/request UUID, rejects compressed/unsupported bodies and oversized declared length before ImageIngress actual-byte processing. Attach/remove use explicit version headers. Response disconnect cancels cooperative ingress.

Isolated loopback HTTP test passes origin403,auth401,missing-provider503,no-store,current-permission403,unsupported MIME/encoding415,invalid-version400,authorized raw staging201 and attach/remove200. Service stub checks canonical IDs, bytes and signal, plus access-before-stage order. This is adapter verification combined with prior separate disposable service tests, not a fully connected HTTP-to-real-storage journey. Types/lint pass before final middleware scoping adjustment; HTTP test rerun passes after it. Evidence tests/inventory-photos-http.test.ts and .local/photo-http-tests.log.

0032still unapplied; API37280unchanged; no actual route, scanner/storage or UI activated. Next: connect adapter to disposable SQL/fake-provider service for full HTTP lifecycle plus failure/replay cases, then provider conformance/publication work. Mount only with explicit schema/provider readiness and current authority callback; do not skip the missing integration by claiming user upload available.146IDs preserved; stock/money/catalogue/source/remote holds unchanged.


## Connected private-photo HTTP lifecycle and delivered-feature help reconciled - September25

Completed loopback HTTP->real disposableSQL->real raster decode->fake scanner/private storage->attachment->removal->cleanup test. Scanner outage returns generic503without provider-secret text; same-key retry succeeds, ready replay skips rescan, attach/remove replay preserves receipts, revoked permission403and stale revision409hold, old attach cannot revive removal. Final listing remains draft/quantity0/regular10000cents/version3; no public listing_photos.20inventory tests pass, scoped types/lint pass. Evidence .local/photo-http-connected-tests.log. This is connected local service evidence, not hosted storage/scanner certification.0032unapplied/API37280unchanged.

D32/D33help had stale promotion publication wording. Updated existing promotion article to explain explicit local publication review/UTC/withdrawal and no rewriting existing orders; added bilingual sale-price guide for optionalCAD,clear,no stacking,export columns,reservation/conflict recovery and simulation limits. EN1440/FR390 each verify sale and promotion deep links,3steps,correct content,no horizontal overflow and Escape close. Types/lint pass; docs/evidence/help/sale-promotions.json and scripts/check-help-sale-promotions.cjs. This is content/interaction verification, not a fresh screenshot-based visual audit.

Checklist reorders next useful design-first scope: D32/D33remaining help coverage for already-delivered free-shipping/spend-threshold controls and inventory recovery. UP01private candidate retained; actual providers, public publication/withdrawal, cleanup scheduling and native concurrency remain open, not reasons to expose unsupported UI or generate another disconnected feature. All146IDs retained; remote/source/stock/money holds unchanged.

