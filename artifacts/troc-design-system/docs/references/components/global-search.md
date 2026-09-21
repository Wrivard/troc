# Global search

- **Normalized family:** `global-search`
- **Status:** Pending approval — future family; do not implement in the pilot.
- **Source provenance:** Provided TROC specification only; no imported third-party component code.
- **Planned source:** `src/components/ui/global-search.tsx`
- **Planned preview:** `src/preview/demos/global-search.tsx`
- **Package export:** `@workspace/troc-design-system/components/ui/global-search`
- **Exports:** GlobalSearch
- **Implementation:** New marketplace composition built from Combobox, Input, and Button.
- **Dependencies:** Combobox; Input; Button; translated labels. No search backend.
- **Required variants/states:** Idle, typing, suggestions, no results, loading, error, selected result, keyboard navigation, mobile expanded treatment, and clear action.
- **Evidence:** `docs/references/specifications/04_COMPONENT_LIBRARY_1790026725045.md:26`; `docs/references/specifications/06_RESPONSIVE_ACCESSIBILITY_1790026725046.md:17-18`; `docs/references/specifications/Pasted-We-are-starting-the-first-development-milestone-for-TRO_1790027534621.txt:533-554`.
- **Sequential chunk:** 4 of 7 — begins only after every prior chunk is approved and complete.

## Scope guardrail

This record specifies a reusable visual component only. It does not authorize marketplace pages, business logic, APIs, persistence, optimization, checkout, authentication, or backend work.
