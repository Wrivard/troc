# Chips and filter chips

- **Normalized family:** `chips`
- **Status:** **IMPLEMENTED and typechecked — final main-agent browser validation pending.**
- **Source provenance:** Provided TROC specification only; no imported third-party component code.
- **Source:** `src/components/ui/chips.tsx`
- **Preview:** `src/preview/demos/chips.tsx`
- **Package export:** `@workspace/troc-design-system/components/ui/chips`
- **Exports:** Chip, ChipGroup; types: ChipProps, ChipGroupProps
- **Implementation:** Themed new composition; use native button semantics when interactive.
- **Dependencies:** React; Button or native button; cn.
- **Required variants/states:** Static, selectable/filter, selected, hover, focus-visible, disabled, removable, and game-chip treatment.
- **Implemented contract:** Selectable and removal controls are sibling
  controls, avoiding nested interactive elements. A removable Chip requires a
  translated `removeLabel`; no English close/remove label is embedded.
- **Evidence:** `docs/references/specifications/04_COMPONENT_LIBRARY_1790026725045.md:10,27,50-58`; `docs/references/specifications/Pasted-We-are-starting-the-first-development-milestone-for-TRO_1790027534621.txt:384-392,518-528`.
- **Sequential chunk:** 2 of 7 — implemented and typechecked; final browser validation pending.

## Scope guardrail

This record specifies a reusable visual component only. It does not authorize marketplace pages, business logic, APIs, persistence, optimization, checkout, authentication, or backend work.
