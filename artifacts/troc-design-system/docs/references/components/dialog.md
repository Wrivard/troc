# Dialog

- **Normalized family:** `dialog`
- **Status:** Pending approval — future family; do not implement in the pilot.
- **Source provenance:** Provided TROC specification only; no imported third-party component code.
- **Planned source:** `src/components/ui/dialog.tsx`
- **Planned preview:** `src/preview/demos/dialog.tsx`
- **Package export:** `@workspace/troc-design-system/components/ui/dialog`
- **Exports:** Dialog, DialogTrigger, DialogPortal, DialogOverlay, DialogContent, DialogHeader, DialogFooter, DialogTitle, DialogDescription, DialogClose
- **Implementation:** Themed Radix Dialog scaffold; modal is an alias concept, not a second family.
- **Dependencies:** React; @radix-ui/react-dialog; lucide-react; Button; cn.
- **Required variants/states:** Open/closed, labelled title/description, initial and return focus, escape/close, destructive confirmation composition, loading, and clipped-screen-safe mobile layout.
- **Evidence:** `docs/references/specifications/04_COMPONENT_LIBRARY_1790026725045.md:14,50-58`; `docs/references/specifications/06_RESPONSIVE_ACCESSIBILITY_1790026725046.md:8-17`; `docs/references/specifications/Pasted-We-are-starting-the-first-development-milestone-for-TRO_1790027534621.txt:497-513,624-632`.
- **Sequential chunk:** 3 of 7 — begins only after every prior chunk is approved and complete.

## Scope guardrail

This record specifies a reusable visual component only. It does not authorize marketplace pages, business logic, APIs, persistence, optimization, checkout, authentication, or backend work.
