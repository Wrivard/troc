# Recently sold ticker item

- **Normalized family:** `recently-sold`
- **Status:** Pending approval — future family; do not implement in the pilot.
- **Source provenance:** Provided TROC specification only; no imported third-party component code.
- **Planned source:** `src/components/ui/recently-sold.tsx`
- **Planned preview:** `src/preview/demos/recently-sold.tsx`
- **Package export:** `@workspace/troc-design-system/components/ui/recently-sold`
- **Exports:** RecentlySoldItem
- **Implementation:** New compact marketplace content composition; no ticker animation system is implied.
- **Dependencies:** CardImage; CardTitle; PriceBlock; Badge optionally.
- **Required variants/states:** Compact item, image missing/loading, price and timestamp metadata, link focus, and reduced-motion-safe use in any ticker container.
- **Evidence:** `docs/references/specifications/04_COMPONENT_LIBRARY_1790026725045.md:44`; `docs/references/specifications/06_RESPONSIVE_ACCESSIBILITY_1790026725046.md:16`.
- **Sequential chunk:** 5 of 7 — begins only after every prior chunk is approved and complete.

## Scope guardrail

This record specifies a reusable visual component only. It does not authorize marketplace pages, business logic, APIs, persistence, optimization, checkout, authentication, or backend work.
