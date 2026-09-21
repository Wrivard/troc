# Alert and banner

- **Normalized family:** `alert`
- **Status:** Pending approval — future family; do not implement in the pilot.
- **Source provenance:** Provided TROC specification only; no imported third-party component code.
- **Planned source:** `src/components/ui/alert.tsx`
- **Planned preview:** `src/preview/demos/alert.tsx`
- **Package export:** `@workspace/troc-design-system/components/ui/alert`
- **Exports:** Alert, AlertTitle, AlertDescription
- **Implementation:** Themed semantic alert scaffold.
- **Dependencies:** React; class-variance-authority; cn.
- **Required variants/states:** Informational/neutral, success, warning, destructive/error, with/without action, dismissible composition, and non-colour status cues.
- **Evidence:** `docs/references/specifications/04_COMPONENT_LIBRARY_1790026725045.md:17,50-58`; `docs/references/specifications/06_RESPONSIVE_ACCESSIBILITY_1790026725046.md:12`; `docs/references/specifications/Pasted-We-are-starting-the-first-development-milestone-for-TRO_1790027534621.txt:497-513`.
- **Sequential chunk:** 3 of 7 — begins only after every prior chunk is approved and complete.

## Scope guardrail

This record specifies a reusable visual component only. It does not authorize marketplace pages, business logic, APIs, persistence, optimization, checkout, authentication, or backend work.
