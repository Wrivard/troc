"use client"

import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "../../lib/utils"
import { Button } from "./button"

const stateFeedbackVariants = cva("troc-state", {
  variants: {
    variant: {
      empty: "troc-state--empty",
      error: "troc-state--error",
      success: "troc-state--success",
    },
    format: {
      full: "troc-state--full",
      compact: "troc-state--compact",
    },
  },
  defaultVariants: {
    variant: "empty",
    format: "full",
  },
})

export interface StateFeedbackAction {
  /** Translated label. */
  label: string
  onClick: () => void
  disabled?: boolean
  loading?: boolean
}

export interface StateFeedbackProps
  extends Omit<React.HTMLAttributes<HTMLDivElement>, "title">,
    VariantProps<typeof stateFeedbackVariants> {
  /** Meaningful icon supplied by the caller; not colour-only. */
  icon?: React.ReactNode
  title: string
  description?: string
  primaryAction?: StateFeedbackAction
  secondaryAction?: StateFeedbackAction
  children?: React.ReactNode
}

const StateFeedback = React.forwardRef<HTMLDivElement, StateFeedbackProps>(
  ({ className, variant, format, icon, title, description, primaryAction, secondaryAction, children, role, ...props }, ref) => (
    <div
      ref={ref}
      role={role ?? (variant === "error" ? "alert" : "status")}
      className={cn(stateFeedbackVariants({ variant, format }), className)}
      {...props}
    >
      {icon ? <span className="troc-state-icon" aria-hidden="true">{icon}</span> : null}
      <div className="troc-state-body">
        <p className="troc-state-title">{title}</p>
        {description ? <p className="troc-state-description">{description}</p> : null}
        {children}
      </div>
      {(primaryAction || secondaryAction) ? (
        <div className="troc-state-actions">
          {secondaryAction ? (
            <Button
              variant="outline"
              disabled={secondaryAction.disabled}
              loading={secondaryAction.loading}
              onClick={secondaryAction.onClick}
            >
              {secondaryAction.label}
            </Button>
          ) : null}
          {primaryAction ? (
            <Button
              variant={variant === "error" ? "destructive" : "primary"}
              disabled={primaryAction.disabled}
              loading={primaryAction.loading}
              onClick={primaryAction.onClick}
            >
              {primaryAction.label}
            </Button>
          ) : null}
        </div>
      ) : null}
    </div>
  )
)
StateFeedback.displayName = "StateFeedback"

const EmptyState = React.forwardRef<HTMLDivElement, Omit<StateFeedbackProps, "variant">>(
  (props, ref) => <StateFeedback ref={ref} variant="empty" {...props} />
)
EmptyState.displayName = "EmptyState"

const ErrorState = React.forwardRef<HTMLDivElement, Omit<StateFeedbackProps, "variant">>(
  (props, ref) => <StateFeedback ref={ref} variant="error" {...props} />
)
ErrorState.displayName = "ErrorState"

const SuccessState = React.forwardRef<HTMLDivElement, Omit<StateFeedbackProps, "variant">>(
  (props, ref) => <StateFeedback ref={ref} variant="success" {...props} />
)
SuccessState.displayName = "SuccessState"

export { StateFeedback, EmptyState, ErrorState, SuccessState, stateFeedbackVariants }
