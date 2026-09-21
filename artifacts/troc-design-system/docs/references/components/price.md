# Marketplace price

- **Normalized family:** `price`
- **Status:** Pending approval — future family; do not implement in the pilot.
- **Source provenance:** Provided TROC specification only; no imported third-party component code.
- **Planned source:** `src/components/ui/price.tsx`
- **Planned preview:** `src/preview/demos/price.tsx`
- **Package export:** `@workspace/troc-design-system/components/ui/price`
- **Exports:** PriceBlock, ReferencePrice, LowestAvailable, SalePrice
- **Implementation:** New typographic composition using tabular price tokens.
- **Dependencies:** React; typography/number-format utilities supplied by consumer locale.
- **Required variants/states:** Large/small, reference, lowest available, regular/sale with prior price, CAD formatting, sub-dollar values, unavailable, and dense row states.
- **Evidence:** `docs/references/specifications/03_TYPOGRAPHY_LOGO_1790026725045.md:8-17`; `docs/references/specifications/04_COMPONENT_LIBRARY_1790026725045.md:30-31,38`; `docs/references/specifications/Pasted-We-are-starting-the-first-development-milestone-for-TRO_1790027534621.txt:384-392,480-494,635-650`.
- **Sequential chunk:** 5 of 7 — begins only after every prior chunk is approved and complete.

## Scope guardrail

This record specifies a reusable visual component only. It does not authorize marketplace pages, business logic, APIs, persistence, optimization, checkout, authentication, or backend work.
