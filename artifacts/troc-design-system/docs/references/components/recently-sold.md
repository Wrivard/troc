# Recently sold ticker item

- **Normalized family:** `recently-sold`
- **Status:** **IMPLEMENTED and typechecked — final main-agent browser validation pending.**
- **Source provenance:** Provided TROC specification only; no imported third-party component code.
- **Source:** `src/components/ui/recently-sold.tsx`
- **Preview:** `src/preview/demos/recently-sold.tsx`
- **Package export:** `@workspace/troc-design-system/components/ui/recently-sold`
- **Exports:** RecentlySoldItem; type: RecentlySoldItemProps
- **Implementation:** New compact marketplace content composition; no ticker animation system is implied.
- **Dependencies:** CardImage; CardTitle; PriceBlock; Badge optionally.
- **Required variants/states:** Compact item, image missing/loading, price and timestamp metadata, link focus, and reduced-motion-safe use in any ticker container.
- **Evidence:** `docs/references/specifications/04_COMPONENT_LIBRARY_1790026725045.md:44`; `docs/references/specifications/06_RESPONSIVE_ACCESSIBILITY_1790026725046.md:16`.
- **Sequential chunk:** 5 of 7 — implemented after Product Presentation and
  Marketplace Price; typechecked, with final browser validation pending.

## Scope guardrail

This record specifies a reusable visual component only. It does not authorize marketplace pages, business logic, APIs, persistence, optimization, checkout, authentication, or backend work.
