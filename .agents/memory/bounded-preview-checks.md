---
name: Bounded preview checks
description: Verifying compositions whose frames deliberately clip overflow.
---

Document-level overflow checks are not sufficient for bounded style-guide examples.

**Why:** A clipped frame concealed an intrinsically oversized logo and cramped header controls, so the page passed document-width checks while the composition was visibly broken.

**How to apply:** Check component sizing contracts and control bounds inside frames, then inspect representative desktop and phone renderings. Distinguish deliberately width-sized foundation artwork from height-controlled consumer logos when asserting dimensions.