"use client"

import * as React from "react"

import { cn } from "../../lib/utils"

export type PriceLocale = "en" | "fr"
export type PriceSize = "sm" | "default" | "lg"

/**
 * Format a CAD amount with `Intl.NumberFormat` for the given locale. Returns a
 * translated fallback when the amount is null/undefined so callers never render
 * a broken price.
 */
export function formatCad(
  amount: number | null | undefined,
  locale: PriceLocale = "en",
  fallback = "—",
): string {
  if (amount === null || amount === undefined || Number.isNaN(amount)) return fallback
  return new Intl.NumberFormat(`${locale}-CA`, {
    style: "currency",
    currency: "CAD",
    currencyDisplay: "narrowSymbol",
  }).format(amount)
}

export interface PriceBlockProps
  extends Omit<React.HTMLAttributes<HTMLSpanElement>, "children"> {
  /** Amount in CAD; pass `null` for an unavailable price. */
  amount: number | null
  /** Locale used only for Intl number formatting. */
  locale?: PriceLocale
  /** Optional translated label rendered above the amount (e.g. "Reference price"). */
  label?: string
  /** Typographic size. */
  size?: PriceSize
  /** Translated fallback shown when `amount` is null. */
  unavailableLabel?: string
}

/**
 * Core CAD price typography. Tabular numerals keep columns aligned. Copy and
 * amounts are supplied by the caller; the component only formats and lays out.
 */
const PriceBlock = React.forwardRef<HTMLSpanElement, PriceBlockProps>(
  ({ className, amount, locale = "en", label, size = "default", unavailableLabel = "—", ...props }, ref) => {
    const available = amount !== null
    const text = formatCad(amount, locale, unavailableLabel)
    return (
      <span
        ref={ref}
        className={cn(
          "troc-price",
          `troc-price--${size}`,
          !available && "troc-price--unavailable",
          className,
        )}
        {...props}
      >
        {label ? <span className="troc-price-label">{label}</span> : null}
        <span className="troc-price-amount">{text}</span>
      </span>
    )
  },
)
PriceBlock.displayName = "PriceBlock"

export interface ReferencePriceProps
  extends Omit<PriceBlockProps, "size"> {
  size?: PriceSize
}

/**
 * Reference (market) price — a muted, labelled `PriceBlock`. Reuses the same
 * amount + locale + label contract.
 */
const ReferencePrice = React.forwardRef<HTMLSpanElement, ReferencePriceProps>(
  ({ className, size = "sm", ...props }, ref) => (
    <PriceBlock
      ref={ref}
      size={size}
      className={cn("troc-price--reference", className)}
      {...props}
    />
  ),
)
ReferencePrice.displayName = "ReferencePrice"

/**
 * Lowest available price — an emphasised, labelled `PriceBlock`. Reuses the
 * same amount + locale + label contract.
 */
const LowestAvailable = React.forwardRef<HTMLSpanElement, ReferencePriceProps>(
  ({ className, size = "default", ...props }, ref) => (
    <PriceBlock
      ref={ref}
      size={size}
      className={cn("troc-price--lowest", className)}
      {...props}
    />
  ),
)
LowestAvailable.displayName = "LowestAvailable"

export interface SalePriceProps
  extends Omit<React.HTMLAttributes<HTMLSpanElement>, "children"> {
  /** Current (discounted) amount in CAD. */
  amount: number | null
  /** Previous amount shown struck through. */
  previousAmount: number | null
  locale?: PriceLocale
  label?: string
  size?: PriceSize
  /** Translated "was" prefix read by screen readers for the struck price. */
  wasLabel?: string
  unavailableLabel?: string
}

/**
 * Sale price treatment: the current amount in intentional red beside the
 * struck-through previous amount. Discount is intentional emphasis, not a new
 * accent colour.
 */
const SalePrice = React.forwardRef<HTMLSpanElement, SalePriceProps>(
  (
    { className, amount, previousAmount, locale = "en", label, size = "default", wasLabel = "Was", unavailableLabel = "—", ...props },
    ref,
  ) => {
    const current = formatCad(amount, locale, unavailableLabel)
    const previous = formatCad(previousAmount, locale, unavailableLabel)
    const showPrevious = previousAmount !== null && amount !== null
    return (
      <span
        ref={ref}
        className={cn("troc-price", `troc-price--${size}`, "troc-price--sale", className)}
        {...props}
      >
        {label ? <span className="troc-price-label">{label}</span> : null}
        <span className="troc-price-sale-row">
          <span className="troc-price-amount troc-price-amount--sale">{current}</span>
          {showPrevious ? (
            <s className="troc-price-was">
              <span className="troc-seller-rating-sr">{wasLabel} </span>
              {previous}
            </s>
          ) : null}
        </span>
      </span>
    )
  },
)
SalePrice.displayName = "SalePrice"

export { PriceBlock, ReferencePrice, LowestAvailable, SalePrice }
