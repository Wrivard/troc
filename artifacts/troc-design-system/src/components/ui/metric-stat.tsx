"use client"

import * as React from "react"
import { ArrowDownRight, ArrowUpRight, Minus } from "lucide-react"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "../../lib/utils"

export type MetricTrend = "up" | "down" | "neutral"

const metricVariants = cva("troc-metric", {
  variants: {
    density: {
      default: "troc-metric--default",
      compact: "troc-metric--compact",
    },
  },
  defaultVariants: {
    density: "default",
  },
})

export interface MetricStatProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof metricVariants> {
  /** Translated metric label, e.g. "Cards listed". */
  label: string
  /** Preformatted, translated value; use "—" for unavailable. */
  value: React.ReactNode
  /** Optional supporting metadata under the value. */
  meta?: React.ReactNode
  /** Leading icon supplied by the caller. */
  icon?: React.ReactNode
  /** Change direction; conveyed by icon + text, never colour alone. */
  trend?: MetricTrend
  /** Translated, preformatted change text, e.g. "+12% vs last week". */
  changeLabel?: string
  /** Render a skeleton placeholder. */
  loading?: boolean
}

const TREND_ICON: Record<MetricTrend, React.ReactNode> = {
  up: <ArrowUpRight aria-hidden="true" />,
  down: <ArrowDownRight aria-hidden="true" />,
  neutral: <Minus aria-hidden="true" />,
}

/**
 * A single labelled metric with an optional trend cue. Values are preformatted
 * by the caller; this is a typographic composition, not a data source.
 */
const MetricStat = React.forwardRef<HTMLDivElement, MetricStatProps>(
  ({ className, density, label, value, meta, icon, trend, changeLabel, loading = false, ...props }, ref) => {
    if (loading) {
      return (
        <div ref={ref} className={cn(metricVariants({ density }), "troc-metric--loading", className)} aria-busy="true" {...props}>
          <span className="troc-metric-skeleton troc-metric-skeleton--label" aria-hidden="true" />
          <span className="troc-metric-skeleton troc-metric-skeleton--value" aria-hidden="true" />
        </div>
      )
    }
    return (
      <div ref={ref} className={cn(metricVariants({ density }), className)} {...props}>
        <div className="troc-metric-top">
          {icon ? <span className="troc-metric-icon" aria-hidden="true">{icon}</span> : null}
          <span className="troc-metric-label">{label}</span>
        </div>
        <span className="troc-metric-value">{value}</span>
        {(changeLabel || meta) && (
          <div className="troc-metric-footer">
            {changeLabel && trend && (
              <span className={cn("troc-metric-change", `troc-metric-change--${trend}`)}>
                {TREND_ICON[trend]}
                <span>{changeLabel}</span>
              </span>
            )}
            {meta ? <span className="troc-metric-meta">{meta}</span> : null}
          </div>
        )}
      </div>
    )
  }
)
MetricStat.displayName = "MetricStat"

export interface KpiBlockProps extends React.HTMLAttributes<HTMLDivElement> {
  /** Optional accessible name for the KPI region. */
  label?: string
  /** Dense grid packs more metrics per row. */
  dense?: boolean
}

/** Responsive grid of `MetricStat`s. */
const KpiBlock = React.forwardRef<HTMLDivElement, KpiBlockProps>(
  ({ className, label, dense = false, ...props }, ref) => (
    <div
      ref={ref}
      role="group"
      aria-label={label}
      className={cn("troc-kpi", dense && "troc-kpi--dense", className)}
      {...props}
    />
  )
)
KpiBlock.displayName = "KpiBlock"

export { MetricStat, KpiBlock, metricVariants }
