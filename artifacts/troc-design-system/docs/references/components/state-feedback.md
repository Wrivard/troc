# Empty, error, and success states

- **Normalized family:** `state-feedback`
- **Status:** **IMPLEMENTED and typechecked — final main-agent browser validation pending.**
- **Source provenance:** Provided TROC specification only; no imported third-party component code.
- **Source:** `src/components/ui/state-feedback.tsx`
- **Preview:** `src/preview/demos/state-feedback.tsx`
- **Package export:** `@workspace/troc-design-system/components/ui/state-feedback`
- **Exports:** StateFeedback, EmptyState, ErrorState, SuccessState,
  stateFeedbackVariants; types: StateFeedbackAction, StateFeedbackProps
- **Implementation:** New semantic composition using approved icons, copy slots, and Button actions.
- **Dependencies:** React; lucide-react; Button; Alert where compact; translation keys.
- **Required variants/states:** Empty, error, and success variants; optional title, description, primary/secondary action, compact/full formats, and no decorative illustration dependency.
- **Evidence:** `docs/references/specifications/04_COMPONENT_LIBRARY_1790026725045.md:22-23`; `docs/references/specifications/07_COPY_I18N_1790026725046.md:3-22`; `docs/references/specifications/Pasted-We-are-starting-the-first-development-milestone-for-TRO_1790027534621.txt:497-513,570-593`.
- **Sequential chunk:** 3 of 7 — implemented and typechecked; final browser validation pending.

## Scope guardrail

This record specifies a reusable visual component only. It does not authorize marketplace pages, business logic, APIs, persistence, optimization, checkout, authentication, or backend work.
