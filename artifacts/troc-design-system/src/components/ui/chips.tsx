"use client"

import * as React from "react"
import { X } from "lucide-react"

import { cn } from "../../lib/utils"

interface ChipBaseProps extends React.HTMLAttributes<HTMLElement> {
  /** Selectable filter chip: renders a toggle button and reflects aria-pressed. */
  selectable?: boolean
  selected?: boolean
  disabled?: boolean
  /** Game-chip treatment: leading accent dot. */
  game?: boolean
  onSelectedChange?: (selected: boolean) => void
}

export type ChipProps = ChipBaseProps & (
  | { onRemove: () => void; removeLabel: string }
  | { onRemove?: undefined; removeLabel?: string }
)

const Chip = React.forwardRef<HTMLElement, ChipProps>(
  (
    {
      className,
      children,
      selectable = false,
      selected = false,
      disabled = false,
      game = false,
      onRemove,
      removeLabel,
      onSelectedChange,
      onClick,
      ...props
    },
    ref
  ) => {
    const content = (
      <>
        {game && <span className="troc-chip-dot" aria-hidden="true" />}
        <span>{children}</span>
      </>
    )

    const interactive = selectable || Boolean(onClick)
    const primary = interactive ? (
        <button
          ref={ref as React.Ref<HTMLButtonElement>}
          type="button"
          className={cn("troc-chip", game && "troc-chip--game", className)}
          aria-pressed={selectable ? selected : undefined}
          disabled={disabled}
          onClick={(event) => {
            if (selectable) onSelectedChange?.(!selected)
            onClick?.(event as unknown as React.MouseEvent<HTMLElement>)
          }}
          {...(props as React.ButtonHTMLAttributes<HTMLButtonElement>)}
        >
          {content}
        </button>
      ) : (
      <span
        ref={ref as React.Ref<HTMLSpanElement>}
        className={cn(
          "troc-chip",
          game && "troc-chip--game",
          className
        )}
        aria-disabled={disabled || undefined}
        data-selected={selected || undefined}
        {...props}
      >
        {content}
      </span>
    )
    if (!onRemove) return primary
    return (
      <span className="troc-chip-composite" data-selected={selected || undefined} aria-disabled={disabled || undefined}>
        {primary}
        <button type="button" className="troc-chip-remove" aria-label={removeLabel} disabled={disabled}
          onClick={(event) => { event.stopPropagation(); onRemove() }}>
          <X aria-hidden="true" />
        </button>
      </span>
    )
  }
)
Chip.displayName = "Chip"

export interface ChipGroupProps extends React.HTMLAttributes<HTMLDivElement> {
  /** Accessible group name. */
  label?: string
}

const ChipGroup = React.forwardRef<HTMLDivElement, ChipGroupProps>(
  ({ className, label, children, ...props }, ref) => (
    <div
      ref={ref}
      className={cn("troc-chip-group", className)}
      role="group"
      aria-label={label}
      {...props}
    >
      {children}
    </div>
  )
)
ChipGroup.displayName = "ChipGroup"

export { Chip, ChipGroup }
