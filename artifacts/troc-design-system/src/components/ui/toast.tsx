"use client"

import * as React from "react"
import * as ToastPrimitives from "@radix-ui/react-toast"
import { cva, type VariantProps } from "class-variance-authority"
import { X } from "lucide-react"

import { cn } from "../../lib/utils"

const ToastProvider = ToastPrimitives.Provider

const ToastViewport = React.forwardRef<
  React.ElementRef<typeof ToastPrimitives.Viewport>,
  React.ComponentPropsWithoutRef<typeof ToastPrimitives.Viewport>
>(({ className, ...props }, ref) => (
  <ToastPrimitives.Viewport
    ref={ref}
    className={cn("troc-toast-viewport", className)}
    {...props}
  />
))
ToastViewport.displayName = ToastPrimitives.Viewport.displayName

const toastVariants = cva("troc-toast", {
  variants: {
    variant: {
      neutral: "troc-toast--neutral",
      success: "troc-toast--success",
      warning: "troc-toast--warning",
      error: "troc-toast--error",
    },
  },
  defaultVariants: {
    variant: "neutral",
  },
})

const Toast = React.forwardRef<
  React.ElementRef<typeof ToastPrimitives.Root>,
  React.ComponentPropsWithoutRef<typeof ToastPrimitives.Root> &
    VariantProps<typeof toastVariants>
>(({ className, variant, ...props }, ref) => (
  <ToastPrimitives.Root
    ref={ref}
    className={cn(toastVariants({ variant }), className)}
    {...props}
  />
))
Toast.displayName = ToastPrimitives.Root.displayName

const ToastTitle = React.forwardRef<
  React.ElementRef<typeof ToastPrimitives.Title>,
  React.ComponentPropsWithoutRef<typeof ToastPrimitives.Title>
>(({ className, ...props }, ref) => (
  <ToastPrimitives.Title
    ref={ref}
    className={cn("troc-toast-title", className)}
    {...props}
  />
))
ToastTitle.displayName = ToastPrimitives.Title.displayName

const ToastDescription = React.forwardRef<
  React.ElementRef<typeof ToastPrimitives.Description>,
  React.ComponentPropsWithoutRef<typeof ToastPrimitives.Description>
>(({ className, ...props }, ref) => (
  <ToastPrimitives.Description
    ref={ref}
    className={cn("troc-toast-description", className)}
    {...props}
  />
))
ToastDescription.displayName = ToastPrimitives.Description.displayName

const ToastAction = React.forwardRef<
  React.ElementRef<typeof ToastPrimitives.Action>,
  React.ComponentPropsWithoutRef<typeof ToastPrimitives.Action>
>(({ className, ...props }, ref) => (
  <ToastPrimitives.Action
    ref={ref}
    className={cn("troc-toast-action", className)}
    {...props}
  />
))
ToastAction.displayName = ToastPrimitives.Action.displayName

const ToastClose = React.forwardRef<
  React.ElementRef<typeof ToastPrimitives.Close>,
  React.ComponentPropsWithoutRef<typeof ToastPrimitives.Close>
>(({ className, children, ...props }, ref) => (
  <ToastPrimitives.Close
    ref={ref}
    className={cn("troc-toast-close", className)}
    toast-close=""
    {...props}
  >
    {children ?? <X aria-hidden="true" />}
  </ToastPrimitives.Close>
))
ToastClose.displayName = ToastPrimitives.Close.displayName

type ToastVariant = NonNullable<VariantProps<typeof toastVariants>["variant"]>

export interface ToastData {
  id: string
  title: string
  description?: string
  variant?: ToastVariant
  duration?: number
  /** Translated label for the optional action button. */
  actionLabel?: string
  onAction?: () => void
  /** Translated accessible label for the close control. */
  closeLabel?: string
}

type ToastContextValue = {
  toasts: ToastData[]
  toast: (data: Omit<ToastData, "id"> & { id?: string }) => string
  dismiss: (id: string) => void
}

const ToastContext = React.createContext<ToastContextValue | null>(null)

let toastCounter = 0

/**
 * Headless toast state provider. Wrap it in a `ToastProvider` (Radix) via
 * `Toaster` at composition level. Copy is supplied by the caller; this module
 * never embeds user-facing English.
 */
export function ToastControllerProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = React.useState<ToastData[]>([])

  const dismiss = React.useCallback((id: string) => {
    setToasts((current) => current.filter((item) => item.id !== id))
  }, [])

  const toast = React.useCallback((data: Omit<ToastData, "id"> & { id?: string }) => {
    const id = data.id ?? `troc-toast-${++toastCounter}`
    setToasts((current) => [...current, { ...data, id }])
    return id
  }, [])

  const value = React.useMemo(() => ({ toasts, toast, dismiss }), [toasts, toast, dismiss])

  return <ToastContext.Provider value={value}>{children}</ToastContext.Provider>
}

export function useToast() {
  const context = React.useContext(ToastContext)
  if (!context) {
    throw new Error("useToast must be used within a ToastControllerProvider (Toaster).")
  }
  return context
}

/**
 * Mounts the Radix provider, renders the live toast queue, and the viewport.
 * A translated `closeLabel` is required so the close control always has an
 * accessible name; a per-toast `ToastData.closeLabel` overrides it. Provide
 * `swipeDirection`/`duration` overrides as needed. Wrap with
 * `ToastControllerProvider` (or use it above `Toaster`) so `useToast` resolves.
 */
export function Toaster({
  closeLabel,
  swipeDirection = "right",
  duration = 5000,
}: {
  /** Translated default accessible label for every toast's close control. */
  closeLabel: string
  swipeDirection?: React.ComponentProps<typeof ToastProvider>["swipeDirection"]
  duration?: number
}) {
  const { toasts, dismiss } = useToast()
  return (
    <ToastProvider swipeDirection={swipeDirection} duration={duration}>
      {toasts.map(({ id, title, description, variant, duration: itemDuration, actionLabel, onAction, closeLabel: itemCloseLabel }) => (
        <Toast
          key={id}
          variant={variant}
          duration={itemDuration}
          onOpenChange={(open) => {
            if (!open) dismiss(id)
          }}
        >
          <div className="troc-toast-body">
            <ToastTitle>{title}</ToastTitle>
            {description ? <ToastDescription>{description}</ToastDescription> : null}
          </div>
          {actionLabel ? (
            <ToastAction altText={actionLabel} onClick={onAction}>
              {actionLabel}
            </ToastAction>
          ) : null}
          <ToastClose aria-label={itemCloseLabel ?? closeLabel} />
        </Toast>
      ))}
      <ToastViewport />
    </ToastProvider>
  )
}

export {
  ToastProvider,
  ToastViewport,
  Toast,
  ToastTitle,
  ToastDescription,
  ToastAction,
  ToastClose,
  toastVariants,
}
