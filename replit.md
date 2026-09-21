# TROC

TROC is Canada’s trading card marketplace. This milestone establishes its visual
identity and reusable design system only; no marketplace application is authorized.

## Current scope

- Review the living guide at `/style-guide` in the TROC Design System artifact.
- The first review covers the foundations and exactly five component families:
  Button, Input, Textarea, Select, and Combobox.
- Ask for visual approval before implementing later inventory chunks. Stop after
  the complete style guide for final approval before any marketplace development.
- Do not add authentication, databases, catalog APIs, payments, checkout,
  seller/dashboard backends, orders, shipping APIs, scanners, or Smart Cart
  optimization. Future marketplace examples are reusable visual components only.
- Existing API and mockup-sandbox scaffolds are unrelated to this milestone and
  remain untouched.

## Run & maintain

- Managed workflow: `artifacts/troc-design-system: web`.
- Package: `@workspace/troc-design-system`; artifact at `artifacts/troc-design-system`.
- `pnpm --filter @workspace/troc-design-system run tokens` regenerates tokens/styles.
- `pnpm --filter @workspace/troc-design-system run typecheck` checks this package.
- The managed workflow supplies `PORT` and `BASE_PATH`; do not hardcode them.
- No secrets, integrations, or database are needed for this milestone.

## Source of truth

- Read `artifacts/troc-design-system/docs/AGENTS.md` and `SKILL.md` before extending
  the library.
- `docs/references/specifications/` retains the supplied written requirements.
  Written specifications take priority over images. The longer milestone brief
  supplies the current “TROC Dark / TROC Light” names.
- `docs/references/component-inventory.md` records all requested families and
  their sequential, dependency-safe approval boundaries.
- `tokens.json` defines shared values; generated styles and token exports must
  not be hand-edited. Primitive styles and preview-only styles have separate inputs.
- Source modules are `.tsx`, use package-safe relative imports, and every
  implemented family has one lazy-loaded story.

## Brand and review decisions

- Preserve the supplied italic wordmark and custom leaf; no redraw, generic leaf,
  flag, emoji, or UI-font substitute. Raster assets remain replaceable by final vectors.
- Only charcoal, white/off-white, greys, and TROC red are in scope.
- Exact accent `#FF2D3D` is retained. Action red `#DE1E30` supports white text at
  4.85:1; small white text on the original accent does not meet AA.
- Plus Jakarta Sans is bundled under the Open Font License.
- TROC Dark is the default. Explicit theme and EN/FR choices persist locally;
  browser language determines only the initial locale.
- Clear space, minimum logo size, selected typography, contrast adjustment, and
  French messaging remain visual/content decisions for user approval.

## Future consumption

Read `docs/consuming-web.md` before using the package. Import shared tokens, styles,
and available components rather than copying or restyling them. Only implemented
families are available; remaining inventory entries are not working exports yet.