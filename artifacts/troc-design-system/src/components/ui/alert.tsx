"use client"

import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "../../lib/utils"

const alertVariants = cva("troc-alert", {
  variants: {
    variant: {
      neutral: "troc-alert--neutral",
      success: "troc-alert--success",
      warning: "troc-alert--warning",
      error: "troc-alert--error",
    },
  },
  defaultVariants: {
    variant: "neutral",
  },
})

export interface AlertProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof alertVariants> {
  /** Optional leading icon; status meaning is carried by text + icon, never colour alone. */
  icon?: React.ReactNode
  /** Optional trailing content, e.g. an action Button or a dismiss control. */
  action?: React.ReactNode
}

const Alert = React.forwardRef<HTMLDivElement, AlertProps>(
  ({ className, variant, icon, action, role = "status", children, ...props }, ref) => (
    <div
      ref={ref}
      role={role}
      className={cn(alertVariants({ variant }), className)}
      {...props}
    >
      {icon ? <span className="troc-alert-icon" aria-hidden="true">{icon}</span> : null}
      <div className="troc-alert-body">{children}</div>
      {action ? <div className="troc-alert-action">{action}</div> : null}
    </div>
  )
)
Alert.displayName = "Alert"

const AlertTitle = React.forwardRef<
  HTMLParagraphElement,
  React.HTMLAttributes<HTMLHeadingElement>
>(({ className, ...props }, ref) => (
  <p ref={ref} className={cn("troc-alert-title", className)} {...props} />
))
AlertTitle.displayName = "AlertTitle"

const AlertDescription = React.forwardRef<
  HTMLParagraphElement,
  React.HTMLAttributes<HTMLParagraphElement>
>(({ className, ...props }, ref) => (
  <p ref={ref} className={cn("troc-alert-description", className)} {...props} />
))
AlertDescription.displayName = "AlertDescription"

export { Alert, AlertTitle, AlertDescription, alertVariants }
