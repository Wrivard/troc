# Retained local catalogue — data and operating notes

This directory holds TROC's local acquisition database and immutable record snapshots. It is not a runtime dependency on an external catalogue API, and not the production PostgreSQL database.

- `acquisition.sqlite`: restartable source staging, identities, cached response hashes and artwork-job state.
- `source-policy.json`: separate metadata/artwork/environment decisions and evidence. No blanket production approval.
- `raw/`: retained source snapshots; untrusted data only, never executed.
- `releases/<record-hash>/records.jsonl`: normalized TROC products, sets, printing/variant IDs, external source identity and provenance. No seller listings. `current.json` points to a verified local revision.
- `TCGDEX-LICENSE.txt`: MIT notice for the TCGdex metadata source. Retain with distributions of this metadata.

Current approved local paths:

```
node --import tsx scripts/catalog/acquire-tcgdex.ts
node --import tsx scripts/catalog/acquire.ts --game=magic
```

The Pokémon path uses pinned TCGdex metadata, not the unlicensed/deprecated historical PokemonTCG snapshot. The latter remains isolated research data. Scryfall metadata use is conditional on its published application rules: free card-data access, additional application value, no raw repackaging/proxy/resale or implied endorsement. Artwork and price-feed approval are separate.

Source updates must be an explicit new revision. Replaying the same revision must add no duplicates or change canonical IDs. New source matching must consult TROC mappings; do not match solely by name. Unknown finishes remain unresolved; catalogue metadata is not evidence a specific seller has that finish.

Local integration now uses scripts/catalog/promote-local.ts and promote-artwork.ts with the existing PostgreSQL schema. Replay preserves canonical IDs and listing stock. Production integration still requires source-specific clearance, hosted database/concurrency validation, operational backups and asset hosting; local success is not production approval.

Backup this directory together with its notices, policies and snapshots. Do not reset or delete the acquisition database to rerun imports. Do not commit raw downloads or the mutable SQLite database as application code.

## Local artwork pipeline

After metadata acquisition and reconcile-existing-sets.ts, run acquire-artwork.ts, then retry-artwork.ts and check-artwork-coverage.ts. The first script resolves provider-confirmed image URLs and caches full-card 245/600px WebP renditions without cropping, sharpening or enlarging small originals. It preserves source hashes, attribution and image faces. The retry script tries documented formats of the exact same card only for 404 images; it never substitutes another card. Missing provider images remain explicit.

Pokémon TCG Pocket is digital-only and excluded from the physical catalogue. Excluded source records and canonical IDs remain retained. The local promotion removes only their discovery documents, and refuses exclusion if any listing references a card. Immutable release exclusions carry a checksum.

Acquisition resumes from ready asset records, writes atomically, and bounds static-CDN traffic to10requests/second (metadata5/second). Source429/5xx retries are bounded. Temporary files for subsequent runs live in image-work, outside the public/build directory. Cached artwork must be backed up together with acquisition.sqlite and releases. Vite ignores new immutable artwork files so bulk imports do not reload open browser pages.

The local preview serves /catalog-art/retained-HASH-WIDTH.webp. At production scale these assets belong in TROC-controlled object storage/CDN, preserving URLs or using the existing allowed asset-origin configuration; do not bundle gigabytes of retained artwork in a serverless function or commit the bulk payloads to Git. The repository ignores bulk caches, while retaining policy, licence notices and import code. No object-storage account or deployment is provisioned by this local import.


## Full-card mobile renditions

After artwork acquisition, run `node --import tsx scripts/catalog/build-thumbnails.ts`. It derives 360px WebP thumbnails from each retained largest full-card rendition, preserves aspect ratio, retains the larger original, and writes a checksummed `thumbnail-renditions.json`. This manifest and hash-named payloads are local generated artifacts, outside Git. Replay reuses files without provider calls. Sources and canonical product/image IDs are unchanged.

Local startup runs `promoteLocalThumbnails` after catalogue/artwork promotion. It only appends a 360px rendition where the existing SQL image already references the exact source URL; existing 360px/manual images are preserved. Production execution is refused. When new artwork is added, rebuild the thumbnail manifest before refreshing local startup. Hosted publishing needs its existing approved operator/object-storage flow; this is not a production migration.

`resolve-missing-artwork.ts` checks exact TCGdex card identities through cached, paced requests. Missing source artwork stays missing: no card-name substitution or synthetic replacement. The final September24 pass found 515 exact records without image metadata and 12 card endpoints returning404; none recovered. Evidence: `docs/evidence/catalog-scale/missing-artwork-detail.json`.


After all local import batches, `refreshLocalCatalogStatistics` runs ANALYZE once per catalogue/rendition revision. This updates the optimizer's row estimates; it does not change card, listing, money or permission data. A production operator should retain normal PostgreSQL auto-analyze and assess explicit ANALYZE after large imports. No hosted maintenance was executed here.

For read-only local query evidence, start the sole local API with `--profile-artwork`. The owner process compares old/new query results at12/248cards and records EXPLAIN ANALYZE; do not open its database from another process. `Server-Timing` now exposes metadata/search/context/artwork stages and SSR render duration, without query content or private account data.
