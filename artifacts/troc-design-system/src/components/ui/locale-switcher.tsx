"use client"

import * as React from "react"
import { Globe } from "lucide-react"

import { cn } from "../../lib/utils"

export type LocaleValue = "en" | "fr"

export interface LocaleOption {
  value: LocaleValue
  /** Short code shown in the control, e.g. "EN" / "FR". */
  code: string
  /** Full accessible label, e.g. "English" / "Français". */
  label: string
}

export interface LocaleSwitcherProps
  extends Omit<React.HTMLAttributes<HTMLDivElement>, "onChange"> {
  /** Controlled current locale. Provider-independent. */
  value: LocaleValue
  onValueChange: (value: LocaleValue) => void
  options: LocaleOption[]
  /** Accessible group label, e.g. "Language". */
  groupLabel: string
  disabled?: boolean
}

const LocaleSwitcher = React.forwardRef<HTMLDivElement, LocaleSwitcherProps>(
  ({ className, value, onValueChange, options, groupLabel, disabled = false, ...props }, ref) => (
    <div ref={ref} className={cn("troc-locale-switcher", className)} {...props}>
      <div className="troc-locale-segmented" role="group" aria-label={groupLabel}>
        {options.map((option) => {
          const selected = option.value === value
          return (
            <button
              key={option.value}
              type="button"
              className="troc-locale-option"
              aria-pressed={selected}
              aria-label={option.label}
              disabled={disabled}
              onClick={() => onValueChange(option.value)}
            >
              {option.value === value && <Globe aria-hidden="true" />}
              <span className="troc-locale-code">{option.code}</span>
            </button>
          )
        })}
      </div>
    </div>
  )
)
LocaleSwitcher.displayName = "LocaleSwitcher"

export { LocaleSwitcher }
