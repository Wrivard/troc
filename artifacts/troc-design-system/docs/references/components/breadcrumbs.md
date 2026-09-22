# Breadcrumbs

- **Normalized family:** `breadcrumbs`
- **Status:** **IMPLEMENTED and typechecked — final main-agent browser validation pending.**
- **Source provenance:** Provided TROC specification only; no imported third-party component code.
- **Source:** `src/components/ui/breadcrumbs.tsx`
- **Preview:** `src/preview/demos/breadcrumbs.tsx`
- **Package export:** `@workspace/troc-design-system/components/ui/breadcrumbs`
- **Exports:** Breadcrumb, BreadcrumbList, BreadcrumbItem, BreadcrumbLink,
  BreadcrumbPage, BreadcrumbSeparator, BreadcrumbEllipsis; types:
  BreadcrumbProps, BreadcrumbEllipsisProps
- **Implementation:** Themed semantic navigation scaffold.
- **Dependencies:** React; lucide-react; cn.
- **Required variants/states:** Link, current-page, separator, ellipsis, focus-visible, and narrow-screen wrapping states.
- **Evidence:** `docs/references/specifications/04_COMPONENT_LIBRARY_1790026725045.md:20,50-58`; `docs/references/specifications/06_RESPONSIVE_ACCESSIBILITY_1790026725046.md:8-15`.
- **Sequential chunk:** 2 of 7 — implemented and typechecked; final browser validation pending.

## Scope guardrail

This record specifies a reusable visual component only. It does not authorize marketplace pages, business logic, APIs, persistence, optimization, checkout, authentication, or backend work.
