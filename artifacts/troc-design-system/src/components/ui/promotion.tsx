"use client"

import * as React from "react"

import { cn } from "../../lib/utils"
import { Badge } from "./badge-status"
import { Button } from "./button"

export type PromotionState = "active" | "eligible" | "locked" | "expired"

/** Promotion state → approved Badge variant. Only active uses the accent red. */
const STATE_VARIANT: Record<PromotionState, React.ComponentProps<typeof Badge>["variant"]> = {
  active: "accent",
  eligible: "positive",
  locked: "neutral",
  expired: "outline",
}

export interface PromotionBadgeProps
  extends Omit<React.HTMLAttributes<HTMLSpanElement>, "children"> {
  /** Translated promotion label, e.g. "10% off". */
  label: string
  /** Visual + semantic state; meaning is carried by text and a state note, not colour. */
  state?: PromotionState
  /** Optional leading icon supplied by the caller. */
  icon?: React.ReactNode
  /** Optional translated screen-reader state suffix, e.g. "expired". */
  stateLabel?: string
}

/**
 * Compact promotion badge. State maps to an approved Badge variant; the
 * optional `stateLabel` keeps the meaning available to assistive tech.
 */
const PromotionBadge = React.forwardRef<HTMLSpanElement, PromotionBadgeProps>(
  ({ className, label, state = "active", icon, stateLabel, ...props }, ref) => (
    <Badge
      ref={ref}
      variant={STATE_VARIANT[state]}
      className={cn("troc-promotion-badge", `troc-promotion-badge--${state}`, className)}
      data-promotion-state={state}
      {...props}
    >
      {icon ?? null}
      <span className="troc-promotion-badge-label">{label}</span>
      {stateLabel ? <span className="troc-seller-rating-sr"> · {stateLabel}</span> : null}
    </Badge>
  ),
)
PromotionBadge.displayName = "PromotionBadge"

export interface PromotionCardAction {
  /** Translated button label. */
  label: string
  onClick?: () => void
  loading?: boolean
  disabled?: boolean
}

export interface PromotionCardProps
  extends Omit<React.HTMLAttributes<HTMLDivElement>, "title"> {
  /** Translated promotion heading, e.g. "10% off 5+ cards". */
  heading: string
  /** Translated concise terms. */
  terms: string
  state?: PromotionState
  /** Translated state badge label (e.g. "Active"). */
  stateBadgeLabel: string
  /**
   * Translated status line describing what the buyer must do or has achieved,
   * e.g. "Add 3 more cards to unlock 10% off".
   */
  statusLabel?: string
  /** Optional progress node (e.g. a `PromotionProgress`) rendered in the card. */
  progress?: React.ReactNode
  /** Optional primary action. Rendered as a real Button. */
  action?: PromotionCardAction
  /** Optional leading icon for the heading row. */
  icon?: React.ReactNode
}

/**
 * Seller promotion card. Restrained composition on Badge, Button, and an
 * optional progress node. All copy is translated and passed in; no promotion is
 * ever applied or persisted.
 */
const PromotionCard = React.forwardRef<HTMLDivElement, PromotionCardProps>(
  ({ className, heading, terms, state = "eligible", stateBadgeLabel, statusLabel, progress, action, icon, ...props }, ref) => (
    <div
      ref={ref}
      className={cn("troc-promotion-card", `troc-promotion-card--${state}`, className)}
      data-promotion-state={state}
      {...props}
    >
      <div className="troc-promotion-card-head">
        <div className="troc-promotion-card-heading">
          {icon ? <span className="troc-promotion-card-icon" aria-hidden="true">{icon}</span> : null}
          <span className="troc-promotion-card-title">{heading}</span>
        </div>
        <PromotionBadge label={stateBadgeLabel} state={state} />
      </div>
      <p className="troc-promotion-card-terms">{terms}</p>
      {progress ? <div className="troc-promotion-card-progress">{progress}</div> : null}
      {(statusLabel || action) && (
        <div className="troc-promotion-card-foot">
          {statusLabel ? <span className="troc-promotion-card-status">{statusLabel}</span> : null}
          {action ? (
            <Button
              size="sm"
              variant={state === "expired" ? "outline" : state === "active" ? "primary" : "secondary"}
              onClick={action.onClick}
              loading={action.loading}
              disabled={action.disabled || state === "expired"}
              className="troc-promotion-card-action"
            >
              {action.label}
            </Button>
          ) : null}
        </div>
      )}
    </div>
  ),
)
PromotionCard.displayName = "PromotionCard"

export { PromotionBadge, PromotionCard }
