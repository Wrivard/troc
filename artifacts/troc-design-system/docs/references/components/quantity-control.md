# Quantity control

- **Normalized family:** `quantity-control`
- **Status:** Pending approval — future family; do not implement in the pilot.
- **Source provenance:** Provided TROC specification only; no imported third-party component code.
- **Planned source:** `src/components/ui/quantity-control.tsx`
- **Planned preview:** `src/preview/demos/quantity-control.tsx`
- **Package export:** `@workspace/troc-design-system/components/ui/quantity-control`
- **Exports:** QuantityControl
- **Implementation:** New composition of Input and icon Buttons.
- **Dependencies:** Input; Button; translated accessible labels.
- **Required variants/states:** Increment, decrement, direct entry, minimum/maximum reached, disabled, error, and compact cart/offer contexts.
- **Evidence:** `docs/references/specifications/04_COMPONENT_LIBRARY_1790026725045.md:39,50-58`; `docs/references/specifications/Pasted-We-are-starting-the-first-development-milestone-for-TRO_1790027534621.txt:345-370,394-405`.
- **Sequential chunk:** 2 of 7 — begins only after every prior chunk is approved and complete.

## Scope guardrail

This record specifies a reusable visual component only. It does not authorize marketplace pages, business logic, APIs, persistence, optimization, checkout, authentication, or backend work.
