# TROC Design System design system

This package defines the visual language for the project. Use it whenever you
build or restyle UI so every surface looks like the same product. It is a real
workspace package (`@workspace/troc-design-system`): other artifacts depend
on it and import its theme and components directly.

## What's here

- `docs/references/README.md` — audit manifest for every retained source-upload
  specification and image, dated 2026-09-21.
- `docs/references/specifications/` — unchanged copies of every supplied TROC
  markdown/text specification. Treat these as authoritative source evidence.
- `docs/references/locked-brand-direction_1790026725044.png`,
  `docs/references/selected-wordmark-reference_1790026725044.png`, and
  `docs/references/wordmark-leaf-lockup-reference_1790026725044.png` — locked
  image style-guide references.
- `docs/references/logos/logo-no-bg_1790026920595.png` — supplied swappable
  raster brand asset; do not redraw or reinterpret it.
- `docs/references/fonts/plus-jakarta-sans-latin.woff2` and `OFL.txt` — locally
  embedded Plus Jakarta Sans asset and bundled Google Fonts OFL licence.
- `docs/references/component-inventory.md` and
  `docs/references/components/<family>.md` — the 46-family, evidence-linked
  approval ledger and sequential dependency-safe chunk plan.
- `SKILL.md` — concise brand, accessibility, localization, responsive, and
  package-usage guidance distilled from the supplied specifications.
- `tokens.json` — the single source of truth (DTCG format): 32 color roles per
  TROC Dark/Light mode, TROC semantic aliases, foundations, type scale,
  typography, spacing, and radius. Exact brand red `#FF2D3D` is preserved;
  accessible action red `#DE1E30` gives white labels 4.85:1 contrast.
- `scripts/build-tokens.mjs` — generates the outputs below from `tokens.json`.
- `scripts/component-styles.css` and `scripts/components/*.css` —
  generator-input reusable family styling included in generated consumer CSS.
- `scripts/preview.css` — documentation-site layout only; never imported by
  consumers.
- `scripts/applied-examples.css` — guide-only styling for Mobile and Applied;
  never imported by consumers.
- `src/index.css` — GENERATED token/theme web output, including the local Plus
  Jakarta Sans font face, exported as `./styles.css`.
- `src/generated/tokens.tsx` — GENERATED hex token object, the package's `.` and
  `./tokens` entry. Mobile (Expo) and other platforms import this.
- `public/favicon.svg` — GENERATED app icon from `tokens.json` + the title.
- `src/components/ui/` — the shipped web component location, exported through
  `./components/*` and consumed as `./components/ui/<family>`.
- `src/lib/` (`cn`, bilingual `messages` keys/types) and `src/hooks/`
  (`PreferencesProvider`, `usePreferences`) — exported as `./lib/*` and
  `./hooks/*`.
- `src/App.tsx` — the entry point for the living style guide.
- `src/preview/DesignSystemBrowser.tsx` — the persistent grouped navigation,
  branded header, search, deep links, and active page shell.
- `src/preview/registry.tsx` — preview metadata (`DESIGN_SYSTEM` title,
  description) and ordered navigation. Overview comes first;
  Brand/Colors/Fonts/Layout precede Components; Content/Charts/Motion/Applied
  examples follow when applicable. Each group is a nav section whose entries
  are its nested pages. Empty optional groups stay hidden. Keep component pages
  loaded with `lazy(() => import(...))` so opening the preview does not download
  every story.
- `src/preview/foundations.tsx` — token-driven Overview, Colors, Fonts, and Layout
  pages.
- `src/preview/parts.tsx` — shared page helpers, including `Guidelines` for design
  and composition do's/don'ts (colour/component usage, hierarchy, voice and tone,
  not technical implementation notes). Populate it only with guidance derived
  from the source; omit it when the source documents no usage rules.
- `src/preview/demos/<component>.tsx` — component stories. Keep these stories and
  the registry aligned with the final web component inventory.
- `docs/consuming-web.md`, `docs/consuming-expo.md`, and
  `docs/consuming-slides.md` — platform-specific usage.
- `docs/migrating-web.md` and `docs/migrating-expo.md` — replacing scaffolded or
  existing local design-system implementations.

Every source file in this package is a `.tsx` file, including token, utility,
and hook modules with no JSX, so every export below is a single `*.tsx` glob. Do
not add `.ts` files here.

## Design polish additions (2026-09-22)

Product presentation also exports `CardShowcase` for static layered card artwork;
site navigation offers opt-in `compactMobile`. Both remain in their existing
families, with updated stories and family records. Tokens and default variants
are unchanged.

## What this package exports

```jsonc
".":              "./src/generated/tokens.tsx",
"./tokens":       "./src/generated/tokens.tsx",
"./styles.css":   "./src/index.css",
"./components/*": "./src/components/*.tsx",
"./lib/*":        "./src/lib/*.tsx",
"./hooks/*":      "./src/hooks/*.tsx"
```

Components import each other with relative paths internally, so they resolve
correctly when another package imports them through
`@workspace/troc-design-system/components/ui/...`. Never use a `@/` alias inside
this package. Components added through shadcn may use this package's
`#components/*`, `#lib/*`, and `#hooks/*` imports from `package.json`; those are
consumer-safe because they resolve against this package.

## Editing and maintaining the design system

Edit `tokens.json` only, then run `pnpm tokens`; the dev server also regenerates
on change. Never hand-edit `src/index.css` or `src/generated/tokens.tsx`.

Every user-facing web component under `src/components/ui/` must have a family
story in `src/preview/demos/` covering its variants, sizes, and important states.
Register each family once in `src/preview/registry.tsx`. If a component changes,
update its story and registry entry in the same change and note meaningful
additions or customizations in "What's here" above. Register new component pages
with dynamic imports; do not eagerly import stories into the registry.

## TROC milestone scope

The living review route is `/style-guide`. It is the design-system approval
checkpoint, not a marketplace page. The complete component scope is documented
in `docs/references/component-inventory.md`. The five-family pilot is approved
and verified. Chunks 2–6 bring the implemented/typechecked total to 42
families. Chunk 7's four data families and stories are implemented but still
await main-agent typecheck evidence. Final main-agent browser validation remains
pending for all 41 post-pilot families; do not mark it passed or call those
families user-approved early.

The corrected dependency-safe counts are `5 / 6 / 9 / 6 / 12 / 4 / 4`.
Progress and Seller Reputation moved to the start of chunk 5 because three
marketplace progress compositions require Progress and Seller Offer consumes
Seller Reputation's `SellerRating`.

The complete catalog registers one lazy page for each of 46 families. Overview,
four foundation pages, Voice, Accessibility, Mobile, and the Applied marketplace
composition bring the completed guide to **55 pages**. Applied and Mobile are
bounded local demonstrations, not marketplace product pages.

Before final milestone reconciliation, use
`docs/references/milestone-acceptance-audit.md` for the cross-cutting,
non-family requirements reread from all 14 retained written specifications.
`docs/references/milestone-completion-report.md` records the implementation
handoff, explicit design decisions, known localization findings, and remaining
approval items.

`docs/references/card-artwork.md` records static card-art provenance. Card
images are illustration-only demos, never a live catalog/API integration, and
reusable components receive image URLs via props.

Do not add marketplace pages or business logic: no authentication, catalog or
marketplace database, payments, checkout, seller onboarding/dashboard backend,
orders, shipping integrations, card APIs, collection backend, scanner, or Smart
Cart optimization. Marketplace, seller, cart, Smart Cart, navigation, feedback,
and data families are reusable visual modules and local demonstrations only,
never product pages, business logic, or backends.

All component and preview source modules are `.tsx`. Combobox is specifically a
self-contained native ARIA editable-combobox composed with Input and Button; it
must not expose or require Popover as part of its public component dependency.

Dialog, Drawer, and Toaster use explicit translated `closeLabel` contracts.
Removable Chip uses a required translated `removeLabel`; selectable and removal
controls remain siblings so interactive elements are never nested.

`PreferencesProvider` and `usePreferences` live at
`hooks/use-preferences`; they provide persistent TROC Dark (default)/TROC Light
and English/French browser-initial/user-override preferences. Providers are
required only when using that hook. Components accept visible labels as props
or children and do not require providers. Translation keys and types live at
`lib/messages`.

The public theme names are **TROC Dark** and **TROC Light**, following the newer
long brief; these supersede the older modular specification's “Canada” labels.

Pilot verification established that the review route supports
`?theme=dark|light&lang=en|fr` deep links.
These select a review state; an explicit user preference change clears the query
override and persists the new choice. Theme/locale reload persistence,
reduced-motion behavior, the then-current 13 pages at 390/768/1280/1920 px,
nested theme
samples, package TypeScript, and production build have passed main-agent
verification without overflow, broken images, uncaught browser errors, or
incorrect theme computation. Verified nested samples compute to dark
`#0E0E0E`/`#F4F4F4` and the inverse in light.

Button's public variants are default/primary, secondary, ghost/tertiary,
outline, and destructive, with icon size; no link variant is public. The
generated `favicon.svg` embeds the faithful supplied custom-leaf PNG, not a
generated letter. Bundled consumer-safe raster logo variants live under
`src/assets/brand/`; public review/download copies live under `public/brand/`.
Static demo card art lives under `src/assets/cards/` and remains
illustration-only under `docs/references/card-artwork.md`.

Public logo files are crops or monochrome/white-wordmark recolourings of the
supplied raster artwork; no shapes are redrawn. One leaf-width clear space and a
24 px minimum rendered height are provisional guidance pending approval.

No native components, native theme, or native font hooks are shipped. All 46
current families are web/DOM modules. A future authorized native chunk will live under
`src/components/native/`, match web family APIs where React Native supports
them, and document platform-required differences here. Never present planned
native paths as available exports.

Keep `DESIGN_SYSTEM.title` and `DESIGN_SYSTEM.description` accurate. Update
`NAV_GROUPS` whenever the system gains or loses a foundation, content guideline,
chart, motion rule, or applied example.

## Keep it template-ready

This design system is a prime candidate to be saved to the workspace as a
reusable template, and a template is packaged as this one directory alone. Keep
it self-contained as you maintain it so that save works: use concrete dependency
versions (never `catalog:`), keep `tsconfig.json` standalone (never `extends` a
workspace-relative base), and never import from a sibling artifact or a shared
`@workspace/*` lib. A saved template is consumed as a read-only style donor
(re-authored from, not rebuilt), so keep the generated `src/index.css` and
`src/generated/tokens.tsx` committed so the template carries a readable theme
snapshot. If maintenance ever introduces a cross-artifact or workspace-lib
dependency, load the `prepare-artifact-template` skill and follow it to pull the
dependency back in before the user saves the template.

## Prototyping on the canvas

Use the mockup-sandbox skill's "Design systems" flow. It creates a sandbox entry
for `@workspace/troc-design-system` and renders mockups using this package's
theme and components.

## Consuming this package

Never copy token values, component source, hooks, or these docs into a consuming
artifact. Add `@workspace/troc-design-system` as a `workspace:*` dependency,
run `pnpm install`, and import directly from this package. Slide decks are the
one exception: SDM documents cannot import packages or CSS, so follow
`docs/consuming-slides.md` to translate tokens into each slide document's
`theme` instead.

Read only the guides required by the current task:

- Building or styling web UI: `artifacts/troc-design-system/docs/consuming-web.md`
- Building or styling Expo UI: `artifacts/troc-design-system/docs/consuming-expo.md`
- Building or styling a slide deck: `artifacts/troc-design-system/docs/consuming-slides.md`
- Replacing an existing or scaffolded web theme/component library:
  `artifacts/troc-design-system/docs/migrating-web.md`
- Replacing existing or scaffolded Expo theme/hooks/components:
  `artifacts/troc-design-system/docs/migrating-expo.md`

A freshly scaffolded app counts as a migration when it still contains local
theme, hook, or component copies that this package supersedes. Read the platform
consumption guide first, then its migration guide before authoring UI.

For web/static consumers, follow the workspace dependency placement rules from
the pnpm-workspace skill. Expo is a runtime consumer, so the package belongs in
`dependencies`.

Before migrating an entire app, render one platform-appropriate primitive from
the package and run the consumer's typecheck and dev server. Proceed only after
the import resolves and the primitive uses this design system's theme.

## Universal rules

- Match exact token values. Do not invent colors, fonts, spacing, or radii in a
  consuming app.
- Keep product data, navigation, application state, and product-specific
  compositions in the app. Product-agnostic visual primitives belong here.
- Read these docs in place. Do not copy them into another artifact.
