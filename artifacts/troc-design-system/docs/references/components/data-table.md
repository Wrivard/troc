# Responsive data table

- **Normalized family:** `data-table`
- **Status:** **IMPLEMENTED and technically verified — final user visual approval pending.**
- **Source provenance:** Provided TROC specification only; no imported third-party component code.
- **Source:** `src/components/ui/data-table.tsx`
- **Preview:** `src/preview/demos/data-table.tsx`
- **Package export:** `@workspace/troc-design-system/components/ui/data-table`
- **Exports:** DataTable, DataTableHeader, DataTableBody, DataTableRow,
  DataTableHead, DataTableCell, InventoryTable; types: SortDirection,
  DataTableHeadProps, InventoryColumn, InventoryTableProps
- **Implementation:** Themed semantic table scaffold with a seller-inventory composition; responsive behavior may scroll or transform into cards/drawers.
- **Dependencies:** React; Skeleton; cn. Filtering, pagination, and data state
  remain caller-owned compositions.
- **Required variants/states:** Header/body/footer, sortable/selectable composition hooks, empty/loading/error, compact, inventory, horizontal-scroll or card/mobile treatment, and keyboard-accessible actions.
- **Live-region contract:** `InventoryTable` wraps its error slot in
  `role="alert"` and its empty slot in `role="status"`; callers pass content
  without nesting redundant live regions.
- **Evidence:** `docs/references/specifications/04_COMPONENT_LIBRARY_1790026725045.md:47`; `docs/references/specifications/06_RESPONSIVE_ACCESSIBILITY_1790026725046.md:17`; `docs/references/specifications/Pasted-We-are-starting-the-first-development-milestone-for-TRO_1790027534621.txt:475-477,514-528,624-632`.
- **Sequential chunk:** 7 of 7 — implemented and technically verified; final
  user visual approval pending.

## Scope guardrail

This record specifies a reusable visual component only. It does not authorize marketplace pages, business logic, APIs, persistence, optimization, checkout, authentication, or backend work.
