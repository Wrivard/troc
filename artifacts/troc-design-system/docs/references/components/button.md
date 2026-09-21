# Button

- **Normalized family:** `button`
- **Status:** **IMPLEMENTED — verified; awaiting user visual approval.**
- **Source provenance:** Provided TROC specification only; no imported third-party component code.
- **Source:** `src/components/ui/button.tsx`
- **Preview:** `src/preview/demos/button.tsx`
- **Package export:** `@workspace/troc-design-system/components/ui/button`
- **Exports:** Button, buttonVariants
- **Implementation:** Themed scaffold composition using Radix Slot for polymorphic rendering.
- **Dependencies:** React; @radix-ui/react-slot; class-variance-authority; cn.
- **Required variants/states:** Primary, secondary, ghost/tertiary, outline, destructive, and icon variants; default, hover, pressed/active, focus-visible, disabled, and loading states.
- **Verified public contract:** Variants are default/primary, secondary,
  ghost/tertiary, outline, and destructive, plus icon size. There is no public
  link variant. Loading behavior passed main-agent verification.
- **Evidence:** `docs/references/specifications/04_COMPONENT_LIBRARY_1790026725045.md:3-7,50-58`; `docs/references/specifications/Pasted-We-are-starting-the-first-development-milestone-for-TRO_1790027534621.txt:323-344`.
- **Sequential chunk:** 1 of 7 — PILOT; exactly Button, Input, Textarea, Select, and Combobox.

## Scope guardrail

This record specifies a reusable visual component only. It does not authorize marketplace pages, business logic, APIs, persistence, optimization, checkout, authentication, or backend work.
