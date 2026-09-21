# Simple chart treatment

- **Normalized family:** `chart`
- **Status:** Pending approval — future family; do not implement in the pilot.
- **Source provenance:** Provided TROC specification only; no imported third-party component code.
- **Planned source:** `src/components/ui/chart.tsx`
- **Planned preview:** `src/preview/demos/chart.tsx`
- **Package export:** `@workspace/troc-design-system/components/ui/chart`
- **Exports:** ChartContainer, ChartTooltip, ChartLegend
- **Implementation:** Themed chart scaffold constrained to semantic tokens and simple treatments.
- **Dependencies:** React; recharts; chart configuration; accessible tabular/text alternative supplied by composition.
- **Required variants/states:** Line/bar-compatible simple treatment, tooltip, legend, empty/loading/error, light/dark, responsive, and non-colour-only series identification.
- **Evidence:** `docs/references/specifications/Pasted-We-are-starting-the-first-development-milestone-for-TRO_1790027534621.txt:514-528,596-612`.
- **Sequential chunk:** 7 of 7 — begins only after every prior chunk is approved and complete.

## Scope guardrail

This record specifies a reusable visual component only. It does not authorize marketplace pages, business logic, APIs, persistence, optimization, checkout, authentication, or backend work.
