# Progress bar

- **Normalized family:** `progress`
- **Status:** **IMPLEMENTED and typechecked — final main-agent browser validation pending.**
- **Source provenance:** Provided TROC specification only; no imported third-party component code.
- **Source:** `src/components/ui/progress.tsx`
- **Preview:** `src/preview/demos/progress.tsx`
- **Package export:** `@workspace/troc-design-system/components/ui/progress`
- **Exports:** Progress, progressVariants; type: ProgressProps
- **Implementation:** Themed Radix Progress scaffold.
- **Dependencies:** React; @radix-ui/react-progress; cn.
- **Required variants/states:** Determinate, indeterminate if accessible, zero, partial, complete, labelled, compact/default, and reduced-motion states.
- **Evidence:** `docs/references/specifications/04_COMPONENT_LIBRARY_1790026725045.md:40-41,45`; `docs/references/specifications/06_RESPONSIVE_ACCESSIBILITY_1790026725046.md:12,16`; `docs/references/specifications/Pasted-We-are-starting-the-first-development-milestone-for-TRO_1790027534621.txt:514-528`.
- **Sequential chunk:** 5 of 7 — implemented before its dependent marketplace
  families; typechecked, with final browser validation pending.

## Scope guardrail

This record specifies a reusable visual component only. It does not authorize marketplace pages, business logic, APIs, persistence, optimization, checkout, authentication, or backend work.

## Milestone 3 validation — 2026-09-22

Commerce integration reuses this family. Shared fixes: progress bars retain accessible names with visible headers; zero-minimum progress is complete; Smart Cart savings text uses the existing primary-text token for light-theme contrast; seller-group metadata wraps on mobile. No token values or brand redesign. EN/FR dark/light browser checks and standalone/integrated guide comparisons passed.
