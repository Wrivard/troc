# Filters and sort controls

- **Normalized family:** `data-controls`
- **Status:** Pending approval — future family; do not implement in the pilot.
- **Source provenance:** Provided TROC specification only; no imported third-party component code.
- **Planned source:** `src/components/ui/data-controls.tsx`
- **Planned preview:** `src/preview/demos/data-controls.tsx`
- **Package export:** `@workspace/troc-design-system/components/ui/data-controls`
- **Exports:** FilterBar, FilterGroup, SortControl
- **Implementation:** New responsive composition using Chips, Select, Input, Button, and Drawer on narrow screens.
- **Dependencies:** Chip; Select; Input; Button; Drawer; translated labels.
- **Required variants/states:** No filters, active filters, clear all, filter count, sort choice, disabled/loading, desktop inline, mobile drawer, and keyboard states.
- **Evidence:** `docs/references/specifications/04_COMPONENT_LIBRARY_1790026725045.md:10`; `docs/references/specifications/06_RESPONSIVE_ACCESSIBILITY_1790026725046.md:17-18`; `docs/references/specifications/Pasted-We-are-starting-the-first-development-milestone-for-TRO_1790027534621.txt:514-528,557-565`.
- **Sequential chunk:** 7 of 7 — begins only after every prior chunk is approved and complete.

## Scope guardrail

This record specifies a reusable visual component only. It does not authorize marketplace pages, business logic, APIs, persistence, optimization, checkout, authentication, or backend work.
