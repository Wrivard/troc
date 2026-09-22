# Combobox

- **Normalized family:** `combobox`
- **Status:** **APPROVED — implemented, technically verified, and user-approved on 2026-09-21.**
- **Source provenance:** Provided TROC specification only; no imported third-party component code.
- **Source:** `src/components/ui/combobox.tsx`
- **Preview:** `src/preview/demos/combobox.tsx`
- **Package export:** `@workspace/troc-design-system/components/ui/combobox`
- **Exports:** Combobox; types: ComboboxOption, ComboboxProps
- **Implementation:** New self-contained native ARIA editable-combobox composition built with Input and Button; no exported Popover dependency.
- **Dependencies:** React; Input; Button; cn. No Popover export or dependency in the public composition.
- **Required variants/states:** Editable search, filtered listbox, empty results, expanded/collapsed, highlighted option, selected/filled, focus-visible, error, disabled, helper-text, keyboard navigation, and loading states.
- **Verified behavior:** Controlled value, keyboard navigation, filtering, empty
  results, Escape, Tab, disabled, and loading behavior passed main-agent
  verification.
- **Evidence:** `docs/references/specifications/04_COMPONENT_LIBRARY_1790026725045.md:7,26,50-58`; `docs/references/specifications/06_RESPONSIVE_ACCESSIBILITY_1790026725046.md:7-18`; `docs/references/specifications/Pasted-We-are-starting-the-first-development-milestone-for-TRO_1790027534621.txt:345-370`.
- **Sequential chunk:** 1 of 7 — PILOT; exactly Button, Input, Textarea, Select, and Combobox.

## Scope guardrail

This record specifies a reusable visual component only. It does not authorize marketplace pages, business logic, APIs, persistence, optimization, checkout, authentication, or backend work.
