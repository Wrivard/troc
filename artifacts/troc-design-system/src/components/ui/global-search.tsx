"use client"

import * as React from "react"
import { AlertCircle, Layers, LoaderCircle, Search, X } from "lucide-react"

import { cn } from "../../lib/utils"
import { Button } from "./button"
import { Input } from "./input"

export interface GlobalSearchSuggestion {
  value: string
  title: string
  /** Secondary metadata line (e.g. set · number · lowest price). */
  meta?: string
  /** Optional group heading this suggestion belongs to. */
  group?: string
  disabled?: boolean
}

export interface GlobalSearchProps {
  /** Plain search exposes no suggestion popup or combobox semantics. */
  mode?: "autocomplete" | "plain"
  id?: string
  /** Accessible name for the search input. */
  label: string
  placeholder: string
  /** Controlled query text. */
  value: string
  onValueChange: (value: string) => void
  suggestions: GlobalSearchSuggestion[]
  onSelect?: (suggestion: GlobalSearchSuggestion) => void
  /** Fired when the search action / Enter with no active option is used. */
  onSubmit?: (query: string) => void
  loading?: boolean
  /** Error message; when set, an error row replaces the suggestions. */
  error?: string | null
  loadingLabel: string
  emptyLabel: string
  clearLabel: string
  submitLabel: string
  disabled?: boolean
  className?: string
}

const GlobalSearch = React.forwardRef<HTMLInputElement, GlobalSearchProps>(
  (
    {
      id,
      mode = "autocomplete",
      label,
      placeholder,
      value,
      onValueChange,
      suggestions,
      onSelect,
      onSubmit,
      loading = false,
      error = null,
      loadingLabel,
      emptyLabel,
      clearLabel,
      submitLabel,
      disabled = false,
      className,
    },
    ref
  ) => {
    const reactId = React.useId()
    const inputId = id ?? reactId
    const listId = `${inputId}-list`
    const [open, setOpen] = React.useState(false)
    const [active, setActive] = React.useState(-1)
    const rootRef = React.useRef<HTMLDivElement>(null)
    const innerRef = React.useRef<HTMLInputElement | null>(null)

    const setInputRef = (node: HTMLInputElement | null) => {
      innerRef.current = node
      if (typeof ref === "function") ref(node)
      else if (ref) (ref as React.MutableRefObject<HTMLInputElement | null>).current = node
    }

    const enabled = suggestions.flatMap((s, i) => (s.disabled ? [] : [i]))
    const hasQuery = value.trim().length > 0
    const showPopup = mode === "autocomplete" && open && hasQuery
    const activeOption = active >= 0 ? suggestions[active] : undefined

    React.useEffect(() => {
      if (!showPopup) return
      const outside = (event: PointerEvent) => {
        if (!rootRef.current?.contains(event.target as Node)) setOpen(false)
      }
      document.addEventListener("pointerdown", outside)
      return () => document.removeEventListener("pointerdown", outside)
    }, [showPopup])

    React.useEffect(() => {
      if (activeOption) document.getElementById(`${listId}-${active}`)?.scrollIntoView({ block: "nearest" })
    }, [active, activeOption, listId])

    const choose = (suggestion: GlobalSearchSuggestion) => {
      if (suggestion.disabled) return
      onSelect?.(suggestion)
      setOpen(false)
      setActive(-1)
      innerRef.current?.focus()
    }

    const move = (dir: 1 | -1) => {
      if (!enabled.length) return
      setOpen(true)
      const pos = enabled.indexOf(active)
      const next =
        dir === 1
          ? enabled[(pos + 1) % enabled.length]
          : enabled[pos < 0 ? enabled.length - 1 : (pos - 1 + enabled.length) % enabled.length]
      setActive(next ?? -1)
    }

    const onKeyDown = (event: React.KeyboardEvent<HTMLInputElement>) => {
      if (mode === "autocomplete" && event.key === "ArrowDown") {
        event.preventDefault()
        move(1)
      } else if (mode === "autocomplete" && event.key === "ArrowUp") {
        event.preventDefault()
        move(-1)
      } else if (event.key === "Enter") {
        if (showPopup && activeOption) {
          event.preventDefault()
          choose(activeOption)
        } else {
          onSubmit?.(value)
          setOpen(false)
        }
      } else if (event.key === "Escape") {
        if (showPopup) {
          event.preventDefault()
          setOpen(false)
          setActive(-1)
        }
      }
    }

    // Render suggestions with optional group headings, preserving list order.
    const rows: React.ReactNode[] = []
    let lastGroup: string | undefined
    suggestions.forEach((suggestion, index) => {
      if (suggestion.group && suggestion.group !== lastGroup) {
        lastGroup = suggestion.group
        rows.push(
          <li key={`group-${suggestion.group}`} role="presentation" className="troc-global-search-group-label">
            {suggestion.group}
          </li>
        )
      }
      rows.push(
        <li
          key={suggestion.value}
          id={`${listId}-${index}`}
          role="option"
          aria-selected={index === active}
          aria-disabled={suggestion.disabled || undefined}
          data-active={index === active || undefined}
          className="troc-search-option"
          onPointerDown={(event) => event.preventDefault()}
          onPointerMove={() => !suggestion.disabled && setActive(index)}
          onClick={() => choose(suggestion)}
        >
          <span className="troc-search-option-thumb" aria-hidden="true">
            <Layers />
          </span>
          <span className="troc-search-option-text">
            <span className="troc-search-option-title">{suggestion.title}</span>
            {suggestion.meta && <span className="troc-search-option-meta">{suggestion.meta}</span>}
          </span>
        </li>
      )
    })

    return (
      <div ref={rootRef} className={cn("troc-global-search", className)} role="search">
        <div className="troc-global-search-control">
          <span className="troc-global-search-icon" aria-hidden="true">
            <Search />
          </span>
          <Input
            ref={setInputRef}
            id={inputId}
            type={mode === "plain" ? "search" : "text"}
            role={mode === "plain" ? "searchbox" : "combobox"}
            className="troc-global-search-field"
            aria-label={label}
            aria-expanded={mode === "autocomplete" ? showPopup : undefined}
            aria-controls={showPopup ? listId : undefined}
            aria-autocomplete={mode === "autocomplete" ? "list" : undefined}
            aria-activedescendant={mode === "autocomplete" && activeOption ? `${listId}-${active}` : undefined}
            aria-busy={loading || undefined}
            autoComplete="off"
            placeholder={placeholder}
            disabled={disabled}
            value={value}
            onChange={(event) => {
              onValueChange(event.target.value)
              setOpen(true)
              setActive(-1)
            }}
            onFocus={() => hasQuery && setOpen(true)}
            onKeyDown={onKeyDown}
          />
          {loading && (
            <span className="troc-global-search-spinner" aria-hidden="true">
              <LoaderCircle className="troc-loading" />
            </span>
          )}
          {hasQuery && !loading && (
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="troc-global-search-clear"
              aria-label={clearLabel}
              disabled={disabled}
              onClick={() => {
                onValueChange("")
                setOpen(false)
                setActive(-1)
                innerRef.current?.focus()
              }}
            >
              <X aria-hidden="true" />
            </Button>
          )}
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="troc-global-search-submit"
            aria-label={submitLabel}
            disabled={disabled}
            onClick={() => {
              onSubmit?.(value)
              setOpen(false)
            }}
          >
            <Search aria-hidden="true" />
          </Button>
        </div>
        {showPopup && (
          <div className="troc-global-search-popup">
            {error ? (
              <p role="alert" className="troc-global-search-message troc-global-search-message--error">
                <AlertCircle aria-hidden="true" />
                {error}
              </p>
            ) : loading ? (
              <p role="status" className="troc-global-search-message">
                {loadingLabel}
              </p>
            ) : suggestions.length === 0 ? (
              <p role="status" className="troc-global-search-message">
                {emptyLabel}
              </p>
            ) : (
              <ul id={listId} role="listbox" aria-label={label} className="troc-global-search-listbox">
                {rows}
              </ul>
            )}
          </div>
        )}
      </div>
    )
  }
)
GlobalSearch.displayName = "GlobalSearch"

export { GlobalSearch }
