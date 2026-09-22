"use client"

import * as React from "react"

import { cn } from "../../lib/utils"
import { Skeleton } from "./skeleton"

export type SellerAvatarSize = "sm" | "default" | "lg"

/** Derive up to two uppercase initials from a seller name for the fallback. */
function initialsFromName(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean)
  if (parts.length === 0) return "?"
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase()
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase()
}

export interface SellerAvatarProps
  extends Omit<React.HTMLAttributes<HTMLSpanElement>, "children"> {
  /** Seller display name; used for the initials fallback and the accessible name. */
  name: string
  /** Optional logo/avatar URL supplied by the consumer (never bundled). */
  src?: string | null
  size?: SellerAvatarSize
  loading?: boolean
}

/**
 * Seller logo/avatar. Falls back to seller initials in a neutral tile when no
 * image is supplied or the image fails — it never substitutes the TROC brand
 * logo for a seller. Consumers pass the image URL via `src`.
 */
const SellerAvatar = React.forwardRef<HTMLSpanElement, SellerAvatarProps>(
  ({ className, name, src, size = "default", loading = false, ...props }, ref) => {
    const [failed, setFailed] = React.useState(false)
    React.useEffect(() => setFailed(false), [src])

    if (loading) {
      return (
        <span ref={ref} className={cn("troc-seller-avatar", `troc-seller-avatar--${size}`, className)} {...props}>
          <Skeleton className="troc-seller-avatar-skeleton" />
        </span>
      )
    }

    const hasImage = Boolean(src) && !failed
    return (
      <span
        ref={ref}
        className={cn("troc-seller-avatar", `troc-seller-avatar--${size}`, !hasImage && "troc-seller-avatar--fallback", className)}
        role="img"
        aria-label={name}
        {...props}
      >
        {hasImage ? (
          <img src={src as string} alt="" loading="lazy" onError={() => setFailed(true)} />
        ) : (
          <span aria-hidden="true" className="troc-seller-avatar-initials">{initialsFromName(name)}</span>
        )}
      </span>
    )
  }
)
SellerAvatar.displayName = "SellerAvatar"

export interface SellerBannerProps
  extends Omit<React.HTMLAttributes<HTMLDivElement>, "children"> {
  /** Optional banner image URL supplied by the consumer. */
  src?: string | null
  /** Translated decorative/alt hint; the banner is presentational. */
  alt?: string
  loading?: boolean
}

/**
 * Optional, restrained storefront banner. With no image it renders a subtle
 * neutral surface strip rather than empty space — never a decorative gradient
 * or brand wallpaper.
 */
const SellerBanner = React.forwardRef<HTMLDivElement, SellerBannerProps>(
  ({ className, src, alt = "", loading = false, ...props }, ref) => {
    const [failed, setFailed] = React.useState(false)
    React.useEffect(() => setFailed(false), [src])

    if (loading) {
      return <div ref={ref} className={cn("troc-seller-banner", className)} {...props}><Skeleton className="troc-seller-banner-skeleton" /></div>
    }
    const hasImage = Boolean(src) && !failed
    return (
      <div ref={ref} className={cn("troc-seller-banner", !hasImage && "troc-seller-banner--empty", className)} aria-hidden={hasImage ? undefined : true} {...props}>
        {hasImage ? <img src={src as string} alt={alt} loading="lazy" onError={() => setFailed(true)} /> : null}
      </div>
    )
  }
)
SellerBanner.displayName = "SellerBanner"

export interface SellerStorefrontHeaderProps
  extends Omit<React.HTMLAttributes<HTMLElement>, "title"> {
  /** Seller display name (rendered as the heading). */
  name: string
  /** SellerAvatar node (or another supplied avatar). */
  avatar: React.ReactNode
  /** Optional SellerBanner node rendered behind the identity row. */
  banner?: React.ReactNode
  /** Optional short translated tagline / location line. */
  tagline?: React.ReactNode
  /** Verification / level badges (SellerBadge, SellerLevelBadge …). */
  badges?: React.ReactNode
  /** Rating node (SellerRating). */
  rating?: React.ReactNode
  /** Stats node (SellerStats). */
  stats?: React.ReactNode
  /** Plan node (SellerPlanBadge). */
  plan?: React.ReactNode
  /** Action controls (Button …), rendered as siblings — never nested in a link. */
  actions?: React.ReactNode
  /** Compact layout for narrow / embedded contexts. */
  compact?: boolean
  loading?: boolean
  /** Translated accessible label used while loading. */
  loadingLabel?: string
}

/**
 * Seller storefront identity header: banner, avatar, name, badges, rating,
 * stats, plan, and actions. Every piece of content is supplied via props so the
 * header stays provider-independent and fully translatable.
 */
const SellerStorefrontHeader = React.forwardRef<HTMLElement, SellerStorefrontHeaderProps>(
  ({ className, name, avatar, banner, tagline, badges, rating, stats, plan, actions, compact = false, loading = false, loadingLabel, ...props }, ref) => {
    if (loading) {
      return (
        <section ref={ref} className={cn("troc-storefront", compact && "troc-storefront--compact", className)} aria-busy="true" {...props}>
          {loadingLabel ? <span className="troc-seller-rating-sr" role="status">{loadingLabel}</span> : null}
          <div className="troc-storefront-banner"><Skeleton className="troc-seller-banner-skeleton" /></div>
          <div className="troc-storefront-body">
            <Skeleton className="troc-seller-avatar-skeleton troc-storefront-avatar-skel" />
            <div className="troc-storefront-identity">
              <Skeleton style={{ width: "min(240px, 60%)", height: 20 }} />
              <Skeleton style={{ width: "min(160px, 40%)", height: 14 }} />
            </div>
          </div>
        </section>
      )
    }

    return (
      <section ref={ref} className={cn("troc-storefront", compact && "troc-storefront--compact", className)} {...props}>
        {banner ? <div className="troc-storefront-banner">{banner}</div> : null}
        <div className="troc-storefront-body">
          <div className="troc-storefront-avatar">{avatar}</div>
          <div className="troc-storefront-main">
            <div className="troc-storefront-identity">
              <h2 className="troc-storefront-name">{name}</h2>
              {tagline ? <p className="troc-storefront-tagline">{tagline}</p> : null}
              {(rating || badges) && (
                <div className="troc-storefront-trust">
                  {rating}
                  {badges ? <div className="troc-storefront-badges">{badges}</div> : null}
                </div>
              )}
            </div>
            {stats ? <div className="troc-storefront-stats">{stats}</div> : null}
          </div>
          {(plan || actions) && (
            <div className="troc-storefront-aside">
              {plan}
              {actions ? <div className="troc-storefront-actions">{actions}</div> : null}
            </div>
          )}
        </div>
      </section>
    )
  }
)
SellerStorefrontHeader.displayName = "SellerStorefrontHeader"

export { SellerAvatar, SellerBanner, SellerStorefrontHeader, initialsFromName }
