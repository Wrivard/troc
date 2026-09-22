# Global search

- **Normalized family:** `global-search`
- **Status:** **IMPLEMENTED and typechecked — final main-agent browser validation pending.**
- **Source provenance:** Provided TROC specification only; no imported third-party component code.
- **Source:** `src/components/ui/global-search.tsx`
- **Preview:** `src/preview/demos/global-search.tsx`
- **Package export:** `@workspace/troc-design-system/components/ui/global-search`
- **Exports:** GlobalSearch; types: GlobalSearchSuggestion, GlobalSearchProps
- **Implementation:** New marketplace composition built from Combobox, Input, and Button.
- **Dependencies:** Combobox; Input; Button; translated labels. No search backend.
- **Required variants/states:** Idle, typing, suggestions, no results, loading, error, selected result, keyboard navigation, mobile expanded treatment, and clear action.
- **Evidence:** `docs/references/specifications/04_COMPONENT_LIBRARY_1790026725045.md:26`; `docs/references/specifications/06_RESPONSIVE_ACCESSIBILITY_1790026725046.md:17-18`; `docs/references/specifications/Pasted-We-are-starting-the-first-development-milestone-for-TRO_1790027534621.txt:533-554`.
- **Sequential chunk:** 4 of 7 — implemented and typechecked; final browser validation pending.

## Scope guardrail

This record specifies a reusable visual component only. It does not authorize marketplace pages, business logic, APIs, persistence, optimization, checkout, authentication, or backend work.

Use `mode="plain"` when there is no suggestion provider. It renders a native search field without combobox/listbox announcements or popup, while preserving clear, submit and Enter actions. Default `mode="autocomplete"` retains supplied suggestions and keyboard selection. The guide demonstrates both modes; neither mode fetches data.
