# Responsive data table

- **Normalized family:** `data-table`
- **Status:** Pending approval — future family; do not implement in the pilot.
- **Source provenance:** Provided TROC specification only; no imported third-party component code.
- **Planned source:** `src/components/ui/data-table.tsx`
- **Planned preview:** `src/preview/demos/data-table.tsx`
- **Package export:** `@workspace/troc-design-system/components/ui/data-table`
- **Exports:** DataTable, DataTableHeader, DataTableBody, DataTableRow, DataTableHead, DataTableCell, InventoryTable
- **Implementation:** Themed semantic table scaffold with a seller-inventory composition; responsive behavior may scroll or transform into cards/drawers.
- **Dependencies:** React; DataControls; Pagination; Skeleton; cn.
- **Required variants/states:** Header/body/footer, sortable/selectable composition hooks, empty/loading/error, compact, inventory, horizontal-scroll or card/mobile treatment, and keyboard-accessible actions.
- **Evidence:** `docs/references/specifications/04_COMPONENT_LIBRARY_1790026725045.md:47`; `docs/references/specifications/06_RESPONSIVE_ACCESSIBILITY_1790026725046.md:17`; `docs/references/specifications/Pasted-We-are-starting-the-first-development-milestone-for-TRO_1790027534621.txt:475-477,514-528,624-632`.
- **Sequential chunk:** 7 of 7 — begins only after every prior chunk is approved and complete.

## Scope guardrail

This record specifies a reusable visual component only. It does not authorize marketplace pages, business logic, APIs, persistence, optimization, checkout, authentication, or backend work.
