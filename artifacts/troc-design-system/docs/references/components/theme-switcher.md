# Theme switcher

- **Normalized family:** `theme-switcher`
- **Status:** **IMPLEMENTED and typechecked — final main-agent browser validation pending.**
- **Source provenance:** Provided TROC specification only; no imported third-party component code.
- **Source:** `src/components/ui/theme-switcher.tsx`
- **Preview:** `src/preview/demos/theme-switcher.tsx`
- **Package export:** `@workspace/troc-design-system/components/ui/theme-switcher`
- **Exports:** ThemeSwitcher; types: ThemeValue, ThemeOption,
  ThemeSwitcherProps
- **Implementation:** New controlled composition using Button or Select and semantic theme attributes.
- **Dependencies:** Button; Select; consumer theme context/local persistence.
- **Required variants/states:** TROC Dark default and TROC Light, persisted preference, current selection, icon plus accessible text, focus-visible, and extensible option model without extra themes now.
- **Evidence:** `docs/references/specifications/02_TOKENS_THEMES_1790026725045.md:35-39`; `docs/references/specifications/Pasted-We-are-starting-the-first-development-milestone-for-TRO_1790027534621.txt:185-201,533-552`.
- **Sequential chunk:** 4 of 7 — implemented and typechecked; final browser validation pending.

## Scope guardrail

This record specifies a reusable visual component only. It does not authorize marketplace pages, business logic, APIs, persistence, optimization, checkout, authentication, or backend work.
