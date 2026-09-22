"use client"

import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "../../lib/utils"

const badgeVariants = cva("troc-badge", {
  variants: {
    variant: {
      neutral: "troc-badge--neutral",
      accent: "troc-badge--accent",
      positive: "troc-badge--positive",
      warning: "troc-badge--warning",
      destructive: "troc-badge--destructive",
      sponsored: "troc-badge--sponsored",
      outline: "troc-badge--outline",
    },
  },
  defaultVariants: {
    variant: "neutral",
  },
})

export interface BadgeProps
  extends React.HTMLAttributes<HTMLSpanElement>,
    VariantProps<typeof badgeVariants> {}

const Badge = React.forwardRef<HTMLSpanElement, BadgeProps>(
  ({ className, variant, ...props }, ref) => (
    <span ref={ref} className={cn(badgeVariants({ variant }), className)} {...props} />
  )
)
Badge.displayName = "Badge"

export type OrderStatus =
  | "pending"
  | "processing"
  | "shipped"
  | "delivered"
  | "cancelled"

export interface OrderStatusBadgeProps
  extends React.HTMLAttributes<HTMLSpanElement> {
  status: OrderStatus
  /** Translated status label; status meaning never relies on colour alone. */
  label: string
  /** Optional leading icon; a dot is used when omitted. */
  icon?: React.ReactNode
}

const OrderStatusBadge = React.forwardRef<HTMLSpanElement, OrderStatusBadgeProps>(
  ({ className, status, label, icon, ...props }, ref) => (
    <span
      ref={ref}
      className={cn("troc-status", `troc-status--${status}`, className)}
      {...props}
    >
      {icon ?? <span className="troc-status-dot" aria-hidden="true" />}
      <span>{label}</span>
    </span>
  )
)
OrderStatusBadge.displayName = "OrderStatusBadge"

export { Badge, badgeVariants, OrderStatusBadge }
