# Selection controls

- **Normalized family:** `selection-controls`
- **Status:** Pending approval — future family; do not implement in the pilot.
- **Source provenance:** Provided TROC specification only; no imported third-party component code.
- **Planned source:** `src/components/ui/selection-controls.tsx`
- **Planned preview:** `src/preview/demos/selection-controls.tsx`
- **Package export:** `@workspace/troc-design-system/components/ui/selection-controls`
- **Exports:** Checkbox, RadioGroup, RadioGroupItem, Switch
- **Implementation:** Themed Radix Checkbox, Radio Group, and Switch scaffolds normalized as one form-selection family.
- **Dependencies:** React; @radix-ui/react-checkbox; @radix-ui/react-radio-group; @radix-ui/react-switch; lucide-react; cn.
- **Required variants/states:** Checked, unchecked, indeterminate where applicable, focus-visible, disabled, error, and labelled states.
- **Evidence:** `docs/references/specifications/04_COMPONENT_LIBRARY_1790026725045.md:8,50-58`; `docs/references/specifications/Pasted-We-are-starting-the-first-development-milestone-for-TRO_1790027534621.txt:345-370`.
- **Sequential chunk:** 2 of 7 — begins only after every prior chunk is approved and complete.

## Scope guardrail

This record specifies a reusable visual component only. It does not authorize marketplace pages, business logic, APIs, persistence, optimization, checkout, authentication, or backend work.
