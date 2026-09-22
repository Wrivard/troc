"use client"

import * as React from "react"
import { CheckCircle2 } from "lucide-react"

import { cn } from "../../lib/utils"
import { Progress } from "./progress"
import { Skeleton } from "./skeleton"

/**
 * Collection progress card. Summarises how complete a set is: current/total
 * count, percentage, and complete/empty/loading states in compact and full
 * sizes. Built on `Progress`; optionally shows a set thumbnail (image URL from
 * the caller). Visual only — no collection is stored or fetched. All copy is
 * translated by the caller.
 */
export interface CollectionProgressCardProps
  extends Omit<React.HTMLAttributes<HTMLElement>, "title"> {
  /** Translated set/collection title. */
  title: React.ReactNode
  /** Translated subtitle, e.g. "Master set". */
  subtitle?: React.ReactNode
  /** Cards owned. */
  current: number
  /** Total cards in the set. */
  total: number
  /** Translated accessible name for the progress bar. */
  progressLabel: string
  /**
   * Translated human-readable value, e.g. "42 of 165 cards". Shown beside the
   * bar and announced via aria-valuetext.
   */
  valueLabel: string
  /** Translated empty-state message shown when `current` is 0. */
  emptyLabel?: string
  /** Translated "Set complete" label shown when the set is complete. */
  completeLabel?: string
  /** Optional set thumbnail slot (e.g. a CardImage). */
  thumbnail?: React.ReactNode
  /** Compact size for dense placements. */
  compact?: boolean
  /** Loading skeleton state. */
  loading?: boolean
  /** Translated accessible label for the loading region. */
  loadingLabel?: string
}

const CollectionProgressCard = React.forwardRef<HTMLElement, CollectionProgressCardProps>(
  (
    { className, title, subtitle, current, total, progressLabel, valueLabel, emptyLabel, completeLabel, thumbnail, compact = false, loading = false, loadingLabel, ...props },
    ref
  ) => {
    if (loading) {
      return (
        <section
          ref={ref as React.Ref<HTMLElement>}
          className={cn("troc-collection", compact && "troc-collection--compact", className)}
          aria-busy="true"
          aria-label={loadingLabel}
          {...props}
        >
          <div className="troc-collection-loading">
            <Skeleton shape="text" style={{ width: "60%" }} />
            <Skeleton shape="text" style={{ width: "40%" }} />
            <Skeleton shape="row" />
          </div>
        </section>
      )
    }

    const safeTotal = total > 0 ? total : 0
    const clamped = Math.min(Math.max(current, 0), safeTotal || current)
    const percent = safeTotal > 0 ? Math.round((clamped / safeTotal) * 100) : 0
    const isEmpty = clamped <= 0
    const isComplete = safeTotal > 0 && clamped >= safeTotal
    const tone = isComplete ? "positive" : "accent"

    return (
      <section
        ref={ref as React.Ref<HTMLElement>}
        className={cn("troc-collection", compact && "troc-collection--compact", className)}
        {...props}
      >
        <div className="troc-collection-head">
          {thumbnail ? <div className="troc-collection-thumb">{thumbnail}</div> : null}
          <div className="troc-collection-heading">
            <h3 className="troc-collection-title">{title}</h3>
            {subtitle ? <span className="troc-collection-subtitle">{subtitle}</span> : null}
          </div>
          <span className="troc-collection-percent" data-complete={isComplete || undefined}>
            {percent}%
          </span>
        </div>

        <div className="troc-collection-stats">
          <span className="troc-collection-count">{clamped}</span>
          <span className="troc-collection-total">/ {safeTotal}</span>
        </div>

        <Progress
          value={clamped}
          max={safeTotal || 100}
          tone={tone}
          size={compact ? "compact" : "default"}
          label={progressLabel}
          valueLabel={valueLabel}
          hideHeader
        />

        {isComplete && completeLabel ? (
          <span className="troc-collection-complete">
            <CheckCircle2 aria-hidden="true" />
            {completeLabel}
          </span>
        ) : isEmpty && emptyLabel ? (
          <p className="troc-collection-empty">{emptyLabel}</p>
        ) : null}
      </section>
    )
  }
)
CollectionProgressCard.displayName = "CollectionProgressCard"

export { CollectionProgressCard }
