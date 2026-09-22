"use client"

import * as React from "react"
import { Star } from "lucide-react"

import { cn } from "../../lib/utils"
import { Badge } from "./badge-status"

type RatingLocale = "en" | "fr"

export interface SellerRatingProps
  extends React.HTMLAttributes<HTMLDivElement> {
  /** Average score; pass `null` for a new / unrated seller. */
  value: number | null
  /** Number of reviews backing the score. Omit or 0 hides the count. */
  count?: number
  /** Translated accessible name, e.g. "Seller rating" or the unrated message. */
  label: string
  /** Locale used only for number formatting of the score/count. */
  locale?: RatingLocale
  /** Max score on the star scale. Defaults to 5. */
  max?: number
  /** Compact hides the star row and shows a single score chip. */
  format?: "full" | "compact"
  /** When true, render a placeholder skeleton row instead of a value. */
  loading?: boolean
}

const clampScore = (value: number, max: number) => Math.min(Math.max(value, 0), max)

/**
 * Seller rating: average score, star row, and review count. `value === null`
 * renders an explicit "unrated" state. All copy comes from props; no traction
 * or account data is implied.
 */
const SellerRating = React.forwardRef<HTMLDivElement, SellerRatingProps>(
  ({ className, value, count, label, locale = "en", max = 5, format = "full", loading = false, ...props }, ref) => {
    const numberLocale = `${locale}-CA`
    const rated = value !== null

    if (loading) {
      return (
        <div ref={ref} className={cn("troc-seller-rating troc-seller-rating--loading", className)} aria-busy="true" {...props}>
          <span role="status" className="troc-seller-rating-sr">{label}</span>
          <span className="troc-seller-rating-skeleton" aria-hidden="true" />
        </div>
      )
    }

    if (!rated) {
      return (
        <div ref={ref} className={cn("troc-seller-rating troc-seller-rating--unrated", className)} {...props}>
          <Star className="troc-seller-rating-star" aria-hidden="true" />
          <span className="troc-seller-rating-label">{label}</span>
        </div>
      )
    }

    const score = clampScore(value, max)
    const scoreText = new Intl.NumberFormat(numberLocale, { minimumFractionDigits: 1, maximumFractionDigits: 1 }).format(score)
    const countText = count && count > 0 ? new Intl.NumberFormat(numberLocale).format(count) : null
    const accessibleText = countText ? `${label}: ${scoreText}/${max} (${countText})` : `${label}: ${scoreText}/${max}`

    if (format === "compact") {
      return (
        <div ref={ref} className={cn("troc-seller-rating troc-seller-rating--compact", className)} aria-label={accessibleText} {...props}>
          <Star className="troc-seller-rating-star troc-seller-rating-star--filled" aria-hidden="true" />
          <span className="troc-seller-rating-score">{scoreText}</span>
          {countText ? <span className="troc-seller-rating-count">({countText})</span> : null}
        </div>
      )
    }

    return (
      <div ref={ref} className={cn("troc-seller-rating", className)} aria-label={accessibleText} {...props}>
        <span className="troc-seller-rating-score">{scoreText}</span>
        <span className="troc-seller-rating-stars" aria-hidden="true">
          {Array.from({ length: max }, (_, index) => {
            const fill = clampScore(score - index, 1)
            return (
              <span key={index} className="troc-seller-rating-slot">
                <Star className="troc-seller-rating-star" />
                <span className="troc-seller-rating-fill" style={{ width: `${fill * 100}%` }}>
                  <Star className="troc-seller-rating-star troc-seller-rating-star--filled" />
                </span>
              </span>
            )
          })}
        </span>
        {countText ? <span className="troc-seller-rating-count">{countText}</span> : null}
      </div>
    )
  }
)
SellerRating.displayName = "SellerRating"

export interface SellerStatProps extends React.HTMLAttributes<HTMLDivElement> {
  /** Translated stat label, e.g. "Ships from". */
  label: string
  /** Preformatted, translated value; pass "—" for unavailable. */
  value: React.ReactNode
  /** Optional leading icon. */
  icon?: React.ReactNode
}

/** A single labelled seller stat cell. Value is preformatted by the caller. */
const SellerStat = React.forwardRef<HTMLDivElement, SellerStatProps>(
  ({ className, label, value, icon, ...props }, ref) => (
    <div ref={ref} className={cn("troc-seller-stat", className)} {...props}>
      <span className="troc-seller-stat-label">
        {icon ? <span className="troc-seller-stat-icon" aria-hidden="true">{icon}</span> : null}
        {label}
      </span>
      <span className="troc-seller-stat-value">{value}</span>
    </div>
  )
)
SellerStat.displayName = "SellerStat"

/** A responsive grid of `SellerStat` cells. */
const SellerStats = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => (
    <div ref={ref} className={cn("troc-seller-stats", className)} {...props} />
  )
)
SellerStats.displayName = "SellerStats"

export type SellerLevelTier = "new" | "established" | "top" | "founding"

export interface SellerLevelBadgeProps
  extends React.HTMLAttributes<HTMLSpanElement> {
  tier: SellerLevelTier
  /** Translated level name; status meaning never relies on colour alone. */
  label: string
  /** Optional leading icon supplied by the caller. */
  icon?: React.ReactNode
}

const LEVEL_VARIANT: Record<SellerLevelTier, React.ComponentProps<typeof Badge>["variant"]> = {
  new: "neutral",
  established: "outline",
  top: "accent",
  founding: "positive",
}

/** Seller level as a `Badge`. Tier maps to an approved badge variant. */
const SellerLevelBadge = React.forwardRef<HTMLSpanElement, SellerLevelBadgeProps>(
  ({ className, tier, label, icon, ...props }, ref) => (
    <Badge ref={ref} variant={LEVEL_VARIANT[tier]} className={cn("troc-seller-level", className)} {...props}>
      {icon ?? null}
      {label}
    </Badge>
  )
)
SellerLevelBadge.displayName = "SellerLevelBadge"

export interface SellerPlanBadgeProps
  extends React.HTMLAttributes<HTMLSpanElement> {
  /** Translated plan name, e.g. "Hobby Shop". Plans are not implemented. */
  label: string
  /** Emphasise a paid/featured plan without extra accent colours. */
  featured?: boolean
  icon?: React.ReactNode
}

/** Seller plan label as a `Badge`. Visual only; no plan/billing is implemented. */
const SellerPlanBadge = React.forwardRef<HTMLSpanElement, SellerPlanBadgeProps>(
  ({ className, label, featured = false, icon, ...props }, ref) => (
    <Badge ref={ref} variant={featured ? "outline" : "sponsored"} className={cn("troc-seller-plan", className)} {...props}>
      {icon ?? null}
      {label}
    </Badge>
  )
)
SellerPlanBadge.displayName = "SellerPlanBadge"

/** Documented aliases matching the ledger export names. */
const SellerLevel = SellerLevelBadge
const SellerPlan = SellerPlanBadge

export {
  SellerRating,
  SellerStat,
  SellerStats,
  SellerLevelBadge,
  SellerLevel,
  SellerPlanBadge,
  SellerPlan,
}
