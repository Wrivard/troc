# Dropdown menu

- **Normalized family:** `dropdown-menu`
- **Status:** Pending approval — future family; do not implement in the pilot.
- **Source provenance:** Provided TROC specification only; no imported third-party component code.
- **Planned source:** `src/components/ui/dropdown-menu.tsx`
- **Planned preview:** `src/preview/demos/dropdown-menu.tsx`
- **Package export:** `@workspace/troc-design-system/components/ui/dropdown-menu`
- **Exports:** DropdownMenu and trigger/content/item/checkbox/radio/label/separator/submenu primitives
- **Implementation:** Themed Radix Dropdown Menu scaffold.
- **Dependencies:** React; @radix-ui/react-dropdown-menu; lucide-react; cn.
- **Required variants/states:** Open/closed, item hover/focus, checked, radio-selected, submenu, disabled, destructive, keyboard, and mobile collision states.
- **Evidence:** `docs/references/specifications/04_COMPONENT_LIBRARY_1790026725045.md:13,50-58`; `docs/references/specifications/06_RESPONSIVE_ACCESSIBILITY_1790026725046.md:8-18`; `docs/references/specifications/Pasted-We-are-starting-the-first-development-milestone-for-TRO_1790027534621.txt:497-513`.
- **Sequential chunk:** 3 of 7 — begins only after every prior chunk is approved and complete.

## Scope guardrail

This record specifies a reusable visual component only. It does not authorize marketplace pages, business logic, APIs, persistence, optimization, checkout, authentication, or backend work.
