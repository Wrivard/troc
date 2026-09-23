# D28 store cover editor presentation handoff

2026-09-23. Isolated candidate on 5501166. Independent review pending; no live seller integration or persistence. A acknowledged the typed future adapter and absence of current authoritative upload/storage rules.

## Existing work inspected and preserved

D27 delivered standardized5:2 detail desktop and16:9 mobile/compact covers in9e06965 (STORE_FRAMING_HERO_UPSCALE_HANDOFF). Current demo-store-branding preserves canonical seller identities and supplies Card Forge50%0% alignment. SellerPlatformApp and A's current seller modules contain no cover editor or saved framing. Existing covers/avatars are reused rather than recreated. No existing shared/page/controller source changed.

## Candidate

Only new modules/store-cover-editor/ and tests/store-cover-editor-preview.mjs. Native image decode/local File, approved Button/tokens, scoped CSS, integer-position and fractional-zoom ranges, simultaneous desktop/mobile previews, portrait guidance, localized validation, cancel/reset, busy/error state and retained draft. Pure crop.ts computes cover geometry with no blank edges or stretching. No duplicate persistence; explicitly simulated harness only. Complete typed adapter semantics, demo limits, URL lifetimes and integration responsibilities in module README.

## Author validation

- Marketplace TypeScript PASS; scoped ESLint PASS (test Buffer import corrected).
- Isolated Vite production build PASS,1688modules. No live marketplace rebuild.
-216pure geometry cases across portrait/landscape/square,2ratios,3horizontal/vertical endpoints,3zoom levels: coverage and unchanged aspect ratio PASS; known-edge oracle and invalid geometry/file/dimension checks PASS.
- Four real browser cases:1440ENdark,834FRlight,390ENlight,320FRdark, reduced motion. Native keyboard End/ArrowRight, crop bounds, cancel to saved framing/source, reset values, image loads/nooverflow, portrait hint, disallowed format/tiny/corrupt rejection, error retains File/framing, retry, exact original file bytes, in-memory re-edit PASS.
- EXIF6 JPEG decoded1200×800 from800×1200 raw, consistent previews. No other orientation/format-engine matrix claimed.
- Cancel and unmount revoke draft URLs; close during pending simulated save ignores stale completion; re-open retains last accepted frame. No mutation requests, storage unchanged, no pageerrors.
- Four scoped axe scans, zero violations. Does not substitute for screen-reader/physical touch/cross-engine/real200%zoom verification.
- Evidence verification/cover-editor.json plus four full-page JPEGs. Actually inspected initial1440ENdark/320FRdark; improved file picker then inspected FINAL390ENlight and320FRdark. Final1440/834 captures exist but not reopened. The only visual correction was using an approved localized Button instead of OS-English native file-picker text; actual narrow final rendering verified.

## Remaining gates

Independent exact-candidate UX review; A source/upload lifecycle integration and server validation/storage authorization; canonical framing persistence/reread and public-detail/compact-card application; shared release checks. Local defaults do not approve storage policy. Real D28 persistence and D27 final public-route acceptance remain open. No remote write/push/deploy. No homepage/hero files touched.

Owned preview4317, session29398. Earlier4314/4315/4316 and existing4313/5313 preserved. Stop only owned processes if explicitly retiring this harness.
