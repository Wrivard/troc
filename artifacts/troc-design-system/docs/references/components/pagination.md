# Pagination

- **Normalized family:** `pagination`
- **Status:** **IMPLEMENTED and typechecked — final main-agent browser validation pending.**
- **Source provenance:** Provided TROC specification only; no imported third-party component code.
- **Source:** `src/components/ui/pagination.tsx`
- **Preview:** `src/preview/demos/pagination.tsx`
- **Package export:** `@workspace/troc-design-system/components/ui/pagination`
- **Exports:** Pagination, PaginationContent, PaginationItem, PaginationLink,
  PaginationPrevious, PaginationNext, PaginationEllipsis; types:
  PaginationProps, PaginationEllipsisProps
- **Implementation:** Themed semantic navigation scaffold composed with Button styles.
- **Dependencies:** React; Button/buttonVariants; lucide-react; cn.
- **Required variants/states:** Current page, previous/next, ellipsis, hover, focus-visible, disabled boundaries, compact mobile, and accessible page labels.
- **Evidence:** `docs/references/specifications/04_COMPONENT_LIBRARY_1790026725045.md:19,50-58`; `docs/references/specifications/Pasted-We-are-starting-the-first-development-milestone-for-TRO_1790027534621.txt:518-528`.
- **Sequential chunk:** 4 of 7 — implemented and typechecked; final browser validation pending.

## Scope guardrail

This record specifies a reusable visual component only. It does not authorize marketplace pages, business logic, APIs, persistence, optimization, checkout, authentication, or backend work.
