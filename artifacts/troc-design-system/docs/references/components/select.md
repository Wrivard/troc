# Select

- **Normalized family:** `select`
- **Status:** **IMPLEMENTED — verified; awaiting user visual approval.**
- **Source provenance:** Provided TROC specification only; no imported third-party component code.
- **Source:** `src/components/ui/select.tsx`
- **Preview:** `src/preview/demos/select.tsx`
- **Package export:** `@workspace/troc-design-system/components/ui/select`
- **Exports:** Select, SelectTrigger, SelectValue, SelectContent, SelectGroup, SelectLabel, SelectItem, SelectSeparator, SelectScrollUpButton, SelectScrollDownButton
- **Implementation:** Themed Radix Select scaffold.
- **Dependencies:** React; @radix-ui/react-select; lucide-react; cn.
- **Required variants/states:** Normal, focus-visible, filled, open, error, disabled, helper-text, keyboard navigation, and long French-label states.
- **Verified behavior:** Radix Select keyboard operation, portal rendering, and
  focus behavior passed main-agent verification.
- **Evidence:** `docs/references/specifications/04_COMPONENT_LIBRARY_1790026725045.md:7,50-58`; `docs/references/specifications/07_COPY_I18N_1790026725046.md:3-5,22`; `docs/references/specifications/Pasted-We-are-starting-the-first-development-milestone-for-TRO_1790027534621.txt:345-370`.
- **Sequential chunk:** 1 of 7 — PILOT; exactly Button, Input, Textarea, Select, and Combobox.

## Scope guardrail

This record specifies a reusable visual component only. It does not authorize marketplace pages, business logic, APIs, persistence, optimization, checkout, authentication, or backend work.
