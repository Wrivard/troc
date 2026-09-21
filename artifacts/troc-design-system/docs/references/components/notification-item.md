# Notification item

- **Normalized family:** `notification-item`
- **Status:** Pending approval — future family; do not implement in the pilot.
- **Source provenance:** Provided TROC specification only; no imported third-party component code.
- **Planned source:** `src/components/ui/notification-item.tsx`
- **Planned preview:** `src/preview/demos/notification-item.tsx`
- **Package export:** `@workspace/troc-design-system/components/ui/notification-item`
- **Exports:** NotificationItem
- **Implementation:** New semantic list-item composition.
- **Dependencies:** Badge/Status; Button or link; translated timestamp/copy.
- **Required variants/states:** Read/unread, informational, success, warning, error, action link, timestamp, compact, and keyboard-focus states.
- **Evidence:** `docs/references/specifications/04_COMPONENT_LIBRARY_1790026725045.md:46`; `docs/references/specifications/05_STYLE_GUIDE_PAGE_1790026725045.md:20-21`.
- **Sequential chunk:** 5 of 7 — begins only after every prior chunk is approved and complete.

## Scope guardrail

This record specifies a reusable visual component only. It does not authorize marketplace pages, business logic, APIs, persistence, optimization, checkout, authentication, or backend work.
