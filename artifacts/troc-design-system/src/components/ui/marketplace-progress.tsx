"use client"

import * as React from "react"

import { cn } from "../../lib/utils"
import { Progress } from "./progress"
import { formatCad, type PriceLocale } from "./price"

interface BaseProgressProps
  extends Omit<React.HTMLAttributes<HTMLDivElement>, "children"> {
  /** Translated accessible name for the bar (required; never colour-only). */
  label: string
  /** Locale used for CAD/number formatting. */
  locale?: PriceLocale
  /** Compact tightens the track for dense rows. */
  size?: "compact" | "default"
  /** Render an "unavailable" state (e.g. the seller does not offer this). */
  unavailable?: boolean
  /** Translated text shown for the unavailable state. */
  unavailableLabel?: string
}

function Remaining({ text, complete }: { text: string; complete: boolean }) {
  return (
    <p className={cn("troc-market-progress-help", complete && "troc-market-progress-help--complete")}>
      {text}
    </p>
  )
}

export interface SellerMinimumProgressProps extends BaseProgressProps {
  /** Current cart subtotal from this seller, in CAD. */
  current: number
  /** Minimum order amount required, in CAD. */
  minimum: number
  /**
   * Translated helper describing what to add, e.g.
   * "Add $3.58 more from this seller". The caller formats the amount so copy
   * stays natural per locale. When omitted, a formatted remaining amount is used.
   */
  remainingLabel?: (remaining: number, remainingText: string) => string
  /** Translated helper shown once the minimum is reached. */
  reachedLabel: string
  /**
   * Optional override for the value text (e.g. "$1.42 / $5 minimum"). When
   * omitted a "current / minimum" CAD string is generated.
   */
  valueLabel?: (currentText: string, minimumText: string) => string
}

/**
 * Seller minimum-order progress. Shows "$1.42 / $5 minimum" style value text
 * and a remaining-amount helper. Uses the shared Progress primitive; adds no
 * new progress-bar of its own.
 */
const SellerMinimumProgress = React.forwardRef<HTMLDivElement, SellerMinimumProgressProps>(
  ({ className, label, locale = "en", size = "default", unavailable = false, unavailableLabel = "—", current, minimum, remainingLabel, reachedLabel, valueLabel, ...props }, ref) => {
    if (unavailable) {
      return (
        <div ref={ref} className={cn("troc-market-progress", className)} {...props}>
          <Progress value={null} max={minimum} label={label} valueLabel={unavailableLabel} size={size} tone="neutral" hideHeader={false} />
        </div>
      )
    }
    const remaining = Math.max(minimum - current, 0)
    const complete = remaining <= 0
    const currentText = formatCad(current, locale)
    const minimumText = formatCad(minimum, locale)
    const valueText = valueLabel ? valueLabel(currentText, minimumText) : `${currentText} / ${minimumText}`
    const remainingText = formatCad(remaining, locale)
    const help = complete
      ? reachedLabel
      : remainingLabel
        ? remainingLabel(remaining, remainingText)
        : remainingText
    return (
      <div ref={ref} className={cn("troc-market-progress", className)} {...props}>
        <Progress
          value={current}
          max={minimum}
          label={label}
          valueLabel={valueText}
          size={size}
          tone={complete ? "positive" : "accent"}
        />
        <Remaining text={help} complete={complete} />
      </div>
    )
  },
)
SellerMinimumProgress.displayName = "SellerMinimumProgress"

export interface FreeShippingProgressProps extends BaseProgressProps {
  /** Current qualifying subtotal, in CAD. */
  current: number
  /** Free-shipping threshold, in CAD. */
  threshold: number
  remainingLabel?: (remaining: number, remainingText: string) => string
  reachedLabel: string
}

/**
 * Free-shipping progress toward a CAD threshold. Distinct from the minimum and
 * promotion examples so free shipping is always demonstrable.
 */
const FreeShippingProgress = React.forwardRef<HTMLDivElement, FreeShippingProgressProps>(
  ({ className, label, locale = "en", size = "default", unavailable = false, unavailableLabel = "—", current, threshold, remainingLabel, reachedLabel, ...props }, ref) => {
    if (unavailable) {
      return (
        <div ref={ref} className={cn("troc-market-progress", className)} {...props}>
          <Progress value={null} max={threshold} label={label} valueLabel={unavailableLabel} size={size} tone="neutral" />
        </div>
      )
    }
    const remaining = Math.max(threshold - current, 0)
    const complete = remaining <= 0
    const valueLabel = `${formatCad(current, locale)} / ${formatCad(threshold, locale)}`
    const remainingText = formatCad(remaining, locale)
    const help = complete
      ? reachedLabel
      : remainingLabel
        ? remainingLabel(remaining, remainingText)
        : remainingText
    return (
      <div ref={ref} className={cn("troc-market-progress", className)} {...props}>
        <Progress
          value={current}
          max={threshold}
          label={label}
          valueLabel={valueLabel}
          size={size}
          tone={complete ? "positive" : "accent"}
        />
        <Remaining text={help} complete={complete} />
      </div>
    )
  },
)
FreeShippingProgress.displayName = "FreeShippingProgress"

export interface PromotionProgressProps extends BaseProgressProps {
  /** Current count toward the promotion (e.g. cards in cart). */
  current: number
  /** Target count that unlocks the promotion. */
  target: number
  /** Translated unit noun formatter, e.g. count → "2 / 5 cards". */
  valueLabel?: (current: number, target: number) => string
  /**
   * Translated helper, e.g. "Add 3 more cards to unlock 10% off". Caller formats
   * the remaining count so copy stays natural per locale.
   */
  remainingLabel?: (remaining: number) => string
  /** Translated helper shown once the promotion unlocks. */
  reachedLabel: string
}

/**
 * Promotion progress by count (not amount), e.g. "Add 3 more cards to unlock
 * 10% off". Built on the shared Progress primitive.
 */
const PromotionProgress = React.forwardRef<HTMLDivElement, PromotionProgressProps>(
  ({ className, label, size = "default", unavailable = false, unavailableLabel = "—", current, target, valueLabel, remainingLabel, reachedLabel, ...props }, ref) => {
    if (unavailable) {
      return (
        <div ref={ref} className={cn("troc-market-progress", className)} {...props}>
          <Progress value={null} max={target} label={label} valueLabel={unavailableLabel} size={size} tone="neutral" />
        </div>
      )
    }
    const remaining = Math.max(target - current, 0)
    const complete = remaining <= 0
    const value = valueLabel ? valueLabel(Math.min(current, target), target) : `${current} / ${target}`
    const help = complete ? reachedLabel : remainingLabel ? remainingLabel(remaining) : `${remaining}`
    return (
      <div ref={ref} className={cn("troc-market-progress", className)} {...props}>
        <Progress
          value={current}
          max={target}
          label={label}
          valueLabel={value}
          size={size}
          tone={complete ? "positive" : "accent"}
        />
        <Remaining text={help} complete={complete} />
      </div>
    )
  },
)
PromotionProgress.displayName = "PromotionProgress"

export { SellerMinimumProgress, FreeShippingProgress, PromotionProgress }
