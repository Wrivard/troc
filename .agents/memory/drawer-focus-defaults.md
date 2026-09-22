---
name: Drawer focus defaults
description: Why blocking drawers need explicit focus initialization.
---

Blocking drawers need focus to enter on opening, remain contained while open, and return to the trigger on dismissal.

**Why:** Vaul's default autofocus behavior did not move focus into the drawer; its modal appearance and underlying accessible primitive were not enough to establish keyboard containment.

**How to apply:** Do not treat explicit focus initialization as redundant. After changes to drawer composition or dependencies, judge the behavior using actual Tab navigation and Escape/focus restoration, not just the rendered modal or its attributes.