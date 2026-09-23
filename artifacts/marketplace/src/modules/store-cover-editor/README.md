# Store cover editor presentation

D28 isolated UI. Reuses approved Button, typography, tokens, supplied Card Forge cover, and D27 ratios (desktop 5:2; mobile/store card 16:9). No API, upload, seller controller, persistence or new design-system primitive. Parent must provide a valid already-decoded source and stable value object. Component supplies a page h1.

## Contract

```ts
value: { sourceUrl: string; width: number; height: number; framing: { x: number; y: number; zoom: number } }
onSave: (draft: { originalFile?: File; width: number; height: number; framing: CoverFraming }) => Promise<void>
onCancel: () => void
rules?: CoverImageRules
```

x/y are overflow-alignment percentages 0–100 (same semantics as object-position), not source-image pixel coordinates. Zoom is 1–3. Both ratios apply cover scaling first, then zoom; align the resulting overflow by x/y. This preserves aspect ratio and never exposes empty edges. Use the exported coverGeometry in the eventual renderer, or exactly equivalent math; simply applying object-position without zoom will not reproduce a saved preview.

Original dimensions are browser-decoded dimensions, including supported EXIF orientation. The original File is passed unchanged; no canvas rasterization or destructive crop. Undefined originalFile means framing the existing source. Persist a versioned framing representation and authoritative original asset identity in the future parent; do not persist the component's temporary blob URL. Parent owns server validation, authenticated storage, source ownership, save lifecycle and canonical reread. Resolve onSave only after actual save; reject to retain draft. Parent must publish new value after success and ignore stale completions after close, source switch or navigation. In-progress controls are disabled. Cancel resets to the latest value and calls onCancel; it also invalidates image decoding. Unmount/source changes invalidate local async completion and revoke component-owned URLs.

The harness simulates successful saves in memory, re-edit and failure. Close while saving invalidates the parent callback; reload discards everything. No actual persistence claim. Harness-owned accepted URLs are separate from component-owned draft URLs and released on harness unmount.

## Validation scope

Configurable DEMO defaults: JPEG/PNG/WebP, nonempty <=10MiB, decoded >=800×320 pixels, <=10000 per side, <=40M pixels. Portrait is accepted with a crop warning. These are not an approved upload/storage policy. Local MIME/decoding checks are UX only; server must independently verify actual format/content, dimensions/orientation, limits and authorization before integration. Animated image handling and server image sanitization remain product/backend decisions. Never treat this UI as a security boundary.

## Run

From artifacts/marketplace:

```sh
pnpm exec vite --config src/modules/store-cover-editor/harness/vite.config.ts --configLoader runner
```

Open http://127.0.0.1:4317/?lang=fr&theme=light (also en/dark). Build with the same config using `vite build`. From repo root: `node tests/store-cover-editor-preview.mjs`. Uses existing Playwright/axe/sharp dependencies; no new package.

Existing local supplied asset: public/demo-store-branding/cardforge-cover.webp (1672×941). No asset imported or regenerated. Synthetic PNG/JPEG fixtures are generated in memory by the test, including JPEG EXIF rotation. Screenshots/results are in verification/, excluded from this source commit.
