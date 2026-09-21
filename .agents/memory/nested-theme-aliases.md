---
name: Nested theme aliases
description: Why scoped light/dark comparison panels need their own resolved color aliases.
---

Do not assume that changing underlying theme channels on a nested element also
changes a color alias inherited from the document root.

**Why:** CSS custom properties resolve before inheritance. In this Tailwind-based
guide, switching the document theme worked, but a nested light panel retained the
dark background while its semantic text became dark. Root-only screenshots did
not reveal the problem.

**How to apply:** When adding or changing theme roles, exercise both a document
theme switch and opposite-theme panels nested inside it. Ensure resolved aliases
exist at each theme boundary; inspect computed colors, not class names alone.