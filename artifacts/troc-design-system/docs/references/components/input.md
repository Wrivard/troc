# Input

- **Normalized family:** `input`
- **Status:** **APPROVED — implemented, technically verified, and user-approved on 2026-09-21.**
- **Source provenance:** Provided TROC specification only; no imported third-party component code.
- **Source:** `src/components/ui/input.tsx`
- **Preview:** `src/preview/demos/input.tsx`
- **Package export:** `@workspace/troc-design-system/components/ui/input`
- **Exports:** Input
- **Implementation:** Themed native input scaffold.
- **Dependencies:** React; cn; semantic form tokens.
- **Required variants/states:** Text, search, and password types; normal, focus, filled, error, disabled, helper-text, and loading-compatible states.
- **Verified behavior:** Search, password, and validation behavior passed
  main-agent verification.
- **Evidence:** `docs/references/specifications/04_COMPONENT_LIBRARY_1790026725045.md:7,50-58`; `docs/references/specifications/Pasted-We-are-starting-the-first-development-milestone-for-TRO_1790027534621.txt:345-370`.
- **Sequential chunk:** 1 of 7 — PILOT; exactly Button, Input, Textarea, Select, and Combobox.

## Scope guardrail

This record specifies a reusable visual component only. It does not authorize marketplace pages, business logic, APIs, persistence, optimization, checkout, authentication, or backend work.
