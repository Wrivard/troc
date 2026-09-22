# Toast

- **Normalized family:** `toast`
- **Status:** **IMPLEMENTED and typechecked — final main-agent browser validation pending.**
- **Source provenance:** Provided TROC specification only; no imported third-party component code.
- **Source:** `src/components/ui/toast.tsx`
- **Preview:** `src/preview/demos/toast.tsx`
- **Package export:** `@workspace/troc-design-system/components/ui/toast`
- **Exports:** ToastProvider, ToastViewport, Toast, ToastTitle,
  ToastDescription, ToastAction, ToastClose, ToastControllerProvider, useToast,
  Toaster, toastVariants; type: ToastData
- **Implementation:** Themed Radix Toast scaffold.
- **Dependencies:** React; @radix-ui/react-toast; lucide-react; cn.
- **Required variants/states:** Neutral, success, warning, error/destructive, action, close, timed, stacked, swipe, and reduced-motion states.
- **Implemented contract:** `Toaster` requires an explicit translated
  `closeLabel`; the toast family does not embed an English close label.
- **Evidence:** `docs/references/specifications/04_COMPONENT_LIBRARY_1790026725045.md:16,50-58`; `docs/references/specifications/Pasted-We-are-starting-the-first-development-milestone-for-TRO_1790027534621.txt:497-513`.
- **Sequential chunk:** 3 of 7 — implemented and typechecked; final browser validation pending.

## Scope guardrail

This record specifies a reusable visual component only. It does not authorize marketplace pages, business logic, APIs, persistence, optimization, checkout, authentication, or backend work.
