"use client"

import * as React from "react"

import { cn } from "../../lib/utils"
import { CardImage, CardTitle } from "./product-presentation"

/**
 * Compact, static reference of a single recent (illustrative) sale: card image,
 * title, price, and timestamp. There is no ticker animation and no live data;
 * drop instances into any reduced-motion-safe container as needed. Image URLs
 * and all copy are supplied by the caller. When `href` is set the whole item is
 * a link; otherwise it renders as a non-interactive `<article>`.
 */
export interface RecentlySoldItemProps
  extends Omit<React.HTMLAttributes<HTMLElement>, "title"> {
  /** Card artwork URL. Omit for the accessible missing state. */
  imageSrc?: string | null
  /** Translated alt text for the card image. */
  imageAlt: string
  /** Translated missing-image label. */
  imageMissingLabel: string
  /** Render an image skeleton for the loading state. */
  loading?: boolean
  /** Translated card title. */
  title: React.ReactNode
  /** Preformatted, translated price (e.g. a PriceBlock or plain string). */
  price: React.ReactNode
  /** Translated "Sold for" prefix, announced with the price. */
  priceLabel: string
  /** Translated relative timestamp, e.g. "2 min ago". */
  timestamp: string
  /** Optional destination; when set the item becomes a focusable link. */
  href?: string
  /** Force a static preview state for the style guide. */
  previewState?: "focus"
}

const RecentlySoldItem = React.forwardRef<HTMLElement, RecentlySoldItemProps>(
  (
    { className, imageSrc, imageAlt, imageMissingLabel, loading = false, title, price, priceLabel, timestamp, href, previewState, ...props },
    ref
  ) => {
    const body = (
      <>
        <CardImage
          src={imageSrc}
          alt={imageAlt}
          loading={loading}
          missingLabel={imageMissingLabel}
        />
        <span className="troc-recently-sold-body">
          <CardTitle as="span" size="sm" className="troc-recently-sold-title">
            {title}
          </CardTitle>
          <span className="troc-recently-sold-meta">
            {priceLabel} {price}
          </span>
        </span>
        <span className="troc-recently-sold-side">
          <span className="troc-recently-sold-time">{timestamp}</span>
        </span>
      </>
    )

    if (href) {
      return (
        <a
          ref={ref as React.Ref<HTMLAnchorElement>}
          href={href}
          className={cn("troc-recently-sold", className)}
          data-preview={previewState}
          {...(props as React.AnchorHTMLAttributes<HTMLAnchorElement>)}
        >
          {body}
        </a>
      )
    }

    return (
      <article
        ref={ref}
        className={cn("troc-recently-sold", className)}
        data-preview={previewState}
        {...props}
      >
        {body}
      </article>
    )
  }
)
RecentlySoldItem.displayName = "RecentlySoldItem"

export { RecentlySoldItem }
