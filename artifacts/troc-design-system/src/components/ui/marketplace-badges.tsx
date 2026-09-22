"use client"

import * as React from "react"

import { cn } from "../../lib/utils"
import { Badge } from "./badge-status"

export type MarketplaceBadgeSize = "compact" | "default"

interface BaseMarketplaceBadgeProps
  extends Omit<React.HTMLAttributes<HTMLSpanElement>, "children"> {
  /** Translated, human-readable label. Meaning never relies on colour alone. */
  label: string
  /** Compact tightens padding/type for dense rows and filter chips. */
  size?: MarketplaceBadgeSize
  /** Selected/filter-active treatment; also sets `aria-pressed` semantics via caller. */
  selected?: boolean
  /** Optional leading icon supplied by the caller. */
  icon?: React.ReactNode
}

function marketplaceBadgeClass(
  modifier: string,
  size: MarketplaceBadgeSize,
  selected: boolean,
  className?: string,
) {
  return cn(
    "troc-market-badge",
    modifier,
    size === "compact" && "troc-market-badge--compact",
    selected && "troc-market-badge--selected",
    className,
  )
}

export type CardCondition = "NM" | "LP" | "MP" | "HP" | "DMG"

export interface ConditionBadgeProps extends BaseMarketplaceBadgeProps {
  condition: CardCondition
}

/**
 * Card condition badge (NM/LP/MP/HP/DMG). The grade is carried by text and a
 * per-grade shape/weight, never colour alone, so it stays legible in any theme.
 */
const ConditionBadge = React.forwardRef<HTMLSpanElement, ConditionBadgeProps>(
  ({ className, condition, label, size = "default", selected = false, icon, ...props }, ref) => (
    <Badge
      ref={ref}
      variant={selected ? "accent" : "outline"}
      className={marketplaceBadgeClass(
        cn("troc-condition", `troc-condition--${condition.toLowerCase()}`),
        size,
        selected,
        className,
      )}
      data-condition={condition}
      {...props}
    >
      {icon ?? <span className="troc-condition-grade" aria-hidden="true">{condition}</span>}
      <span className="troc-market-badge-label">{label}</span>
    </Badge>
  ),
)
ConditionBadge.displayName = "ConditionBadge"

/** Language badge (e.g. English, Français, 日本語). */
const LanguageBadge = React.forwardRef<HTMLSpanElement, BaseMarketplaceBadgeProps>(
  ({ className, label, size = "default", selected = false, icon, ...props }, ref) => (
    <Badge
      ref={ref}
      variant={selected ? "accent" : "neutral"}
      className={marketplaceBadgeClass("troc-lang-badge", size, selected, className)}
      {...props}
    >
      {icon ?? null}
      <span className="troc-market-badge-label">{label}</span>
    </Badge>
  ),
)
LanguageBadge.displayName = "LanguageBadge"

/** Game badge (e.g. Pokémon, Magic: The Gathering). */
const GameBadge = React.forwardRef<HTMLSpanElement, BaseMarketplaceBadgeProps>(
  ({ className, label, size = "default", selected = false, icon, ...props }, ref) => (
    <Badge
      ref={ref}
      variant={selected ? "accent" : "neutral"}
      className={marketplaceBadgeClass("troc-game-badge", size, selected, className)}
      {...props}
    >
      {icon ?? null}
      <span className="troc-market-badge-label">{label}</span>
    </Badge>
  ),
)
GameBadge.displayName = "GameBadge"

/** Set badge (e.g. Base Set, Paldea Evolved). */
const SetBadge = React.forwardRef<HTMLSpanElement, BaseMarketplaceBadgeProps>(
  ({ className, label, size = "default", selected = false, icon, ...props }, ref) => (
    <Badge
      ref={ref}
      variant={selected ? "accent" : "outline"}
      className={marketplaceBadgeClass("troc-set-badge", size, selected, className)}
      {...props}
    >
      {icon ?? null}
      <span className="troc-market-badge-label">{label}</span>
    </Badge>
  ),
)
SetBadge.displayName = "SetBadge"

/** Variant badge (e.g. Holo, Reverse Holo, 1st Edition). */
const VariantBadge = React.forwardRef<HTMLSpanElement, BaseMarketplaceBadgeProps>(
  ({ className, label, size = "default", selected = false, icon, ...props }, ref) => (
    <Badge
      ref={ref}
      variant={selected ? "accent" : "outline"}
      className={marketplaceBadgeClass("troc-variant-badge", size, selected, className)}
      {...props}
    >
      {icon ?? null}
      <span className="troc-market-badge-label">{label}</span>
    </Badge>
  ),
)
VariantBadge.displayName = "VariantBadge"

export { ConditionBadge, LanguageBadge, GameBadge, SetBadge, VariantBadge }
