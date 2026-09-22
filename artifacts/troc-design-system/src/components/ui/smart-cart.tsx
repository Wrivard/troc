"use client"

import * as React from "react"
import { Info, Sparkles } from "lucide-react"

import { cn } from "../../lib/utils"
import { Alert } from "./alert"
import { OrderTotals, type OrderTotalsLine } from "./order-totals"
import { formatCad, type PriceLocale } from "./price"

export interface SmartCartColumn {
  /** Translated column heading, e.g. "Original" / "TROC Smart Cart". */
  heading: string
  /** Preformatted, translated seller-count line, e.g. "8 sellers". */
  sellersLabel: string
  /** OrderTotals lines (cards, shipping) for this column. */
  lines: OrderTotalsLine[]
  /** Translated total label for this column. */
  totalLabel: string
  /** Total amount in CAD. */
  total: number | null
  /** Mark the recommended column (TROC Smart Cart) for emphasis. */
  recommended?: boolean
}

export interface SmartCartSavingsCalloutProps
  extends Omit<React.HTMLAttributes<HTMLDivElement>, "children"> {
  /** Translated label, e.g. "You save". */
  label: string
  /** Savings amount in CAD. */
  amount: number | null
  locale?: PriceLocale
  unavailableLabel?: string
}

/** Emphasised "You save $9.92" callout. Presentation only. */
const SmartCartSavingsCallout = React.forwardRef<HTMLDivElement, SmartCartSavingsCalloutProps>(
  ({ className, label, amount, locale = "en", unavailableLabel = "—", ...props }, ref) => (
    <div ref={ref} className={cn("troc-smart-savings", className)} {...props}>
      <Sparkles className="troc-smart-savings-icon" aria-hidden="true" />
      <span className="troc-smart-savings-label">{label}</span>
      <span className="troc-smart-savings-amount">{formatCad(amount, locale, unavailableLabel)}</span>
    </div>
  )
)
SmartCartSavingsCallout.displayName = "SmartCartSavingsCallout"

export interface SmartCartExplanationProps
  extends Omit<React.HTMLAttributes<HTMLDivElement>, "children"> {
  /**
   * Translated explanation, e.g. "This card costs $0.06 more from this seller
   * but saves $1.24 in shipping." Supplied fully formatted by the caller.
   */
  text: React.ReactNode
}

/** Plain-language explanation line, rendered as a neutral informational Alert. */
const SmartCartExplanation = React.forwardRef<HTMLDivElement, SmartCartExplanationProps>(
  ({ className, text, ...props }, ref) => (
    <Alert ref={ref} variant="neutral" icon={<Info aria-hidden="true" />} className={cn("troc-smart-explanation", className)} {...props}>
      {text}
    </Alert>
  )
)
SmartCartExplanation.displayName = "SmartCartExplanation"

export interface SmartCartComparisonProps
  extends Omit<React.HTMLAttributes<HTMLDivElement>, "children"> {
  /** The two columns to compare (Original vs TROC Smart Cart). */
  columns: [SmartCartColumn, SmartCartColumn]
  locale?: PriceLocale
  /** Optional savings callout props rendered between/after the columns. */
  savings?: SmartCartSavingsCalloutProps
  /** Optional explanation node/text rendered below the comparison. */
  explanation?: React.ReactNode
  /** Translated seller-count row label, e.g. "Sellers". */
  sellersRowLabel: string
  loading?: boolean
  /** Translated accessible label used while loading. */
  loadingLabel?: string
  /** Render the empty state (no cart to compare yet). */
  empty?: boolean
  /** Translated empty-state message. */
  emptyLabel?: string
}

/**
 * Visual-only Smart Cart comparison. It presents two supplied, preformatted
 * columns of figures side by side with a savings callout and explanation. It
 * performs no optimization, saves nothing, and never represents a real cart or
 * purchase — any "apply" action is the caller's responsibility and must be a
 * clearly-labelled local preview.
 */
const SmartCartComparison = React.forwardRef<HTMLDivElement, SmartCartComparisonProps>(
  ({ className, columns, locale = "en", savings, explanation, sellersRowLabel, loading = false, loadingLabel, empty = false, emptyLabel, ...props }, ref) => {
    if (loading) {
      return (
        <div ref={ref} className={cn("troc-smart-cart", className)} aria-busy="true" {...props}>
          {loadingLabel ? <span className="troc-seller-rating-sr" role="status">{loadingLabel}</span> : null}
          <div className="troc-smart-cart-columns">
            {[0, 1].map((i) => (
              <div key={i} className="troc-smart-cart-col troc-smart-cart-col--loading" aria-hidden="true">
                <div className="troc-smart-cart-col-head" />
                <div className="troc-smart-cart-col-skeleton" />
                <div className="troc-smart-cart-col-skeleton" />
                <div className="troc-smart-cart-col-skeleton" />
              </div>
            ))}
          </div>
        </div>
      )
    }

    if (empty) {
      return (
        <div ref={ref} className={cn("troc-smart-cart troc-smart-cart--empty", className)} {...props}>
          <p className="troc-smart-cart-empty">{emptyLabel}</p>
        </div>
      )
    }

    return (
      <div ref={ref} className={cn("troc-smart-cart", className)} {...props}>
        <div className="troc-smart-cart-columns">
          {columns.map((col, index) => (
            <div
              key={index}
              className={cn("troc-smart-cart-col", col.recommended && "troc-smart-cart-col--recommended")}
              data-recommended={col.recommended || undefined}
            >
              <div className="troc-smart-cart-col-head">
                <span className="troc-smart-cart-col-heading">
                  {col.recommended ? <Sparkles aria-hidden="true" /> : null}
                  {col.heading}
                </span>
                <span className="troc-smart-cart-col-sellers">{col.sellersLabel}</span>
              </div>
              <OrderTotals
                layout="compact"
                lines={col.lines}
                totalLabel={col.totalLabel}
                total={col.total}
                locale={locale}
              />
            </div>
          ))}
        </div>
        {savings ? <SmartCartSavingsCallout {...savings} locale={savings.locale ?? locale} /> : null}
        {explanation ? (
          typeof explanation === "string" ? <SmartCartExplanation text={explanation} /> : explanation
        ) : null}
        {/* sellersRowLabel is exposed for callers that render their own row header. */}
        <span className="troc-seller-rating-sr">{sellersRowLabel}</span>
      </div>
    )
  }
)
SmartCartComparison.displayName = "SmartCartComparison"

export { SmartCartComparison, SmartCartSavingsCallout, SmartCartExplanation }
