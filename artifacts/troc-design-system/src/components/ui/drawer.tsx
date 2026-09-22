"use client"

import * as React from "react"
import { Drawer as DrawerPrimitive } from "vaul"
import { X } from "lucide-react"

import { cn } from "../../lib/utils"

type DrawerDirection = "top" | "bottom" | "left" | "right"

/**
 * Accessible drawer/sheet built on the vaul dialog primitive. `direction`
 * selects bottom-sheet (mobile default) or side-sheet presentation; the value
 * is forwarded to the content element for placement styling.
 */
const Drawer = ({
  shouldScaleBackground = false,
  direction = "bottom",
  autoFocus = true,
  ...props
}: React.ComponentProps<typeof DrawerPrimitive.Root>) => (
  <DrawerPrimitive.Root
    shouldScaleBackground={shouldScaleBackground}
    direction={direction}
    autoFocus={autoFocus}
    {...props}
  />
)
Drawer.displayName = "Drawer"

const DrawerTrigger = DrawerPrimitive.Trigger

const DrawerPortal = DrawerPrimitive.Portal

const DrawerClose = DrawerPrimitive.Close

const DrawerOverlay = React.forwardRef<
  React.ElementRef<typeof DrawerPrimitive.Overlay>,
  React.ComponentPropsWithoutRef<typeof DrawerPrimitive.Overlay>
>(({ className, ...props }, ref) => (
  <DrawerPrimitive.Overlay ref={ref} className={cn("troc-overlay", className)} {...props} />
))
DrawerOverlay.displayName = "DrawerOverlay"

type DrawerContentBaseProps = React.ComponentPropsWithoutRef<typeof DrawerPrimitive.Content> & {
  /** Placement of the sheet; matches the Drawer `direction`. */
  side?: DrawerDirection
  /** Show the drag handle (bottom sheets). Defaults on for bottom/top. */
  showHandle?: boolean
}

/**
 * When the built-in top-right close control is shown (the default), a
 * translated `closeLabel` is required — there is no buried English fallback.
 * Opt out with `hideClose: true`, which frees the caller from `closeLabel`.
 */
type DrawerContentProps = DrawerContentBaseProps &
  (
    | {
        /** Visible/screen-reader label for the built-in close control. Required. */
        closeLabel: string
        hideClose?: false
      }
    | {
        /** Hide the built-in top-right close control (caller renders its own). */
        hideClose: true
        closeLabel?: string
      }
  )

const DrawerContent = React.forwardRef<
  React.ElementRef<typeof DrawerPrimitive.Content>,
  DrawerContentProps
>(({ className, children, side = "bottom", closeLabel, hideClose = false, showHandle, ...props }, ref) => {
  const handleVisible = showHandle ?? (side === "bottom" || side === "top")
  return (
    <DrawerPortal>
      <DrawerOverlay />
      <DrawerPrimitive.Content
        ref={ref}
        data-side={side}
        className={cn("troc-drawer", className)}
        {...props}
      >
        {handleVisible && <div className="troc-drawer-handle" aria-hidden="true" />}
        {children}
        {!hideClose && (
          <DrawerPrimitive.Close className="troc-dialog-close" aria-label={closeLabel}>
            <X aria-hidden="true" />
          </DrawerPrimitive.Close>
        )}
      </DrawerPrimitive.Content>
    </DrawerPortal>
  )
})
DrawerContent.displayName = "DrawerContent"

const DrawerHeader = ({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) => (
  <div className={cn("troc-drawer-header", className)} {...props} />
)
DrawerHeader.displayName = "DrawerHeader"

const DrawerFooter = ({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) => (
  <div className={cn("troc-drawer-footer", className)} {...props} />
)
DrawerFooter.displayName = "DrawerFooter"

const DrawerTitle = React.forwardRef<
  React.ElementRef<typeof DrawerPrimitive.Title>,
  React.ComponentPropsWithoutRef<typeof DrawerPrimitive.Title>
>(({ className, ...props }, ref) => (
  <DrawerPrimitive.Title ref={ref} className={cn("troc-dialog-title", className)} {...props} />
))
DrawerTitle.displayName = "DrawerTitle"

const DrawerDescription = React.forwardRef<
  React.ElementRef<typeof DrawerPrimitive.Description>,
  React.ComponentPropsWithoutRef<typeof DrawerPrimitive.Description>
>(({ className, ...props }, ref) => (
  <DrawerPrimitive.Description ref={ref} className={cn("troc-dialog-description", className)} {...props} />
))
DrawerDescription.displayName = "DrawerDescription"

export {
  Drawer,
  DrawerTrigger,
  DrawerPortal,
  DrawerOverlay,
  DrawerContent,
  DrawerHeader,
  DrawerFooter,
  DrawerTitle,
  DrawerDescription,
  DrawerClose,
}
