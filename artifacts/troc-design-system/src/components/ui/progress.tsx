"use client"

import * as React from "react"
import * as ProgressPrimitive from "@radix-ui/react-progress"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "../../lib/utils"

const progressVariants = cva("troc-progress", {
  variants: {
    size: {
      default: "troc-progress--default",
      compact: "troc-progress--compact",
    },
    tone: {
      neutral: "troc-progress--neutral",
      accent: "troc-progress--accent",
      positive: "troc-progress--positive",
    },
  },
  defaultVariants: {
    size: "default",
    tone: "neutral",
  },
})

export interface ProgressProps
  extends Omit<React.ComponentPropsWithoutRef<typeof ProgressPrimitive.Root>, "value" | "max">,
    VariantProps<typeof progressVariants> {
  /** Current value; pass `null` for an indeterminate/busy bar. */
  value: number | null
  /** Upper bound of the scale. Defaults to 100. */
  max?: number
  /** Translated accessible name for the bar (required; never colour-only). */
  label: string
  /**
   * Translated human-readable value, e.g. "$1.42 / $5 minimum". Shown beside the
   * label when provided and announced via `aria-valuetext`.
   */
  valueLabel?: string
  /** Hide the visible label/value header and keep only the track. */
  hideHeader?: boolean
}

/**
 * Themed Radix Progress. Determinate when `value` is a number, indeterminate
 * when `value` is `null`. All copy is supplied by the caller; no math beyond
 * clamping to `[0, max]` and formatting the percentage width.
 */
const Progress = React.forwardRef<
  React.ElementRef<typeof ProgressPrimitive.Root>,
  ProgressProps
>(({ className, size, tone, value, max = 100, label, valueLabel, hideHeader, ...props }, ref) => {
  const indeterminate = value === null
  const safeMax = max > 0 ? max : 100
  const clamped = indeterminate ? 0 : Math.min(Math.max(value, 0), safeMax)
  const percent = indeterminate ? 0 : (clamped / safeMax) * 100

  return (
    <div className={cn(progressVariants({ size, tone }), className)}>
      {hideHeader ? null : (
        <div className="troc-progress-header">
          <span className="troc-progress-label">{label}</span>
          {valueLabel ? <span className="troc-progress-value">{valueLabel}</span> : null}
        </div>
      )}
      <ProgressPrimitive.Root
        ref={ref}
        className="troc-progress-track"
        value={indeterminate ? null : clamped}
        max={safeMax}
        aria-label={hideHeader ? label : undefined}
        aria-valuetext={valueLabel}
        data-indeterminate={indeterminate || undefined}
        {...props}
      >
        <ProgressPrimitive.Indicator
          className="troc-progress-indicator"
          style={indeterminate ? undefined : { transform: `translateX(-${100 - percent}%)` }}
        />
      </ProgressPrimitive.Root>
    </div>
  )
})
Progress.displayName = "Progress"

export { Progress, progressVariants }
