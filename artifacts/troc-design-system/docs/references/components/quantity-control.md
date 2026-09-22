# Quantity control

- **Normalized family:** `quantity-control`
- **Status:** **IMPLEMENTED and typechecked — final main-agent browser validation pending.**
- **Source provenance:** Provided TROC specification only; no imported third-party component code.
- **Source:** `src/components/ui/quantity-control.tsx`
- **Preview:** `src/preview/demos/quantity-control.tsx`
- **Package export:** `@workspace/troc-design-system/components/ui/quantity-control`
- **Exports:** QuantityControl; type: QuantityControlProps
- **Implementation:** New composition of Input and icon Buttons.
- **Dependencies:** Input; Button; translated accessible labels.
- **Required variants/states:** Increment, decrement, direct entry, minimum/maximum reached, disabled, error, and compact cart/offer contexts.
- **Evidence:** `docs/references/specifications/04_COMPONENT_LIBRARY_1790026725045.md:39,50-58`; `docs/references/specifications/Pasted-We-are-starting-the-first-development-milestone-for-TRO_1790027534621.txt:345-370,394-405`.
- **Sequential chunk:** 2 of 7 — implemented and typechecked; final browser validation pending.

## Scope guardrail

This record specifies a reusable visual component only. It does not authorize marketplace pages, business logic, APIs, persistence, optimization, checkout, authentication, or backend work.
