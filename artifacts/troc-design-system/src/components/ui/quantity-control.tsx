"use client"

import * as React from "react"
import { Minus, Plus } from "lucide-react"

import { cn } from "../../lib/utils"
import { Button } from "./button"
import { Input } from "./input"

export interface QuantityControlProps {
  /** Controlled value. */
  value?: number
  /** Uncontrolled initial value. */
  defaultValue?: number
  onValueChange?: (value: number) => void
  min?: number
  max?: number
  step?: number
  disabled?: boolean
  invalid?: boolean
  compact?: boolean
  /** Accessible name for the numeric input. */
  label: string
  decrementLabel: string
  incrementLabel: string
  id?: string
  name?: string
  className?: string
  "aria-describedby"?: string
}

const clamp = (value: number, min: number, max: number) =>
  Math.min(Math.max(value, min), max)

const QuantityControl = React.forwardRef<HTMLDivElement, QuantityControlProps>(
  (
    {
      value,
      defaultValue,
      onValueChange,
      min = 1,
      max = 99,
      step = 1,
      disabled = false,
      invalid = false,
      compact = false,
      label,
      decrementLabel,
      incrementLabel,
      id,
      name,
      className,
      ...props
    },
    ref
  ) => {
    const isControlled = value !== undefined
    const [internal, setInternal] = React.useState(() =>
      clamp(defaultValue ?? min, min, max)
    )
    const current = isControlled ? clamp(value as number, min, max) : internal
    // Local draft so users can clear/retype the field before it is committed.
    const [draft, setDraft] = React.useState<string>(String(current))

    React.useEffect(() => {
      setDraft(String(current))
    }, [current])

    const commit = (next: number) => {
      const clamped = clamp(next, min, max)
      if (!isControlled) setInternal(clamped)
      onValueChange?.(clamped)
      setDraft(String(clamped))
    }

    const atMin = current <= min
    const atMax = current >= max

    return (
      <div
        ref={ref}
        className={cn("troc-quantity", compact && "troc-quantity--compact", className)}
        data-disabled={disabled || undefined}
        data-invalid={invalid || undefined}
      >
        <Button
          type="button"
          variant="ghost"
          size="icon"
          className="troc-quantity-step"
          aria-label={decrementLabel}
          disabled={disabled || atMin}
          onClick={() => commit(current - step)}
        >
          <Minus aria-hidden="true" />
        </Button>
        <Input
          id={id}
          name={name}
          className="troc-quantity-field"
          type="number"
          inputMode="numeric"
          aria-label={label}
          aria-invalid={invalid || undefined}
          min={min}
          max={max}
          step={step}
          disabled={disabled}
          value={draft}
          onChange={(event) => setDraft(event.target.value)}
          onBlur={() => {
            const parsed = Number(draft)
            commit(Number.isNaN(parsed) || draft.trim() === "" ? current : parsed)
          }}
          onKeyDown={(event) => {
            if (event.key === "Enter") {
              event.preventDefault()
              const parsed = Number(draft)
              commit(Number.isNaN(parsed) || draft.trim() === "" ? current : parsed)
            }
          }}
          {...props}
        />
        <Button
          type="button"
          variant="ghost"
          size="icon"
          className="troc-quantity-step"
          aria-label={incrementLabel}
          disabled={disabled || atMax}
          onClick={() => commit(current + step)}
        >
          <Plus aria-hidden="true" />
        </Button>
      </div>
    )
  }
)
QuantityControl.displayName = "QuantityControl"

export { QuantityControl }
