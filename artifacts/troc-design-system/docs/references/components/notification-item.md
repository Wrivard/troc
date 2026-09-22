# Notification item

- **Normalized family:** `notification-item`
- **Status:** **IMPLEMENTED and typechecked — final main-agent browser validation pending.**
- **Source provenance:** Provided TROC specification only; no imported third-party component code.
- **Source:** `src/components/ui/notification-item.tsx`
- **Preview:** `src/preview/demos/notification-item.tsx`
- **Package export:** `@workspace/troc-design-system/components/ui/notification-item`
- **Exports:** NotificationItem; types: NotificationTone, NotificationItemProps
- **Implementation:** New semantic list-item composition.
- **Dependencies:** Badge/Status; Button or link; translated timestamp/copy.
- **Required variants/states:** Read/unread, informational, success, warning, error, action link, timestamp, compact, and keyboard-focus states.
- **Evidence:** `docs/references/specifications/04_COMPONENT_LIBRARY_1790026725045.md:46`; `docs/references/specifications/05_STYLE_GUIDE_PAGE_1790026725045.md:20-21`.
- **Sequential chunk:** 5 of 7 — implemented and typechecked; final browser validation pending.

## Scope guardrail

This record specifies a reusable visual component only. It does not authorize marketplace pages, business logic, APIs, persistence, optimization, checkout, authentication, or backend work.
