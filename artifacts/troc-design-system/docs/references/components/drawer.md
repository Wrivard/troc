# Drawer and sheet

- **Normalized family:** `drawer`
- **Status:** Pending approval — future family; do not implement in the pilot.
- **Source provenance:** Provided TROC specification only; no imported third-party component code.
- **Planned source:** `src/components/ui/drawer.tsx`
- **Planned preview:** `src/preview/demos/drawer.tsx`
- **Package export:** `@workspace/troc-design-system/components/ui/drawer`
- **Exports:** Drawer, DrawerTrigger, DrawerPortal, DrawerOverlay, DrawerContent, DrawerHeader, DrawerFooter, DrawerTitle, DrawerDescription, DrawerClose
- **Implementation:** Themed accessible drawer/sheet scaffold using the existing drawer primitive.
- **Dependencies:** React; vaul; Button; cn.
- **Required variants/states:** Bottom and side presentation, open/closed, drag where supported, focus management, escape/close, mobile-safe height, and reduced-motion behavior.
- **Evidence:** `docs/references/specifications/04_COMPONENT_LIBRARY_1790026725045.md:15,50-58`; `docs/references/specifications/06_RESPONSIVE_ACCESSIBILITY_1790026725046.md:8-17`; `docs/references/specifications/Pasted-We-are-starting-the-first-development-milestone-for-TRO_1790027534621.txt:497-513,624-632`.
- **Sequential chunk:** 3 of 7 — begins only after every prior chunk is approved and complete.

## Scope guardrail

This record specifies a reusable visual component only. It does not authorize marketplace pages, business logic, APIs, persistence, optimization, checkout, authentication, or backend work.
