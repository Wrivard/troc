---
name: Preview JSX generics
description: A development-only instrumentation constraint that production builds do not detect.
---

Prefer typed props and inferred generic arguments at JSX call sites in this workspace. Keep component definitions generic; do not weaken their public types or disable development instrumentation to work around a call-site parsing failure.

**Why:** Development instrumentation inserted metadata into an explicit JSX generic argument and broke the running preview, although TypeScript and the production build both passed.

**How to apply:** If a generic component works in production checks but fails during development transformation, check the transformed JSX before changing the component API. Revisit this constraint if the instrumentation changes.