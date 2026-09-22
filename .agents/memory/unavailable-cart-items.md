---
name: Unavailable cart items
description: The distinction between unavailable inventory and a temporarily locked cart action.
---

An unavailable cart line must remain removable. Unavailability alone should disable purchasing and quantity changes, not every action on the line.

**Why:** The customer needs a way to clear an unavailable item. A static review can incorrectly flag an enabled Remove button beside disabled quantity controls as inconsistent.

**How to apply:** Distinguish inventory availability from an in-flight action that temporarily locks controls. Preserve removal when only availability prevents purchase.