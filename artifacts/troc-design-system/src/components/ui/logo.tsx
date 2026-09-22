"use client"

import * as React from "react"

import { cn } from "../../lib/utils"
// Package-safe bundled copies of the supplied raster artwork. These are the
// faithful supplied lockups — never redrawn, restyled, or typeset. Importing
// them from src/assets keeps the component self-contained for consumers that
// do not ship public/brand files.
import logoForDark from "../../assets/brand/troc-dark.png"
import logoForLight from "../../assets/brand/troc-light.png"
import logoMono from "../../assets/brand/troc-mono.png"
import wordmark from "../../assets/brand/troc-wordmark.png"
import leaf from "../../assets/brand/troc-leaf.png"

export type TrocLogoVariant =
  | "auto"
  | "dark"
  | "light"
  | "mono"
  | "wordmark"
  | "compact"

export interface TrocLogoProps
  extends Omit<React.HTMLAttributes<HTMLSpanElement>, "children"> {
  /**
   * Which artwork to present:
   * - `auto` (default): resolves the dark/light artwork from the nearest theme
   *   boundary so nested theme regions render correctly.
   * - `dark` / `light`: force the artwork made for that background.
   * - `mono`: single-colour lockup.
   * - `wordmark`: wordmark-plus-leaf lockup crop.
   * - `compact`: leaf-only mark for tight spaces.
   */
  variant?: TrocLogoVariant
  /** Rendered height in px; width follows the intrinsic aspect ratio. */
  height?: number
  /** Accessible name. Provide a localized value; defaults to "TROC". */
  label?: string
  /** Reserve one leaf-width of clear space around the lockup. */
  clearSpace?: boolean
}

const TrocLogo = React.forwardRef<HTMLSpanElement, TrocLogoProps>(
  (
    {
      className,
      variant = "auto",
      height = 28,
      label = "TROC",
      clearSpace = false,
      style,
      ...props
    },
    ref
  ) => {
    // Resolve the effective theme from the nearest .dark/.light boundary. This
    // is provider-independent and nested-safe: a light island inside a dark
    // page resolves to light because closest() stops at the first boundary.
    const rootRef = React.useRef<HTMLSpanElement | null>(null)
    const setRefs = (node: HTMLSpanElement | null) => {
      rootRef.current = node
      if (typeof ref === "function") ref(node)
      else if (ref) (ref as React.MutableRefObject<HTMLSpanElement | null>).current = node
    }
    const [resolved, setResolved] = React.useState<"dark" | "light">("dark")

    React.useEffect(() => {
      if (variant !== "auto") return
      const node = rootRef.current
      if (!node) return
      const compute = () => {
        const boundary = node.closest(".dark, .light")
        setResolved(boundary?.classList.contains("light") ? "light" : "dark")
      }
      compute()
      // React to theme-class changes on the document element (theme switching).
      const observer = new MutationObserver(compute)
      observer.observe(document.documentElement, {
        attributes: true,
        attributeFilter: ["class", "data-theme"],
      })
      return () => observer.disconnect()
    }, [variant])

    const rootStyle: React.CSSProperties = {
      ["--troc-logo-height" as string]: `${height}px`,
      ...style,
    }
    const commonClass = cn(
      "troc-logo",
      clearSpace && "troc-logo--clearspace",
      className
    )

    if (variant === "auto") {
      return (
        <span
          ref={setRefs}
          className={cn(
            commonClass,
            "troc-logo--auto",
            resolved === "light" ? "is-light" : "is-dark"
          )}
          style={rootStyle}
          role="img"
          aria-label={label}
          {...props}
        >
          <span className="troc-logo-stack">
            <img className="troc-logo-img" data-for="dark" src={logoForDark} alt="" aria-hidden="true" draggable={false} />
            <img className="troc-logo-img" data-for="light" src={logoForLight} alt="" aria-hidden="true" draggable={false} />
          </span>
        </span>
      )
    }

    const src =
      variant === "dark"
        ? logoForDark
        : variant === "light"
          ? logoForLight
          : variant === "mono"
            ? logoMono
            : variant === "wordmark"
              ? wordmark
              : leaf

    return (
      <span
        ref={setRefs}
        className={cn(commonClass, variant === "mono" && "troc-logo--mono")}
        style={rootStyle}
        {...props}
      >
        <img className="troc-logo-img" src={src} alt={label} draggable={false} />
      </span>
    )
  }
)
TrocLogo.displayName = "TrocLogo"

export { TrocLogo }
