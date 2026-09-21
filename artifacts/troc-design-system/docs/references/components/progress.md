# Progress bar

- **Normalized family:** `progress`
- **Status:** Pending approval — future family; do not implement in the pilot.
- **Source provenance:** Provided TROC specification only; no imported third-party component code.
- **Planned source:** `src/components/ui/progress.tsx`
- **Planned preview:** `src/preview/demos/progress.tsx`
- **Package export:** `@workspace/troc-design-system/components/ui/progress`
- **Exports:** Progress
- **Implementation:** Themed Radix Progress scaffold.
- **Dependencies:** React; @radix-ui/react-progress; cn.
- **Required variants/states:** Determinate, indeterminate if accessible, zero, partial, complete, labelled, compact/default, and reduced-motion states.
- **Evidence:** `docs/references/specifications/04_COMPONENT_LIBRARY_1790026725045.md:40-41,45`; `docs/references/specifications/06_RESPONSIVE_ACCESSIBILITY_1790026725046.md:12,16`; `docs/references/specifications/Pasted-We-are-starting-the-first-development-milestone-for-TRO_1790027534621.txt:514-528`.
- **Sequential chunk:** 7 of 7 — begins only after every prior chunk is approved and complete.

## Scope guardrail

This record specifies a reusable visual component only. It does not authorize marketplace pages, business logic, APIs, persistence, optimization, checkout, authentication, or backend work.
