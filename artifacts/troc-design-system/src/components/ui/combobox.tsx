import { useEffect, useId, useRef, useState, type KeyboardEvent } from "react";
import { Check, ChevronDown, LoaderCircle } from "lucide-react";
import { Input } from "./input";
import { Button } from "./button";
import { cn } from "../../lib/utils";

export interface ComboboxOption { value: string; label: string; disabled?: boolean }
export interface ComboboxProps {
  id?: string;
  name?: string;
  options: ComboboxOption[];
  value?: string;
  defaultValue?: string;
  onValueChange?: (value: string) => void;
  placeholder: string;
  label: string;
  toggleLabel: string;
  emptyLabel: string;
  loadingLabel: string;
  disabled?: boolean;
  loading?: boolean;
  required?: boolean;
  invalid?: boolean;
  describedBy?: string;
  className?: string;
}

/** Editable, select-only-value ARIA combobox. Focus remains on the input. */
export function Combobox({
  id, name, options, value, defaultValue = "", onValueChange, placeholder, label,
  toggleLabel, emptyLabel, loadingLabel, disabled, loading, required, invalid, describedBy, className,
}: ComboboxProps) {
  const generated = useId();
  const inputId = id ?? generated;
  const listId = `${inputId}-list`;
  const [internalValue, setInternalValue] = useState(defaultValue);
  const selectedValue = value ?? internalValue;
  const selectedLabel = options.find((option) => option.value === selectedValue)?.label ?? "";
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState(-1);
  const root = useRef<HTMLDivElement>(null);
  const input = useRef<HTMLInputElement>(null);
  const filtered = options.filter((option) => option.label.toLocaleLowerCase().includes(query.toLocaleLowerCase()));
  const enabledIndices = filtered.flatMap((option, index) => option.disabled ? [] : [index]);
  const activeOption = open && !loading && active >= 0 ? filtered[active] : undefined;

  useEffect(() => {
    if (!open) return;
    const outside = (event: PointerEvent) => {
      if (!root.current?.contains(event.target as Node)) { setOpen(false); setQuery(""); }
    };
    document.addEventListener("pointerdown", outside);
    return () => document.removeEventListener("pointerdown", outside);
  }, [open]);
  useEffect(() => {
    if (activeOption) document.getElementById(`${listId}-${active}`)?.scrollIntoView({ block: "nearest" });
  }, [active, activeOption, listId]);
  useEffect(() => { if (disabled) setOpen(false); }, [disabled]);

  const choose = (option: ComboboxOption) => {
    if (option.disabled || loading) return;
    if (value === undefined) setInternalValue(option.value);
    onValueChange?.(option.value);
    setOpen(false);
    setQuery("");
    setActive(-1);
    input.current?.focus();
  };
  const keyDown = (event: KeyboardEvent<HTMLInputElement>) => {
    if (event.key === "ArrowDown" || event.key === "ArrowUp") {
      event.preventDefault();
      setOpen(true);
      const current = enabledIndices.indexOf(active);
      const next = event.key === "ArrowDown"
        ? (current + 1) % enabledIndices.length
        : (current < 0 ? enabledIndices.length - 1 : (current - 1 + enabledIndices.length) % enabledIndices.length);
      setActive(enabledIndices[next] ?? -1);
    } else if (event.key === "Enter" && open) {
      event.preventDefault();
      if (activeOption) choose(activeOption);
    } else if (event.key === "Escape") {
      event.preventDefault(); setOpen(false); setQuery(""); setActive(-1);
    } else if (event.key === "Tab") {
      setOpen(false); setQuery(""); setActive(-1);
    }
  };
  return (
    <div ref={root} className={cn("troc-combobox", className)}>
      {name && <input type="hidden" name={name} value={selectedValue} />}
      <div className="troc-combobox-control">
        <Input ref={input} id={inputId} role="combobox" aria-label={label}
          aria-controls={open ? listId : undefined} aria-expanded={open} aria-autocomplete="list" aria-haspopup="listbox"
          aria-activedescendant={activeOption ? `${listId}-${active}` : undefined}
          aria-invalid={invalid || undefined} aria-describedby={describedBy}
          aria-required={required || undefined} aria-busy={loading || undefined}
          autoComplete="off" disabled={disabled} placeholder={placeholder}
          value={open ? query : selectedLabel}
          onFocus={() => { setOpen(true); setQuery(""); setActive(-1); }}
          onBlur={(event) => {
            if (!root.current?.contains(event.relatedTarget)) { setOpen(false); setQuery(""); }
          }}
          onChange={(event) => { setQuery(event.target.value); setOpen(true); setActive(-1); }}
          onKeyDown={keyDown} />
        <Button variant="ghost" size="icon" disabled={disabled} aria-label={toggleLabel}
          tabIndex={-1} aria-expanded={open} aria-controls={open ? listId : undefined}
          onPointerDown={(event) => event.preventDefault()}
          onClick={() => {
            if (open) { setOpen(false); setQuery(""); }
            else { input.current?.focus(); setOpen(true); }
          }}>
          {loading ? <LoaderCircle className="troc-loading" aria-hidden="true" /> : <ChevronDown aria-hidden="true" />}
        </Button>
      </div>
      {open && (
        <div className="troc-combobox-popup">
          {(loading || !filtered.length) && <p role="status" className="troc-combobox-message">{loading ? loadingLabel : emptyLabel}</p>}
          <ul id={listId} role="listbox" aria-label={label}>
            {!loading && filtered.map((option, index) => (
              <li key={option.value} id={`${listId}-${index}`} role="option"
                aria-selected={option.value === selectedValue} aria-disabled={option.disabled || undefined}
                data-active={index === active} className="troc-combobox-option"
                onPointerDown={(event) => event.preventDefault()}
                onPointerMove={() => { if (!option.disabled) setActive(index); }}
                onClick={() => choose(option)}>
                {option.label}
                {option.value === selectedValue && <Check size={16} aria-hidden="true" />}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}