"use client"

import * as React from "react"
import { Moon, Sun } from "lucide-react"

import { cn } from "../../lib/utils"

export type ThemeValue = "dark" | "light"

export interface ThemeOption {
  value: ThemeValue
  /** Full accessible + visible label, e.g. "TROC Dark" / "TROC Light". */
  label: string
}

export interface ThemeSwitcherProps
  extends Omit<React.HTMLAttributes<HTMLDivElement>, "onChange"> {
  /** Controlled current theme. Provider-independent. */
  value: ThemeValue
  onValueChange: (value: ThemeValue) => void
  options: ThemeOption[]
  /** Accessible group label, e.g. "Theme". */
  groupLabel: string
  /** Hide the text labels, keeping icon + accessible name only. */
  iconOnly?: boolean
  disabled?: boolean
}

const icons: Record<ThemeValue, React.ReactNode> = {
  dark: <Moon aria-hidden="true" />,
  light: <Sun aria-hidden="true" />,
}

const ThemeSwitcher = React.forwardRef<HTMLDivElement, ThemeSwitcherProps>(
  (
    { className, value, onValueChange, options, groupLabel, iconOnly = false, disabled = false, ...props },
    ref
  ) => (
    <div ref={ref} className={cn("troc-theme-switcher", className)} {...props}>
      <div className="troc-theme-segmented" role="group" aria-label={groupLabel}>
        {options.map((option) => {
          const selected = option.value === value
          return (
            <button
              key={option.value}
              type="button"
              className="troc-theme-option"
              aria-pressed={selected}
              aria-label={iconOnly ? option.label : undefined}
              disabled={disabled}
              onClick={() => onValueChange(option.value)}
            >
              {icons[option.value]}
              {!iconOnly && <span>{option.label}</span>}
            </button>
          )
        })}
      </div>
    </div>
  )
)
ThemeSwitcher.displayName = "ThemeSwitcher"

export { ThemeSwitcher }
