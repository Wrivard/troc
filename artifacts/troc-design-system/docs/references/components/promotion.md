# Promotion

- **Normalized family:** `promotion`
- **Status:** **IMPLEMENTED and typechecked — final main-agent browser validation pending.**
- **Source provenance:** Provided TROC specification only; no imported third-party component code.
- **Source:** `src/components/ui/promotion.tsx`
- **Preview:** `src/preview/demos/promotion.tsx`
- **Package export:** `@workspace/troc-design-system/components/ui/promotion`
- **Exports:** PromotionBadge, PromotionCard; types: PromotionState,
  PromotionBadgeProps, PromotionCardAction, PromotionCardProps
- **Implementation:** New marketplace composition built on Badge and progress/action primitives.
- **Dependencies:** Badge; Progress; Button for card actions; translation keys.
- **Required variants/states:** Badge and seller promotion card, active/eligible/locked/expired visual states, concise terms, optional action, and responsive layout.
- **Evidence:** `docs/references/specifications/04_COMPONENT_LIBRARY_1790026725045.md:37`; `docs/references/specifications/Pasted-We-are-starting-the-first-development-milestone-for-TRO_1790027534621.txt:416-429,465-477`.
- **Sequential chunk:** 5 of 7 — implemented after Progress; typechecked, with
  final browser validation pending.

## Scope guardrail

This record specifies a reusable visual component only. It does not authorize marketplace pages, business logic, APIs, persistence, optimization, checkout, authentication, or backend work.
