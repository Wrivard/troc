# TROC logo

- **Normalized family:** `logo`
- **Status:** **IMPLEMENTED and typechecked — final main-agent browser validation pending.**
- **Source provenance:** Provided TROC specification only; no imported third-party component code.
- **Source:** `src/components/ui/logo.tsx`
- **Preview:** `src/preview/demos/logo.tsx`
- **Package export:** `@workspace/troc-design-system/components/ui/logo`
- **Exports:** TrocLogo; types: TrocLogoVariant, TrocLogoProps
- **Implementation:** New image-backed composition that preserves the supplied asset and permits a future SVG swap without layout changes.
- **Dependencies:** React; retained logo-no-bg brand asset; semantic foreground tokens.
- **Required variants/states:** Dark-background, light-background, monochrome, compact, wordmark-only, wordmark-plus-leaf, clear-space, and minimum-size presentations; never stretch or recreate with UI type.
- **Evidence:** `docs/references/specifications/03_TYPOGRAPHY_LOGO_1790026725045.md:19-31`; `docs/references/specifications/01_BRAND_DIRECTION_1790026725044.md:33-41`; `docs/references/specifications/Pasted-We-are-starting-the-first-development-milestone-for-TRO_1790027534621.txt:105-131,270-285`.
- **Sequential chunk:** 4 of 7 — implemented and typechecked; final browser validation pending.

## Scope guardrail

This record specifies a reusable visual component only. It does not authorize marketplace pages, business logic, APIs, persistence, optimization, checkout, authentication, or backend work.
