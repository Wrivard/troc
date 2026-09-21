# Tabs

- **Normalized family:** `tabs`
- **Status:** Pending approval — future family; do not implement in the pilot.
- **Source provenance:** Provided TROC specification only; no imported third-party component code.
- **Planned source:** `src/components/ui/tabs.tsx`
- **Planned preview:** `src/preview/demos/tabs.tsx`
- **Package export:** `@workspace/troc-design-system/components/ui/tabs`
- **Exports:** Tabs, TabsList, TabsTrigger, TabsContent
- **Implementation:** Themed Radix Tabs scaffold.
- **Dependencies:** React; @radix-ui/react-tabs; cn.
- **Required variants/states:** Default, hover, active/selected, focus-visible, disabled, overflow/mobile, and keyboard states.
- **Evidence:** `docs/references/specifications/04_COMPONENT_LIBRARY_1790026725045.md:9,50-58`; `docs/references/specifications/Pasted-We-are-starting-the-first-development-milestone-for-TRO_1790027534621.txt:518-528`.
- **Sequential chunk:** 2 of 7 — begins only after every prior chunk is approved and complete.

## Scope guardrail

This record specifies a reusable visual component only. It does not authorize marketplace pages, business logic, APIs, persistence, optimization, checkout, authentication, or backend work.
