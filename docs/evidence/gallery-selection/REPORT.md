# D14 gallery selection — local regression evidence

Reproduced before correction: choose Detail, then remove that image from the same product. The displayed image falls back to Front but no side button has aria-pressed=true. Original numeric selection also follows list position when artwork is reordered.

Correction: selection stores exact product, variant and image IDs. Reordering preserves the selected image; removal or product/variant change clears stale selection and selects the first current image. Display, active button and full-image URL derive from the same image. Existing variant-image precedence is unchanged.

Verification: scripts/check-gallery-selection.cjs passes EN1440 and FR390 with isolated typed fixtures: shrink, reorder, product switch, variant switch, keyboard activation and empty artwork. Every populated assertion verifies decoded displayed URL, selected button and full-image destination. No fixture was imported into the catalogue. Frontend TypeScript and scoped ESLint pass. No visual-layout change or new visual certification.

Remaining: actual browser zoom and unsampled game/source coverage. These checks do not certify full catalogue artwork or hosted readiness.
Client and SSR builds also pass; existing bundle-size warnings remain. Log: .local/gallery-selection-build.log.
