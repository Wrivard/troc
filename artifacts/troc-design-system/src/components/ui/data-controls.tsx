"use client"

import * as React from "react"
import { ArrowDownUp } from "lucide-react"

import { cn } from "../../lib/utils"
import { Button } from "./button"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "./select"

export interface FilterBarProps extends React.HTMLAttributes<HTMLDivElement> {
  /** Accessible name for the filter region, e.g. "Filters". */
  label: string
  /** Number of active filters; shows a count and enables "clear". */
  activeCount?: number
  /** Translated "Clear all" label. Omit to hide the clear control. */
  clearLabel?: string
  onClear?: () => void
  /** Disable every control while a parent request is pending. */
  disabled?: boolean
  /** Optional trailing slot, e.g. a `SortControl` or result count. */
  trailing?: React.ReactNode
}

/**
 * Responsive filter region. Compose `FilterGroup`s (or any real controls —
 * Chips, Select, Input) as children; the demo owns the actual filtering state.
 * All copy is supplied by the caller.
 */
const FilterBar = React.forwardRef<HTMLDivElement, FilterBarProps>(
  ({ className, label, activeCount = 0, clearLabel, onClear, disabled = false, trailing, children, ...props }, ref) => (
    <div
      ref={ref}
      role="group"
      aria-label={label}
      aria-busy={disabled || undefined}
      className={cn("troc-filter-bar", className)}
      {...props}
    >
      <div className="troc-filter-bar-controls">{children}</div>
      <div className="troc-filter-bar-meta">
        {activeCount > 0 && (
          <span className="troc-filter-count" aria-live="polite">{activeCount}</span>
        )}
        {clearLabel && onClear && (
          <Button
            variant="ghost"
            size="sm"
            onClick={onClear}
            disabled={disabled || activeCount === 0}
          >
            {clearLabel}
          </Button>
        )}
        {trailing}
      </div>
    </div>
  )
)
FilterBar.displayName = "FilterBar"

export interface FilterGroupProps extends React.HTMLAttributes<HTMLDivElement> {
  /** Translated group label, e.g. "Game". */
  label: string
}

/** A labelled cluster of filter controls (Chips, Select, Input …). */
const FilterGroup = React.forwardRef<HTMLDivElement, FilterGroupProps>(
  ({ className, label, children, ...props }, ref) => (
    <div ref={ref} className={cn("troc-filter-group", className)} role="group" aria-label={label} {...props}>
      <span className="troc-filter-group-label">{label}</span>
      <div className="troc-filter-group-controls">{children}</div>
    </div>
  )
)
FilterGroup.displayName = "FilterGroup"

export interface SortOption {
  value: string
  /** Translated option label. */
  label: string
}

export interface SortControlProps {
  /** Translated accessible label, e.g. "Sort by". */
  label: string
  value: string
  onValueChange: (value: string) => void
  options: SortOption[]
  disabled?: boolean
  /** Hide the visible inline label (keeps it as aria-label). */
  hideLabel?: boolean
  id?: string
  className?: string
}

/**
 * Sort chooser built on the real `Select`. State is owned by the caller so the
 * demo can reorder its local result set.
 */
const SortControl = React.forwardRef<HTMLButtonElement, SortControlProps>(
  ({ label, value, onValueChange, options, disabled = false, hideLabel = false, id, className }, ref) => {
    const selectId = id ?? React.useId()
    return (
      <div className={cn("troc-sort-control", className)}>
        {hideLabel ? null : (
          <label htmlFor={selectId} className="troc-sort-control-label">
            <ArrowDownUp aria-hidden="true" className="troc-sort-control-icon" />
            {label}
          </label>
        )}
        <Select value={value} onValueChange={onValueChange} disabled={disabled}>
          <SelectTrigger ref={ref} id={selectId} aria-label={hideLabel ? label : undefined} className="troc-sort-control-trigger">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {options.map((option) => (
              <SelectItem key={option.value} value={option.value}>{option.label}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
    )
  }
)
SortControl.displayName = "SortControl"

export { FilterBar, FilterGroup, SortControl }
