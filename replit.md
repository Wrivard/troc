# TROC

TROC is Canada’s trading card marketplace. This milestone establishes its visual
identity and reusable design system. The full guide is now APPROVED by the user.
Milestone 1 foundation is authorized; Milestone 2 requires another explicit approval.

## Current foundation handoff

Use `IMPLEMENTATION_STATUS.md`, `docs/FOUNDATION_ARCHITECTURE.md` and
`docs/FOUNDATION_SETUP.md` for the current scope and commands. The marketplace consumer
is `artifacts/marketplace`; the existing guide remains `artifacts/troc-design-system`.
The numbered post-style-guide pack is the product source of truth. The historical
Milestone 0 notes below describe the earlier work and do not override current user
approval or Milestone 1 authorization.

## Historical Milestone 0 scope

- Review the living guide at `/style-guide` in the TROC Design System artifact.
- The user approved the foundations and Button, Input, Textarea, Select, and
  Combobox pilot on 2026-09-21, authorizing completion of the remaining style guide.
- The 46-family web catalog is implemented and technically verified: contract,
  package TypeScript, production build, interaction/composition, and responsive
  55-page browser checks passed. The 41 post-pilot families still await final
  user visual approval.
- Stop after the complete style guide for final approval before any marketplace
  development.
- Do not add authentication, databases, catalog APIs, payments, checkout,
  seller/dashboard backends, orders, shipping APIs, scanners, or Smart Cart
  optimization. Marketplace examples are reusable visual components only.
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
  completed family has one lazy-loaded story. The finished guide has 55 pages:
  Overview, four foundations, 46 family pages, Voice, Accessibility, Mobile,
  and one bounded Applied composition.

## Brand and review decisions

- Preserve the supplied italic wordmark and custom leaf; no redraw, generic leaf,
  flag, emoji, or UI-font substitute. Raster assets remain replaceable by final vectors.
- Only charcoal, white/off-white, greys, and TROC red are in scope.
- Exact accent `#FF2D3D` is retained. Action red `#DE1E30` supports white text at
  4.85:1; small white text on the original accent does not meet AA.
- Plus Jakarta Sans is bundled under the Open Font License.
- TROC Dark is the default. Explicit theme and EN/FR choices persist locally;
  browser language determines only the initial locale.
- The pilot's typography, contrast treatment, and overall direction are
  approved. Technical verification is not visual approval of the 41 new
  families. Final French editorial/visual review, the provisional logo
  clear-space/minimum-size guidance, and production SVG replacement remain
  review items. No formal WCAG certification is claimed.

## Future consumption

Read `docs/consuming-web.md` before using the package. Import shared tokens,
styles, and exact family exports rather than copying or restyling them. Expo and
slides are token-only consumers; they cannot import the web/DOM families.
