# Simple chart treatment

- **Normalized family:** `chart`
- **Status:** **IMPLEMENTED — final main-agent typecheck and browser validation pending.**
- **Source provenance:** Provided TROC specification only; no imported third-party component code.
- **Source:** `src/components/ui/chart.tsx`
- **Preview:** `src/preview/demos/chart.tsx`
- **Package export:** `@workspace/troc-design-system/components/ui/chart`
- **Exports:** ChartContainer, ChartTooltip, ChartLegend; types:
  ChartSeriesConfig, ChartContainerProps, ChartTooltipProps, ChartLegendProps
- **Implementation:** Themed chart scaffold constrained to semantic tokens and simple treatments.
- **Dependencies:** React; recharts; chart configuration; accessible tabular/text alternative supplied by composition.
- **Required variants/states:** Line/bar-compatible simple treatment, tooltip, legend, empty/loading/error, light/dark, responsive, and non-colour-only series identification.
- **Evidence:** `docs/references/specifications/Pasted-We-are-starting-the-first-development-milestone-for-TRO_1790027534621.txt:514-528,596-612`.
- **Sequential chunk:** 7 of 7 — implemented; typecheck and final browser
  validation pending.

## Scope guardrail

This record specifies a reusable visual component only. It does not authorize marketplace pages, business logic, APIs, persistence, optimization, checkout, authentication, or backend work.
