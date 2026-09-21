# Textarea

- **Normalized family:** `textarea`
- **Status:** **IMPLEMENTED — verified; awaiting user visual approval.**
- **Source provenance:** Provided TROC specification only; no imported third-party component code.
- **Source:** `src/components/ui/textarea.tsx`
- **Preview:** `src/preview/demos/textarea.tsx`
- **Package export:** `@workspace/troc-design-system/components/ui/textarea`
- **Exports:** Textarea
- **Implementation:** Themed native textarea scaffold.
- **Dependencies:** React; cn; semantic form tokens.
- **Required variants/states:** Normal, focus, filled, error, disabled, helper-text, and resize-safe states.
- **Verified behavior:** Character limit and counter behavior passed main-agent
  verification.
- **Evidence:** `docs/references/specifications/04_COMPONENT_LIBRARY_1790026725045.md:7,50-58`; `docs/references/specifications/Pasted-We-are-starting-the-first-development-milestone-for-TRO_1790027534621.txt:345-370`.
- **Sequential chunk:** 1 of 7 — PILOT; exactly Button, Input, Textarea, Select, and Combobox.

## Scope guardrail

This record specifies a reusable visual component only. It does not authorize marketplace pages, business logic, APIs, persistence, optimization, checkout, authentication, or backend work.
