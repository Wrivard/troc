# Marketplace badges

- **Normalized family:** `marketplace-badges`
- **Status:** Pending approval — future family; do not implement in the pilot.
- **Source provenance:** Provided TROC specification only; no imported third-party component code.
- **Planned source:** `src/components/ui/marketplace-badges.tsx`
- **Planned preview:** `src/preview/demos/marketplace-badges.tsx`
- **Package export:** `@workspace/troc-design-system/components/ui/marketplace-badges`
- **Exports:** ConditionBadge, LanguageBadge, GameBadge, SetBadge, VariantBadge
- **Implementation:** New constrained compositions built on Badge.
- **Dependencies:** Badge; translated labels.
- **Required variants/states:** Condition NM/LP/MP/HP/DMG, language, game, set, and variant; compact/default sizes, selected/filter-compatible treatment, and non-colour-only labels.
- **Evidence:** `docs/references/specifications/04_COMPONENT_LIBRARY_1790026725045.md:27,32-33`; `docs/references/specifications/06_RESPONSIVE_ACCESSIBILITY_1790026725046.md:12`; `docs/references/specifications/Pasted-We-are-starting-the-first-development-milestone-for-TRO_1790027534621.txt:384-392`.
- **Sequential chunk:** 5 of 7 — begins only after every prior chunk is approved and complete.

## Scope guardrail

This record specifies a reusable visual component only. It does not authorize marketplace pages, business logic, APIs, persistence, optimization, checkout, authentication, or backend work.
