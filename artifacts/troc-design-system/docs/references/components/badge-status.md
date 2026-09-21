# Badge and status

- **Normalized family:** `badge-status`
- **Status:** Pending approval — future family; do not implement in the pilot.
- **Source provenance:** Provided TROC specification only; no imported third-party component code.
- **Planned source:** `src/components/ui/badge-status.tsx`
- **Planned preview:** `src/preview/demos/badge-status.tsx`
- **Package export:** `@workspace/troc-design-system/components/ui/badge-status`
- **Exports:** Badge, badgeVariants, OrderStatusBadge
- **Implementation:** Themed scaffold plus constrained status composition.
- **Dependencies:** React; class-variance-authority; cn.
- **Required variants/states:** Neutral, accent, positive, warning, destructive, sponsored, and order-status treatments; icon/text pairing so status is not colour-only.
- **Evidence:** `docs/references/specifications/04_COMPONENT_LIBRARY_1790026725045.md:18,50-58`; `docs/references/specifications/06_RESPONSIVE_ACCESSIBILITY_1790026725046.md:12`; `docs/references/specifications/Pasted-We-are-starting-the-first-development-milestone-for-TRO_1790027534621.txt:477,599-612`.
- **Sequential chunk:** 2 of 7 — begins only after every prior chunk is approved and complete.

## Scope guardrail

This record specifies a reusable visual component only. It does not authorize marketplace pages, business logic, APIs, persistence, optimization, checkout, authentication, or backend work.
