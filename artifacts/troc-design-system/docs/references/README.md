# TROC source-reference manifest

Retained from the **source upload** on **2026-09-21**. Filenames are unchanged for audit. These files are evidence, not implementation source.

## Locked image style-guide

| Retained path | Classification |
|---|---|
| `locked-brand-direction_1790026725044.png` | Locked image style-guide |
| `selected-wordmark-reference_1790026725044.png` | Locked image style-guide |
| `wordmark-leaf-lockup-reference_1790026725044.png` | Locked image style-guide |

## Brand asset

| Retained path | Classification |
|---|---|
| `logos/logo-no-bg_1790026920595.png` | Logo image; brand asset |

The logo image is the supplied swappable raster brand asset. Do not redraw the wordmark, substitute an ordinary font, or replace the custom-leaf direction with an emoji, generic icon-library leaf, random leaf, or official Canadian flag leaf.

Public logo variants are crops and monochrome/white-wordmark recolourings of
the supplied raster. No shapes were redrawn. One leaf-width of clear space and
a 24 px minimum rendered height are provisional usage guidance pending visual
approval.

## Font asset and licence

| Retained path | Classification |
|---|---|
| `fonts/plus-jakarta-sans-latin.woff2` | Plus Jakarta Sans Latin webfont; typography asset |
| `fonts/OFL.txt` | Bundled Google Fonts Open Font License |

Font provenance: Google Fonts static asset host,
`fonts.gstatic.com/s/plusjakartasans/v12`. The locally retained WOFF2 is embedded
by the generated CSS; consumers do not need a runtime font request. The bundled
`OFL.txt` is the governing licence copy.

## Specifications

Every file below is classified as a **spec** from the source upload:

- `specifications/00_START_HERE_1790026725044.md`
- `specifications/01_BRAND_DIRECTION_1790026725044.md`
- `specifications/02_TOKENS_THEMES_1790026725045.md`
- `specifications/03_TYPOGRAPHY_LOGO_1790026725045.md`
- `specifications/04_COMPONENT_LIBRARY_1790026725045.md`
- `specifications/05_STYLE_GUIDE_PAGE_1790026725045.md`
- `specifications/06_RESPONSIVE_ACCESSIBILITY_1790026725046.md`
- `specifications/07_COPY_I18N_1790026725046.md`
- `specifications/08_ACCEPTANCE_CHECKLIST_1790026725046.md`
- `specifications/09_REPLIT_PROMPT_1790026725046.md`
- `specifications/Pasted-We-are-starting-the-first-development-milestone-for-TRO_1790027534621.txt`
- `specifications/README_1790026725047.md`
- `specifications/replit_1790026725047.md`
- `specifications/TROC_STYLE_GUIDE_MASTER_1790026725047.md`

## Inventory

- `component-inventory.md` is the normalized 46-family approval index and sequential chunk plan.
- `components/<family>.md` records each family's evidence lines, `.tsx`
  implementation/preview paths, exports, dependencies, variants, states, and
  approval/implementation status.
- `card-artwork.md` records provenance for static illustration-only demo card
  images. They are not connected to a live catalog, inventory, pricing, or
  sales API; reusable components receive image URLs through props.
- `milestone-acceptance-audit.md` separates retained source/static coverage
  from final browser/visual acceptance.
- `milestone-completion-report.md` records what was built, package structure,
  explicit non-spec decisions, current verification, and remaining approvals.