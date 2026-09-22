"use client"

import * as React from "react"
import { ImageOff } from "lucide-react"

import { cn } from "../../lib/utils"
import { Skeleton } from "./skeleton"

/**
 * Card artwork frame. Keeps the full trading-card shape (63:88) and contains the
 * artwork so no card is cropped. Image URLs are supplied by the caller via `src`
 * (never bundled). `loading` shows a skeleton; a missing/empty `src` renders an
 * accessible placeholder without requesting a fake or broken URL.
 */
export interface CardImageProps
  extends Omit<React.HTMLAttributes<HTMLSpanElement>, "children"> {
  /** Card artwork URL. Omit / empty for the accessible missing state. */
  src?: string | null
  /** Translated alternative text describing the card. */
  alt: string
  /** Render a loading skeleton instead of the image. */
  loading?: boolean
  /** Translated label shown in the missing-image state. */
  missingLabel: string
}

const CardImage = React.forwardRef<HTMLSpanElement, CardImageProps>(
  ({ className, src, alt, loading = false, missingLabel, ...props }, ref) => {
    // Track load failure locally so a broken but real URL degrades gracefully;
    // we never point <img> at a placeholder/broken URL ourselves.
    const [failed, setFailed] = React.useState(false)
    React.useEffect(() => {
      setFailed(false)
    }, [src])

    if (loading) {
      return (
        <span ref={ref} className={cn("troc-card-image", className)} {...props}>
          <Skeleton shape="card" className="troc-card-image-skeleton" />
        </span>
      )
    }

    const hasImage = Boolean(src) && !failed
    if (!hasImage) {
      return (
        <span
          ref={ref}
          className={cn("troc-card-image", "troc-card-image--missing", className)}
          role="img"
          aria-label={`${alt} — ${missingLabel}`}
          {...props}
        >
          <span aria-hidden="true">
            <ImageOff aria-hidden="true" />
            <span className="troc-card-image-missing-text">{missingLabel}</span>
          </span>
        </span>
      )
    }

    return (
      <span ref={ref} className={cn("troc-card-image", className)} {...props}>
        <img src={src as string} alt={alt} loading="lazy" onError={() => setFailed(true)} />
      </span>
    )
  }
)
CardImage.displayName = "CardImage"

/** Card title. Renders an `<h3>` by default; override with `as`. */
export interface CardTitleProps
  extends React.HTMLAttributes<HTMLHeadingElement> {
  /** Element/tag to render; keep the heading level appropriate to context. */
  as?: "h2" | "h3" | "h4" | "span"
  /** Smaller title used in compact rows. */
  size?: "default" | "sm"
}

const CardTitle = React.forwardRef<HTMLHeadingElement, CardTitleProps>(
  ({ className, as: Tag = "h3", size = "default", ...props }, ref) => (
    <Tag
      ref={ref as React.Ref<HTMLHeadingElement>}
      className={cn("troc-card-title", size === "sm" && "troc-card-title--sm", className)}
      {...props}
    />
  )
)
CardTitle.displayName = "CardTitle"

/**
 * Inline metadata row (set, card number, condition, language, etc.). Pass
 * translated string items; a thin separator is inserted between them.
 */
export interface CardMetadataProps
  extends React.HTMLAttributes<HTMLParagraphElement> {
  items: React.ReactNode[]
}

const CardMetadata = React.forwardRef<HTMLParagraphElement, CardMetadataProps>(
  ({ className, items, ...props }, ref) => (
    <p ref={ref} className={cn("troc-card-metadata", className)} {...props}>
      {items.map((item, index) => (
        <React.Fragment key={index}>
          {index > 0 ? (
            <span className="troc-card-metadata-sep" aria-hidden="true">·</span>
          ) : null}
          <span className="troc-card-metadata-item">{item}</span>
        </React.Fragment>
      ))}
    </p>
  )
)
CardMetadata.displayName = "CardMetadata"

/**
 * Availability line: seller count and available quantity, both preformatted and
 * translated by the caller. `outOfStock` swaps to the out-of-stock treatment.
 */
export interface ProductAvailabilityProps
  extends React.HTMLAttributes<HTMLDivElement> {
  /** Translated "N sellers" label. */
  sellersLabel?: string
  /** Translated "N available" / "Out of stock" label. */
  stockLabel?: string
  outOfStock?: boolean
}

const ProductAvailability = React.forwardRef<HTMLDivElement, ProductAvailabilityProps>(
  ({ className, sellersLabel, stockLabel, outOfStock = false, ...props }, ref) => (
    <div className={cn("troc-product-availability", className)} ref={ref} {...props}>
      {sellersLabel ? (
        <span className="troc-product-availability-item">{sellersLabel}</span>
      ) : null}
      {stockLabel ? (
        <span
          className={cn(
            "troc-product-availability-item",
            outOfStock && "troc-product-availability--out"
          )}
        >
          {stockLabel}
        </span>
      ) : null}
    </div>
  )
)
ProductAvailability.displayName = "ProductAvailability"

interface ProductBaseProps {
  /** Selected/active state (e.g. in a comparison grid). */
  selected?: boolean
  /** Dim the card and mark it as out of stock. */
  unavailable?: boolean
  /** Force a static preview state for the style guide. */
  previewState?: "hover" | "focus"
}

/**
 * Tile card. A semantic `<article>` that composes the card image, title,
 * metadata, badges, price, availability, and actions. Interactive controls are
 * passed via `actions` and rendered as siblings of any link — never nested.
 */
export interface ProductCardProps
  extends Omit<React.HTMLAttributes<HTMLElement>, "title">,
    ProductBaseProps {
  image: React.ReactNode
  title: React.ReactNode
  metadata?: React.ReactNode
  /** Condition / language / game / set / variant badges. */
  badges?: React.ReactNode
  /** Reference and lowest-available prices. */
  price?: React.ReactNode
  availability?: React.ReactNode
  /** Sibling action controls (view offers, select, etc.). */
  actions?: React.ReactNode
}

const ProductCard = React.forwardRef<HTMLElement, ProductCardProps>(
  (
    { className, image, title, metadata, badges, price, availability, actions, selected, unavailable, previewState, ...props },
    ref
  ) => (
    <article
      ref={ref}
      className={cn("troc-product", "troc-product--tile", className)}
      data-selected={selected || undefined}
      data-unavailable={unavailable || undefined}
      data-preview={previewState}
      {...props}
    >
      {image}
      <div className="troc-product-body">
        {title}
        {metadata}
        {badges ? <div className="troc-card-badges">{badges}</div> : null}
        {price}
        {availability}
      </div>
      {actions ? <div className="troc-product-actions">{actions}</div> : null}
    </article>
  )
)
ProductCard.displayName = "ProductCard"

/**
 * Compact horizontal row variant of the same family. Same slots, arranged for
 * dense lists and search results.
 */
export interface ProductRowProps extends ProductCardProps {}

const ProductRow = React.forwardRef<HTMLElement, ProductRowProps>(
  (
    { className, image, title, metadata, badges, price, availability, actions, selected, unavailable, previewState, ...props },
    ref
  ) => (
    <article
      ref={ref}
      className={cn("troc-product", "troc-product--row", className)}
      data-selected={selected || undefined}
      data-unavailable={unavailable || undefined}
      data-preview={previewState}
      {...props}
    >
      {image}
      <div className="troc-product-body">
        {title}
        {metadata}
        {badges ? <div className="troc-card-badges">{badges}</div> : null}
      </div>
      <div className="troc-product-side">
        {price}
        {availability}
        {actions ? <div className="troc-product-actions">{actions}</div> : null}
      </div>
    </article>
  )
)
ProductRow.displayName = "ProductRow"

export { CardImage, CardTitle, CardMetadata, ProductAvailability, ProductCard, ProductRow }
