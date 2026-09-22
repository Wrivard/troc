"use client"

import * as React from "react"
import { ArrowDown, ArrowUp, ChevronsUpDown } from "lucide-react"

import { cn } from "../../lib/utils"
import { Skeleton } from "./skeleton"

/** Scroll region wrapper so wide tables never break the layout on mobile. */
const DataTable = React.forwardRef<
  HTMLTableElement,
  React.TableHTMLAttributes<HTMLTableElement> & { scrollLabel?: string }
>(({ className, scrollLabel, ...props }, ref) => (
  <div className="troc-table-scroll" role="region" aria-label={scrollLabel} tabIndex={scrollLabel ? 0 : undefined}>
    <table ref={ref} className={cn("troc-table", className)} {...props} />
  </div>
))
DataTable.displayName = "DataTable"

const DataTableHeader = React.forwardRef<
  HTMLTableSectionElement,
  React.HTMLAttributes<HTMLTableSectionElement>
>(({ className, ...props }, ref) => (
  <thead ref={ref} className={cn("troc-table-header", className)} {...props} />
))
DataTableHeader.displayName = "DataTableHeader"

const DataTableBody = React.forwardRef<
  HTMLTableSectionElement,
  React.HTMLAttributes<HTMLTableSectionElement>
>(({ className, ...props }, ref) => (
  <tbody ref={ref} className={cn("troc-table-body", className)} {...props} />
))
DataTableBody.displayName = "DataTableBody"

const DataTableRow = React.forwardRef<
  HTMLTableRowElement,
  React.HTMLAttributes<HTMLTableRowElement> & { selected?: boolean }
>(({ className, selected, ...props }, ref) => (
  <tr
    ref={ref}
    data-selected={selected || undefined}
    aria-selected={selected}
    className={cn("troc-table-row", className)}
    {...props}
  />
))
DataTableRow.displayName = "DataTableRow"

export type SortDirection = "asc" | "desc" | null

export interface DataTableHeadProps
  extends React.ThHTMLAttributes<HTMLTableCellElement> {
  /** Right-align numeric columns. */
  numeric?: boolean
  /** Sortable header composition. */
  sortable?: boolean
  sortDirection?: SortDirection
  /** Translated label announced for the sort toggle. */
  sortLabel?: string
  onSort?: () => void
}

const DataTableHead = React.forwardRef<HTMLTableCellElement, DataTableHeadProps>(
  ({ className, numeric, sortable, sortDirection = null, sortLabel, onSort, children, ...props }, ref) => {
    const ariaSort = !sortable ? undefined : sortDirection === "asc" ? "ascending" : sortDirection === "desc" ? "descending" : "none"
    return (
      <th
        ref={ref}
        scope="col"
        aria-sort={ariaSort}
        data-numeric={numeric || undefined}
        className={cn("troc-table-head", className)}
        {...props}
      >
        {sortable ? (
          <button type="button" className="troc-table-sort" onClick={onSort} aria-label={sortLabel}>
            <span>{children}</span>
            {sortDirection === "asc" ? <ArrowUp aria-hidden="true" />
              : sortDirection === "desc" ? <ArrowDown aria-hidden="true" />
              : <ChevronsUpDown aria-hidden="true" className="troc-table-sort-idle" />}
          </button>
        ) : (
          children
        )}
      </th>
    )
  }
)
DataTableHead.displayName = "DataTableHead"

const DataTableCell = React.forwardRef<
  HTMLTableCellElement,
  React.TdHTMLAttributes<HTMLTableCellElement> & { numeric?: boolean }
>(({ className, numeric, ...props }, ref) => (
  <td ref={ref} data-numeric={numeric || undefined} className={cn("troc-table-cell", className)} {...props} />
))
DataTableCell.displayName = "DataTableCell"

/* -------------------------------------------------------------------------- */
/* Inventory composition                                                      */
/* -------------------------------------------------------------------------- */

export interface InventoryColumn<Row> {
  id: string
  /** Translated header label. */
  header: string
  numeric?: boolean
  sortable?: boolean
  /** Cell renderer; receives the row. */
  cell: (row: Row) => React.ReactNode
}

export interface InventoryTableProps<Row> {
  /** Translated caption / accessible name for the table. */
  caption: string
  /** Translated accessible name for the horizontal scroll region. */
  scrollLabel: string
  columns: InventoryColumn<Row>[]
  rows: Row[]
  getRowId: (row: Row) => string
  /** Sorting (owned by caller). */
  sortColumn?: string | null
  sortDirection?: SortDirection
  onSort?: (columnId: string) => void
  sortLabel?: (columnHeader: string) => string
  /** Selection (owned by caller). */
  selectable?: boolean
  selectedIds?: string[]
  onToggleRow?: (id: string) => void
  onToggleAll?: () => void
  selectRowLabel?: (row: Row) => string
  selectAllLabel?: string
  /** Optional keyboard/click row action rendered in a trailing cell. */
  rowAction?: (row: Row) => React.ReactNode
  rowActionHeader?: string
  /** States. */
  loading?: boolean
  loadingRows?: number
  error?: React.ReactNode
  empty?: React.ReactNode
}

/**
 * Seller-inventory composition on the semantic table primitives. Sorting and
 * selection state are owned by the caller; this component only renders and
 * announces them. No business logic or persistence.
 */
function InventoryTable<Row>({
  caption,
  scrollLabel,
  columns,
  rows,
  getRowId,
  sortColumn = null,
  sortDirection = null,
  onSort,
  sortLabel,
  selectable = false,
  selectedIds = [],
  onToggleRow,
  onToggleAll,
  selectRowLabel,
  selectAllLabel,
  rowAction,
  rowActionHeader,
  loading = false,
  loadingRows = 4,
  error,
  empty,
}: InventoryTableProps<Row>) {
  const totalCols = columns.length + (selectable ? 1 : 0) + (rowAction ? 1 : 0)
  const allSelected = rows.length > 0 && rows.every((row) => selectedIds.includes(getRowId(row)))

  return (
    <DataTable scrollLabel={scrollLabel}>
      <caption className="troc-table-caption">{caption}</caption>
      <DataTableHeader>
        <DataTableRow>
          {selectable && (
            <DataTableHead className="troc-table-select-col">
              <input
                type="checkbox"
                className="troc-table-checkbox"
                checked={allSelected}
                onChange={onToggleAll}
                aria-label={selectAllLabel}
                disabled={loading || rows.length === 0}
              />
            </DataTableHead>
          )}
          {columns.map((column) => (
            <DataTableHead
              key={column.id}
              numeric={column.numeric}
              sortable={column.sortable}
              sortDirection={sortColumn === column.id ? sortDirection : null}
              sortLabel={sortLabel?.(column.header)}
              onSort={() => onSort?.(column.id)}
            >
              {column.header}
            </DataTableHead>
          ))}
          {rowAction && <DataTableHead className="troc-table-action-col">{rowActionHeader}</DataTableHead>}
        </DataTableRow>
      </DataTableHeader>
      <DataTableBody>
        {loading ? (
          Array.from({ length: loadingRows }).map((_, index) => (
            <DataTableRow key={`skeleton-${index}`}>
              {selectable && <DataTableCell><Skeleton shape="text" /></DataTableCell>}
              {columns.map((column) => (
                <DataTableCell key={column.id} numeric={column.numeric}><Skeleton shape="text" /></DataTableCell>
              ))}
              {rowAction && <DataTableCell><Skeleton shape="text" /></DataTableCell>}
            </DataTableRow>
          ))
        ) : error ? (
          <tr><td colSpan={totalCols} className="troc-table-state"><div role="alert">{error}</div></td></tr>
        ) : rows.length === 0 ? (
          <tr><td colSpan={totalCols} className="troc-table-state"><div role="status">{empty}</div></td></tr>
        ) : (
          rows.map((row) => {
            const id = getRowId(row)
            const selected = selectedIds.includes(id)
            return (
              <DataTableRow key={id} selected={selected}>
                {selectable && (
                  <DataTableCell className="troc-table-select-col">
                    <input
                      type="checkbox"
                      className="troc-table-checkbox"
                      checked={selected}
                      onChange={() => onToggleRow?.(id)}
                      aria-label={selectRowLabel?.(row)}
                    />
                  </DataTableCell>
                )}
                {columns.map((column) => (
                  <DataTableCell key={column.id} numeric={column.numeric}>{column.cell(row)}</DataTableCell>
                ))}
                {rowAction && <DataTableCell className="troc-table-action-col">{rowAction(row)}</DataTableCell>}
              </DataTableRow>
            )
          })
        )}
      </DataTableBody>
    </DataTable>
  )
}

export {
  DataTable,
  DataTableHeader,
  DataTableBody,
  DataTableRow,
  DataTableHead,
  DataTableCell,
  InventoryTable,
}
