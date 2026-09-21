# Breadcrumbs

- **Normalized family:** `breadcrumbs`
- **Status:** Pending approval — future family; do not implement in the pilot.
- **Source provenance:** Provided TROC specification only; no imported third-party component code.
- **Planned source:** `src/components/ui/breadcrumbs.tsx`
- **Planned preview:** `src/preview/demos/breadcrumbs.tsx`
- **Package export:** `@workspace/troc-design-system/components/ui/breadcrumbs`
- **Exports:** Breadcrumb, BreadcrumbList, BreadcrumbItem, BreadcrumbLink, BreadcrumbPage, BreadcrumbSeparator, BreadcrumbEllipsis
- **Implementation:** Themed semantic navigation scaffold.
- **Dependencies:** React; lucide-react; cn.
- **Required variants/states:** Link, current-page, separator, ellipsis, focus-visible, and narrow-screen wrapping states.
- **Evidence:** `docs/references/specifications/04_COMPONENT_LIBRARY_1790026725045.md:20,50-58`; `docs/references/specifications/06_RESPONSIVE_ACCESSIBILITY_1790026725046.md:8-15`.
- **Sequential chunk:** 2 of 7 — begins only after every prior chunk is approved and complete.

## Scope guardrail

This record specifies a reusable visual component only. It does not authorize marketplace pages, business logic, APIs, persistence, optimization, checkout, authentication, or backend work.
