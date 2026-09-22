"use client"

import * as React from "react"
import { ResponsiveContainer, type TooltipProps } from "recharts"

import { cn } from "../../lib/utils"

/**
 * Per-series visual identity. Series are distinguished by symbol + dash pattern
 * in addition to a monochrome/red token colour, so charts never rely on colour
 * alone. `token` must be one of the semantic chart tokens.
 */
export interface ChartSeriesConfig {
  key: string
  /** Translated series label. */
  label: string
  /** CSS colour value (semantic token), e.g. "var(--color-primary)". */
  color: string
  /** Line dash style for non-colour identification. */
  dash?: "solid" | "dashed"
  /** Point symbol for legend / non-colour identification. */
  symbol?: "circle" | "square" | "triangle"
}

type ChartState = "ready" | "loading" | "empty" | "error"

export interface ChartContainerProps extends React.HTMLAttributes<HTMLDivElement> {
  /** Translated accessible description of the chart. */
  label: string
  state?: ChartState
  /** Height of the plot area in px. */
  height?: number
  /** Slot shown for loading state (e.g. a Skeleton). */
  loadingSlot?: React.ReactNode
  /** Slot shown for empty state. */
  emptySlot?: React.ReactNode
  /** Slot shown for error state. */
  errorSlot?: React.ReactNode
  /** The recharts chart element (LineChart/BarChart). Required for "ready". */
  children?: React.ReactNode
  /**
   * Accessible tabular/text alternative to the chart data. Always rendered
   * (visually hidden by default) so the data is available to everyone.
   */
  dataTable: React.ReactNode
}

/**
 * Themed responsive chart frame. Renders exactly one recharts chart as its
 * child, plus loading/empty/error slots and a required accessible data table.
 */
const ChartContainer = React.forwardRef<HTMLDivElement, ChartContainerProps>(
  ({ className, label, state = "ready", height = 260, loadingSlot, emptySlot, errorSlot, children, dataTable, ...props }, ref) => (
    <div ref={ref} className={cn("troc-chart", className)} {...props}>
      <figure className="troc-chart-figure" role="group" aria-label={label}>
        <div className="troc-chart-plot" style={{ height }}>
          {state === "loading" ? (
            <div className="troc-chart-state" role="status">{loadingSlot}</div>
          ) : state === "empty" ? (
            <div className="troc-chart-state">{emptySlot}</div>
          ) : state === "error" ? (
            <div className="troc-chart-state" role="alert">{errorSlot}</div>
          ) : (
            <ResponsiveContainer width="100%" height="100%">
              {children as React.ReactElement}
            </ResponsiveContainer>
          )}
        </div>
        <figcaption className="troc-chart-data-alt">{dataTable}</figcaption>
      </figure>
    </div>
  )
)
ChartContainer.displayName = "ChartContainer"

export interface ChartTooltipProps extends TooltipProps<number, string> {
  /** Formats each value for display, e.g. CAD. */
  formatValue?: (value: number) => string
  /** Maps a series dataKey to its translated label. */
  labelForKey?: (key: string) => string
}

/** Themed tooltip content. Pass to a recharts `<Tooltip content={...} />`. */
function ChartTooltip({ active, payload, label, formatValue, labelForKey }: ChartTooltipProps) {
  if (!active || !payload || payload.length === 0) return null
  return (
    <div className="troc-chart-tooltip" role="presentation">
      {label != null && <p className="troc-chart-tooltip-title">{String(label)}</p>}
      <ul className="troc-chart-tooltip-list">
        {payload.map((entry) => {
          const key = String(entry.dataKey ?? entry.name ?? "")
          const value = typeof entry.value === "number" ? entry.value : Number(entry.value)
          return (
            <li key={key} className="troc-chart-tooltip-row">
              <span className="troc-chart-swatch" style={{ background: entry.color }} aria-hidden="true" />
              <span className="troc-chart-tooltip-label">{labelForKey ? labelForKey(key) : (entry.name ?? key)}</span>
              <span className="troc-chart-tooltip-value">{formatValue ? formatValue(value) : String(entry.value)}</span>
            </li>
          )
        })}
      </ul>
    </div>
  )
}
ChartTooltip.displayName = "ChartTooltip"

export interface ChartLegendProps extends React.HTMLAttributes<HTMLUListElement> {
  series: ChartSeriesConfig[]
}

/**
 * Standalone legend that shows each series' colour, symbol, and dash pattern so
 * series are identifiable without relying on colour.
 */
const ChartLegend = React.forwardRef<HTMLUListElement, ChartLegendProps>(
  ({ className, series, ...props }, ref) => (
    <ul ref={ref} className={cn("troc-chart-legend", className)} {...props}>
      {series.map((entry) => (
        <li key={entry.key} className="troc-chart-legend-item">
          <span
            className={cn(
              "troc-chart-legend-marker",
              `troc-chart-legend-marker--${entry.symbol ?? "circle"}`,
              entry.dash === "dashed" && "troc-chart-legend-marker--dashed"
            )}
            style={{ color: entry.color }}
            aria-hidden="true"
          />
          <span>{entry.label}</span>
        </li>
      ))}
    </ul>
  )
)
ChartLegend.displayName = "ChartLegend"

export { ChartContainer, ChartTooltip, ChartLegend }
