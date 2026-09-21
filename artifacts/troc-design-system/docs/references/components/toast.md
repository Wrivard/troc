# Toast

- **Normalized family:** `toast`
- **Status:** Pending approval — future family; do not implement in the pilot.
- **Source provenance:** Provided TROC specification only; no imported third-party component code.
- **Planned source:** `src/components/ui/toast.tsx`
- **Planned preview:** `src/preview/demos/toast.tsx`
- **Package export:** `@workspace/troc-design-system/components/ui/toast`
- **Exports:** ToastProvider, ToastViewport, Toast, ToastTitle, ToastDescription, ToastAction, ToastClose, useToast, Toaster
- **Implementation:** Themed Radix Toast scaffold.
- **Dependencies:** React; @radix-ui/react-toast; lucide-react; cn.
- **Required variants/states:** Neutral, success, warning, error/destructive, action, close, timed, stacked, swipe, and reduced-motion states.
- **Evidence:** `docs/references/specifications/04_COMPONENT_LIBRARY_1790026725045.md:16,50-58`; `docs/references/specifications/Pasted-We-are-starting-the-first-development-milestone-for-TRO_1790027534621.txt:497-513`.
- **Sequential chunk:** 3 of 7 — begins only after every prior chunk is approved and complete.

## Scope guardrail

This record specifies a reusable visual component only. It does not authorize marketplace pages, business logic, APIs, persistence, optimization, checkout, authentication, or backend work.
