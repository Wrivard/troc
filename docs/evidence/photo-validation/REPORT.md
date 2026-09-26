# Photo validation foundation

## Photo resource validation completed locally - September25

UP01 server foundation now rejects actual two-frame WebP (fixture confirms2pages), caps concurrent decodes at2per process with503/no queue before byte copying, releases slots after both success/failure, and configures Sharp5second processing timeout. Timeout is decoder processing protection, not a tested end-to-end HTTP deadline or hard worker termination guarantee. No new route/provider activation.

Added readImageBytes streaming collector: counts real byte length independent of headers; rejects empty/over10MiB; closes generator on overflow; propagates transport interruption; copies reused producer buffers safely. Fixed10MiBbacking avoids unbounded chunk-object overhead from tiny fragments. Caller still must enforce ingress concurrency/deadlines before opening streams; decoder admission alone does not bound inbound HTTP streams.

Six targeted tests pass, including animation, admission saturation/recovery, empty/oversized/corrupt/spoofed inputs, orientation/metadata/resize, transport closure and reused buffers. APItypes and scoped lint pass before final collector storage refinement; targeted suite passes after refinement. Evidence tests/image-preparation.test.ts and .local/photo-resource-tests.log. API3772 unchanged; these server-only helpers are not public upload functionality.

NEXT coherent UP01batch: transactional server-owned quarantine/attachment lifecycle, immutable object hash/owner/listing binding, fake storage/scanner adversarial tests (cross-owner, replay, expiry, scanner failure, permission revocation) before routes/UI/hosted setup. Include request admission/deadline orchestration; no upload claims until it exists. All146IDs retained; permissions/stock/money/catalogue/source and remote holds unchanged.

