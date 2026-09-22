# Metric and KPI

- **Normalized family:** `metric-stat`
- **Status:** **IMPLEMENTED — final main-agent typecheck and browser validation pending.**
- **Source provenance:** Provided TROC specification only; no imported third-party component code.
- **Source:** `src/components/ui/metric-stat.tsx`
- **Preview:** `src/preview/demos/metric-stat.tsx`
- **Package export:** `@workspace/troc-design-system/components/ui/metric-stat`
- **Exports:** MetricStat, KpiBlock, metricVariants; types: MetricTrend,
  MetricStatProps, KpiBlockProps
- **Implementation:** New typographic data composition.
- **Dependencies:** React; class-variance-authority; lucide-react; cn; semantic
  number/type tokens.
- **Required variants/states:** Label, value, supporting metadata, positive/negative/neutral change with text/icon cue, loading, compact, and dense-grid states.
- **Evidence:** `docs/references/specifications/04_COMPONENT_LIBRARY_1790026725045.md:48`; `docs/references/specifications/Pasted-We-are-starting-the-first-development-milestone-for-TRO_1790027534621.txt:514-528`.
- **Sequential chunk:** 7 of 7 — implemented; typecheck and final browser
  validation pending.

## Scope guardrail

This record specifies a reusable visual component only. It does not authorize marketplace pages, business logic, APIs, persistence, optimization, checkout, authentication, or backend work.
