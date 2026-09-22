"use client"

import * as React from "react"
import { Trash2 } from "lucide-react"

import { cn } from "../../lib/utils"
import { Button } from "./button"
import { QuantityControl } from "./quantity-control"

export interface CartItemProps
  extends Omit<React.HTMLAttributes<HTMLDivElement>, "title"> {
  /** Card image node (e.g. a CardImage). */
  image?: React.ReactNode
  /** Card title node (e.g. a CardTitle) or translated string. */
  title: React.ReactNode
  /** Metadata node (set/number/condition/language) or translated string. */
  metadata?: React.ReactNode
  /** Badges row (condition/variant …). */
  badges?: React.ReactNode
  /** Unit price node (e.g. a PriceBlock) — supports sub-dollar amounts. */
  unitPrice: React.ReactNode
  /** Line total node (unit × quantity), preformatted by the caller. */
  lineTotal?: React.ReactNode
  /** Current quantity (controlled). */
  quantity: number
  onQuantityChange?: (value: number) => void
  onRemove?: () => void
  /** Translated accessible label for the quantity field. */
  quantityLabel: string
  decrementLabel: string
  incrementLabel: string
  /** Translated accessible label for the remove control. */
  removeLabel: string
  min?: number
  max?: number
  /** Mark the item unavailable (out of stock / seller removed it). */
  unavailable?: boolean
  /** Translated unavailable note. */
  unavailableLabel?: string
  loading?: boolean
}

/**
 * A single cart line: image, title/metadata, unit price (sub-dollar friendly),
 * a real QuantityControl, a line total, and a remove control. All state is
 * driven by the caller; nothing is persisted.
 */
const CartItem = React.forwardRef<HTMLDivElement, CartItemProps>(
  ({ className, image, title, metadata, badges, unitPrice, lineTotal, quantity, onQuantityChange, onRemove, quantityLabel, decrementLabel, incrementLabel, removeLabel, min = 1, max = 99, unavailable = false, unavailableLabel, loading = false, ...props }, ref) => (
    <div
      ref={ref}
      className={cn("troc-cart-item", unavailable && "troc-cart-item--unavailable", loading && "troc-cart-item--loading", className)}
      data-unavailable={unavailable || undefined}
      aria-busy={loading || undefined}
      {...props}
    >
      {image ? <div className="troc-cart-item-image">{image}</div> : null}
      <div className="troc-cart-item-info">
        <div className="troc-cart-item-title">{title}</div>
        {metadata ? <div className="troc-cart-item-meta">{metadata}</div> : null}
        {badges ? <div className="troc-cart-item-badges">{badges}</div> : null}
        {unavailable && unavailableLabel ? (
          <p className="troc-cart-item-unavailable" role="status">{unavailableLabel}</p>
        ) : null}
      </div>
      <div className="troc-cart-item-price">{unitPrice}</div>
      <div className="troc-cart-item-qty">
        <QuantityControl
          compact
          value={quantity}
          onValueChange={onQuantityChange}
          min={min}
          max={max}
          disabled={unavailable || loading}
          label={quantityLabel}
          decrementLabel={decrementLabel}
          incrementLabel={incrementLabel}
        />
      </div>
      <div className="troc-cart-item-total">{lineTotal}</div>
      <div className="troc-cart-item-remove">
        <Button
          type="button"
          variant="ghost"
          size="icon"
          aria-label={removeLabel}
          onClick={onRemove}
          disabled={loading}
        >
          <Trash2 aria-hidden="true" />
        </Button>
      </div>
    </div>
  )
)
CartItem.displayName = "CartItem"

export interface CartSellerGroupProps
  extends Omit<React.HTMLAttributes<HTMLElement>, "title"> {
  /** Seller name/heading node or translated string. */
  sellerName: React.ReactNode
  /** Optional seller avatar / badges node rendered beside the name. */
  sellerMeta?: React.ReactNode
  /** The CartItem rows for this seller. */
  children: React.ReactNode
  /** Seller-minimum progress node (SellerMinimumProgress). */
  minimumProgress?: React.ReactNode
  /** Promotion progress node (PromotionProgress). */
  promotionProgress?: React.ReactNode
  /** Promotion badge/card node. */
  promotion?: React.ReactNode
  /** Translated combined-shipping line, e.g. "Combined shipping: $3.99". */
  shippingLabel?: React.ReactNode
  /** Seller subtotal node (e.g. a PriceBlock), preformatted by the caller. */
  subtotal?: React.ReactNode
  /** Translated subtotal label. */
  subtotalLabel?: string
  loading?: boolean
  /** Translated accessible label used while loading. */
  loadingLabel?: string
}

/**
 * A cart section grouped by seller: header, item rows, seller-minimum and
 * promotion progress, a combined-shipping line, and a seller subtotal. Combined
 * shipping is emphasised because it is the point of grouping by seller.
 */
const CartSellerGroup = React.forwardRef<HTMLElement, CartSellerGroupProps>(
  ({ className, sellerName, sellerMeta, children, minimumProgress, promotionProgress, promotion, shippingLabel, subtotal, subtotalLabel, loading = false, loadingLabel, ...props }, ref) => (
    <section
      ref={ref}
      className={cn("troc-cart-group", className)}
      aria-busy={loading || undefined}
      {...props}
    >
      <header className="troc-cart-group-head">
        <div className="troc-cart-group-seller">
          <h3 className="troc-cart-group-name">{sellerName}</h3>
          {sellerMeta ? <div className="troc-cart-group-meta">{sellerMeta}</div> : null}
        </div>
        {promotion ? <div className="troc-cart-group-promotion">{promotion}</div> : null}
      </header>

      {loading && loadingLabel ? <span className="troc-seller-rating-sr" role="status">{loadingLabel}</span> : null}

      <div className="troc-cart-group-items">{children}</div>

      {(minimumProgress || promotionProgress) && (
        <div className="troc-cart-group-progress">
          {minimumProgress}
          {promotionProgress}
        </div>
      )}

      {(shippingLabel || subtotal) && (
        <footer className="troc-cart-group-foot">
          {shippingLabel ? <span className="troc-cart-group-shipping">{shippingLabel}</span> : null}
          {subtotal ? (
            <span className="troc-cart-group-subtotal">
              {subtotalLabel ? <span className="troc-cart-group-subtotal-label">{subtotalLabel}</span> : null}
              {subtotal}
            </span>
          ) : null}
        </footer>
      )}
    </section>
  )
)
CartSellerGroup.displayName = "CartSellerGroup"

export { CartItem, CartSellerGroup }
