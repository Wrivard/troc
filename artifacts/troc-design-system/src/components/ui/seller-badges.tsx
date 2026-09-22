"use client"

import * as React from "react"
import { BadgeCheck, Crown, Megaphone, Sparkles, Store } from "lucide-react"

import { cn } from "../../lib/utils"
import { Badge } from "./badge-status"

export type SellerBadgeKind =
  | "verified-seller"
  | "verified-hobby-shop"
  | "top-seller"
  | "founding-seller"
  | "sponsored"

export type SellerBadgeSize = "compact" | "default"

/**
 * Verification/trust variants stay neutral and factual; only "sponsored" is set
 * apart (dashed, uppercase) so a paid placement is never confused with earned
 * verification. No accent colours are introduced.
 */
const KIND_VARIANT: Record<SellerBadgeKind, React.ComponentProps<typeof Badge>["variant"]> = {
  "verified-seller": "neutral",
  "verified-hobby-shop": "outline",
  "top-seller": "accent",
  "founding-seller": "positive",
  sponsored: "sponsored",
}

const KIND_ICON: Record<SellerBadgeKind, React.ReactNode> = {
  "verified-seller": <BadgeCheck aria-hidden="true" />,
  "verified-hobby-shop": <Store aria-hidden="true" />,
  "top-seller": <Crown aria-hidden="true" />,
  "founding-seller": <Sparkles aria-hidden="true" />,
  sponsored: <Megaphone aria-hidden="true" />,
}

export interface SellerBadgeProps
  extends Omit<React.HTMLAttributes<HTMLSpanElement>, "children"> {
  kind: SellerBadgeKind
  /** Translated, human-readable label; meaning never relies on colour alone. */
  label: string
  size?: SellerBadgeSize
  /** Override the default icon; pass `null` to render text only. */
  icon?: React.ReactNode | null
}

/**
 * Seller trust badge. Five kinds map to approved Badge variants and lucide
 * icons; copy is supplied per locale. Nothing here implies a real seller
 * account, verification, or plan.
 */
const SellerBadge = React.forwardRef<HTMLSpanElement, SellerBadgeProps>(
  ({ className, kind, label, size = "default", icon, ...props }, ref) => {
    const resolvedIcon = icon === undefined ? KIND_ICON[kind] : icon
    return (
      <Badge
        ref={ref}
        variant={KIND_VARIANT[kind]}
        className={cn(
          "troc-seller-badge",
          `troc-seller-badge--${kind}`,
          size === "compact" && "troc-seller-badge--compact",
          className,
        )}
        data-seller-kind={kind}
        {...props}
      >
        {resolvedIcon ?? null}
        <span className="troc-seller-badge-label">{label}</span>
      </Badge>
    )
  },
)
SellerBadge.displayName = "SellerBadge"

export { SellerBadge }
