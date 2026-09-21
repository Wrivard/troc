# Locale switcher

- **Normalized family:** `locale-switcher`
- **Status:** Pending approval — future family; do not implement in the pilot.
- **Source provenance:** Provided TROC specification only; no imported third-party component code.
- **Planned source:** `src/components/ui/locale-switcher.tsx`
- **Planned preview:** `src/preview/demos/locale-switcher.tsx`
- **Package export:** `@workspace/troc-design-system/components/ui/locale-switcher`
- **Exports:** LocaleSwitcher
- **Implementation:** New controlled composition using Button or Select according to available space.
- **Dependencies:** Button; Select; i18n context owned by consumer.
- **Required variants/states:** EN and FR; browser-derived initial choice, user override, persistence, current selection, focus-visible, and longer French-label resilience.
- **Evidence:** `docs/references/specifications/07_COPY_I18N_1790026725046.md:3-22`; `docs/references/specifications/Pasted-We-are-starting-the-first-development-milestone-for-TRO_1790027534621.txt:238-255,533-552`.
- **Sequential chunk:** 4 of 7 — begins only after every prior chunk is approved and complete.

## Scope guardrail

This record specifies a reusable visual component only. It does not authorize marketplace pages, business logic, APIs, persistence, optimization, checkout, authentication, or backend work.
