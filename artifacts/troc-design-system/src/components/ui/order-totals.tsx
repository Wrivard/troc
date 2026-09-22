"use client"

import * as React from "react"

import { cn } from "../../lib/utils"
import { formatCad, type PriceLocale } from "./price"

export interface OrderTotalsLine {
  /** Stable key for the row. */
  id: string
  /** Translated label, e.g. "Cards subtotal". */
  label: string
  /** Amount in CAD; `null` renders a translated unavailable dash. */
  amount: number | null
  /** Negative/credit line (e.g. a discount) — rendered with a minus and muted. */
  credit?: boolean
  /** Optional translated helper below the label (e.g. "3 sellers combined"). */
  hint?: string
}

export interface OrderTotalsProps
  extends Omit<React.HTMLAttributes<HTMLDivElement>, "children"> {
  /** Ordered summary lines (cards subtotal, shipping, discount, …). */
  lines: OrderTotalsLine[]
  /** Translated total label. */
  totalLabel: string
  /** Total amount in CAD. */
  total: number | null
  locale?: PriceLocale
  /** Optional translated savings label, e.g. "You save". */
  savingsLabel?: string
  /** Optional savings amount in CAD (rendered as an emphasised callout). */
  savings?: number | null
  /** Compact tightens spacing/type for cart sidebars; full for detail views. */
  layout?: "full" | "compact"
  /** Translated dash for unavailable amounts. */
  unavailableLabel?: string
}

/**
 * Tabular monetary summary: cards subtotal, shipping, discounts, total, and an
 * optional savings callout. All amounts are CAD and formatted with two-decimal
 * precision so sub-dollar values stay exact. No amounts are computed here — the
 * caller passes final figures — and nothing is persisted or charged.
 */
const OrderTotals = React.forwardRef<HTMLDivElement, OrderTotalsProps>(
  ({ className, lines, totalLabel, total, locale = "en", savingsLabel, savings, layout = "full", unavailableLabel = "—", ...props }, ref) => {
    const fmt = (amount: number | null, credit?: boolean) => {
      if (amount === null) return unavailableLabel
      const text = formatCad(Math.abs(amount), locale, unavailableLabel)
      return credit || amount < 0 ? `−${text}` : text
    }
    return (
      <div
        ref={ref}
        className={cn("troc-order-totals", `troc-order-totals--${layout}`, className)}
        {...props}
      >
        <dl className="troc-order-totals-lines">
          {lines.map((line) => (
            <div key={line.id} className="troc-order-totals-row">
              <dt className="troc-order-totals-label">
                {line.label}
                {line.hint ? <span className="troc-order-totals-hint">{line.hint}</span> : null}
              </dt>
              <dd className={cn("troc-order-totals-amount", line.credit && "troc-order-totals-amount--credit")}>
                {fmt(line.amount, line.credit)}
              </dd>
            </div>
          ))}
          <div className="troc-order-totals-row troc-order-totals-row--total">
            <dt className="troc-order-totals-label">{totalLabel}</dt>
            <dd className="troc-order-totals-amount troc-order-totals-amount--total">{fmt(total)}</dd>
          </div>
        </dl>
        {savingsLabel && savings !== null && savings !== undefined ? (
          <p className="troc-order-totals-savings">
            <span>{savingsLabel}</span>
            <span className="troc-order-totals-savings-amount">{formatCad(savings, locale, unavailableLabel)}</span>
          </p>
        ) : null}
      </div>
    )
  }
)
OrderTotals.displayName = "OrderTotals"

export { OrderTotals }
