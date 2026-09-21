import * as React from "react"
import { Slot } from "@radix-ui/react-slot"
import { cva, type VariantProps } from "class-variance-authority"
import { LoaderCircle } from "lucide-react"

import { cn } from "../../lib/utils"

const buttonVariants = cva(
  "troc-button",
  {
    variants: {
      variant: {
        default: "troc-button--primary",
        primary: "troc-button--primary",
        destructive: "troc-button--destructive",
        outline: "troc-button--outline",
        secondary: "troc-button--secondary",
        ghost: "troc-button--ghost",
        tertiary: "troc-button--ghost",
      },
      size: {
        default: "",
        sm: "troc-button--small",
        lg: "troc-button--large",
        icon: "troc-button--icon",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
)

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean
  loading?: boolean
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, loading = false, disabled, children, onClick, type = "button", ...props }, ref) => {
    const classes = cn(buttonVariants({ variant, size, className }))
    if (asChild) {
      return <Slot ref={ref} className={classes} aria-busy={loading || undefined}
        aria-disabled={disabled || loading || undefined}
        tabIndex={disabled || loading ? -1 : undefined}
        onClick={(event: React.MouseEvent<HTMLButtonElement>) => {
          if (disabled || loading) { event.preventDefault(); return }
          onClick?.(event)
        }} {...props}>{children}</Slot>
    }
    return (
      <button className={classes} ref={ref} type={type} disabled={disabled || loading}
        aria-busy={loading || undefined} onClick={onClick} {...props}>
        {loading && <LoaderCircle className="troc-loading" aria-hidden="true" />}
        {children}
      </button>
    )
  }
)
Button.displayName = "Button"

export { Button, buttonVariants }
