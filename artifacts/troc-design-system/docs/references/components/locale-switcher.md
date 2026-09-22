# Locale switcher

- **Normalized family:** `locale-switcher`
- **Status:** **IMPLEMENTED and typechecked — final main-agent browser validation pending.**
- **Source provenance:** Provided TROC specification only; no imported third-party component code.
- **Source:** `src/components/ui/locale-switcher.tsx`
- **Preview:** `src/preview/demos/locale-switcher.tsx`
- **Package export:** `@workspace/troc-design-system/components/ui/locale-switcher`
- **Exports:** LocaleSwitcher; types: LocaleValue, LocaleOption,
  LocaleSwitcherProps
- **Implementation:** New controlled composition using Button or Select according to available space.
- **Dependencies:** Button; Select; i18n context owned by consumer.
- **Required variants/states:** EN and FR; browser-derived initial choice, user override, persistence, current selection, focus-visible, and longer French-label resilience.
- **Evidence:** `docs/references/specifications/07_COPY_I18N_1790026725046.md:3-22`; `docs/references/specifications/Pasted-We-are-starting-the-first-development-milestone-for-TRO_1790027534621.txt:238-255,533-552`.
- **Sequential chunk:** 4 of 7 — implemented and typechecked; final browser validation pending.

## Scope guardrail

This record specifies a reusable visual component only. It does not authorize marketplace pages, business logic, APIs, persistence, optimization, checkout, authentication, or backend work.
