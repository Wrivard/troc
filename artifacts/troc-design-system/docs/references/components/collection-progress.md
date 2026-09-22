# Collection progress card

- **Normalized family:** `collection-progress`
- **Status:** **IMPLEMENTED and typechecked — final main-agent browser validation pending.**
- **Source provenance:** Provided TROC specification only; no imported third-party component code.
- **Source:** `src/components/ui/collection-progress.tsx`
- **Preview:** `src/preview/demos/collection-progress.tsx`
- **Package export:** `@workspace/troc-design-system/components/ui/collection-progress`
- **Exports:** CollectionProgressCard; type: CollectionProgressCardProps
- **Implementation:** New marketplace composition built on Progress and product metadata primitives.
- **Dependencies:** Progress; CardImage optional; CardMetadata; translated labels.
- **Required variants/states:** Current/total count, percentage, complete, empty, loading, compact/full, and mobile states; visual only with no collection backend.
- **Evidence:** `docs/references/specifications/04_COMPONENT_LIBRARY_1790026725045.md:45`; `docs/references/specifications/05_STYLE_GUIDE_PAGE_1790026725045.md:18`; `docs/references/specifications/Pasted-We-are-starting-the-first-development-milestone-for-TRO_1790027534621.txt:655-680`.
- **Sequential chunk:** 5 of 7 — implemented after Progress; typechecked, with
  final browser validation pending.

## Scope guardrail

This record specifies a reusable visual component only. It does not authorize marketplace pages, business logic, APIs, persistence, optimization, checkout, authentication, or backend work.
