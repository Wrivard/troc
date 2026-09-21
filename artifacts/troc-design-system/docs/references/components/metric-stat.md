# Metric and KPI

- **Normalized family:** `metric-stat`
- **Status:** Pending approval — future family; do not implement in the pilot.
- **Source provenance:** Provided TROC specification only; no imported third-party component code.
- **Planned source:** `src/components/ui/metric-stat.tsx`
- **Planned preview:** `src/preview/demos/metric-stat.tsx`
- **Package export:** `@workspace/troc-design-system/components/ui/metric-stat`
- **Exports:** MetricStat, KpiBlock
- **Implementation:** New typographic data composition.
- **Dependencies:** Badge/Status optional; semantic number/type tokens.
- **Required variants/states:** Label, value, supporting metadata, positive/negative/neutral change with text/icon cue, loading, compact, and dense-grid states.
- **Evidence:** `docs/references/specifications/04_COMPONENT_LIBRARY_1790026725045.md:48`; `docs/references/specifications/Pasted-We-are-starting-the-first-development-milestone-for-TRO_1790027534621.txt:514-528`.
- **Sequential chunk:** 7 of 7 — begins only after every prior chunk is approved and complete.

## Scope guardrail

This record specifies a reusable visual component only. It does not authorize marketplace pages, business logic, APIs, persistence, optimization, checkout, authentication, or backend work.
