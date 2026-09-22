"use client"

import * as React from "react"

import { cn } from "../../lib/utils"
import { Button } from "./button"
import { QuantityControl } from "./quantity-control"
import { SellerRating } from "./seller-reputation"

/**
 * One seller's offer for a card. Composes seller identity + verification badge,
 * `SellerRating`, condition badge, price, an editable `QuantityControl`,
 * shipping, an optional promotion, and an Add-to-Cart action. Verification,
 * condition, price, and promotion are passed as slots so the reusable component
 * never hard-depends on the marketplace/seller badge families. `onAddToCart` is
 * a demo callback only — no real cart, checkout, or persistence.
 */
export interface SellerOfferRowProps
  extends Omit<React.HTMLAttributes<HTMLElement>, "onChange"> {
  /** Translated seller name. */
  sellerName: string
  /** Seller verification / badge slot (e.g. a SellerBadge). */
  verification?: React.ReactNode
  /** Rating score; `null` renders the unrated state. */
  ratingValue: number | null
  /** Number of reviews backing the score. */
  ratingCount?: number
  /** Translated accessible name for the rating. */
  ratingLabel: string
  /** Locale for rating number formatting. */
  locale?: "en" | "fr"
  /** Condition badge slot (e.g. a ConditionBadge). */
  condition?: React.ReactNode
  /** Price slot (e.g. a PriceBlock). */
  price: React.ReactNode
  /** Translated shipping line. */
  shipping?: React.ReactNode
  /** Optional promotion badge slot (e.g. a PromotionBadge). */
  promotion?: React.ReactNode

  /** Controlled quantity value. */
  quantity?: number
  /** Uncontrolled initial quantity. */
  defaultQuantity?: number
  onQuantityChange?: (value: number) => void
  maxQuantity?: number
  /** Translated accessible name for the quantity field. */
  quantityLabel: string
  quantityDecrementLabel: string
  quantityIncrementLabel: string

  /** Translated Add-to-Cart label. */
  addToCartLabel: string
  /** Demo-only callback fired when Add to Cart is pressed. */
  onAddToCart?: () => void

  /** Selected/active row state. */
  selected?: boolean
  /** Out-of-stock: hides quantity/cart and shows an unavailable message. */
  unavailable?: boolean
  /** Translated unavailable message shown when `unavailable`. */
  unavailableLabel?: string
  /** Disable the offer's interactive controls. */
  disabled?: boolean
  /**
   * Pending Add-to-Cart state: shows the button's spinner, disables the
   * quantity + action, and marks the row `aria-busy`. Visual/demo only — never
   * a real transaction.
   */
  loading?: boolean
  /**
   * Translated status message announced while `loading` (e.g. "Adding to
   * cart…"). Required whenever `loading` is used so the busy state has a
   * meaningful accessible name; no English default is assumed.
   */
  loadingLabel?: string
  /** Force a static preview state for the style guide. */
  previewState?: "hover" | "focus"
}

const SellerOfferRow = React.forwardRef<HTMLElement, SellerOfferRowProps>(
  (
    {
      className,
      sellerName,
      verification,
      ratingValue,
      ratingCount,
      ratingLabel,
      locale = "en",
      condition,
      price,
      shipping,
      promotion,
      quantity,
      defaultQuantity = 1,
      onQuantityChange,
      maxQuantity = 99,
      quantityLabel,
      quantityDecrementLabel,
      quantityIncrementLabel,
      addToCartLabel,
      onAddToCart,
      selected,
      unavailable = false,
      unavailableLabel,
      disabled = false,
      loading = false,
      loadingLabel,
      previewState,
      ...props
    },
    ref
  ) => {
    const controlsDisabled = disabled || unavailable || loading

    return (
      <article
        ref={ref}
        className={cn("troc-offer", className)}
        data-selected={selected || undefined}
        data-unavailable={unavailable || undefined}
        data-disabled={disabled || undefined}
        data-loading={loading || undefined}
        data-preview={previewState}
        aria-busy={loading || undefined}
        {...props}
      >
        <div className="troc-offer-seller">
          <div className="troc-offer-seller-head">
            <span className="troc-offer-seller-name">{sellerName}</span>
            {verification ? <span className="troc-offer-badges">{verification}</span> : null}
          </div>
          <div className="troc-offer-seller-meta">
            <SellerRating
              value={ratingValue}
              count={ratingCount}
              label={ratingLabel}
              locale={locale}
              format="compact"
            />
            {condition ? <span className="troc-offer-badges">{condition}</span> : null}
          </div>
          {shipping ? <span className="troc-offer-shipping">{shipping}</span> : null}
        </div>

        <div className="troc-offer-detail">
          {price}
          {promotion ? <span className="troc-offer-promotion">{promotion}</span> : null}
          {unavailable && unavailableLabel ? (
            <span className="troc-offer-unavailable" role="status">
              {unavailableLabel}
            </span>
          ) : null}
        </div>

        {unavailable ? null : (
          <div className="troc-offer-actions">
            <QuantityControl
              compact
              value={quantity}
              defaultValue={defaultQuantity}
              onValueChange={onQuantityChange}
              max={maxQuantity}
              disabled={controlsDisabled}
              label={quantityLabel}
              decrementLabel={quantityDecrementLabel}
              incrementLabel={quantityIncrementLabel}
            />
            <Button
              variant="primary"
              loading={loading}
              disabled={disabled || unavailable}
              onClick={onAddToCart}
            >
              {addToCartLabel}
            </Button>
            {loading && loadingLabel ? (
              <span className="troc-offer-status" role="status">
                {loadingLabel}
              </span>
            ) : null}
          </div>
        )}
      </article>
    )
  }
)
SellerOfferRow.displayName = "SellerOfferRow"

export { SellerOfferRow }
