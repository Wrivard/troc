# Loading skeleton

- **Normalized family:** `skeleton`
- **Status:** **IMPLEMENTED and typechecked — final main-agent browser validation pending.**
- **Source provenance:** Provided TROC specification only; no imported third-party component code.
- **Source:** `src/components/ui/skeleton.tsx`
- **Preview:** `src/preview/demos/skeleton.tsx`
- **Package export:** `@workspace/troc-design-system/components/ui/skeleton`
- **Exports:** Skeleton, skeletonVariants; type: SkeletonProps
- **Implementation:** Themed scaffold with semantic surface tokens.
- **Dependencies:** React; cn; reduced-motion tokens.
- **Required variants/states:** Text, avatar, product tile/row, and table placeholders; loading/busy labelling at composition level; reduced-motion behavior.
- **Evidence:** `docs/references/specifications/04_COMPONENT_LIBRARY_1790026725045.md:21,50-58`; `docs/references/specifications/06_RESPONSIVE_ACCESSIBILITY_1790026725046.md:16`; `docs/references/specifications/Pasted-We-are-starting-the-first-development-milestone-for-TRO_1790027534621.txt:497-513`.
- **Sequential chunk:** 3 of 7 — implemented and typechecked; final browser validation pending.

## Scope guardrail

This record specifies a reusable visual component only. It does not authorize marketplace pages, business logic, APIs, persistence, optimization, checkout, authentication, or backend work.
