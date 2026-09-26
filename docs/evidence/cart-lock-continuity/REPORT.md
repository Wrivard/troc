# D16 cart lock continuity — local verification

Existing implementation retained; no defect demonstrated.
scripts/check-cart-lock-continuity.cjs passes EN1440 and FR390:
- Keyboard activation of exact-listing lock does not implicitly select seller lock.
- Both locks persist from compact drawer to full cart.
- Clearing seller lock preserves exact-listing lock.
- Reload preserves both choices, original listing ID and quantity.
- No horizontal overflow.

Uses existing local listing and isolated browser cart storage. No purchase, payment, message, inventory mutation or catalogue import. This is interaction/persistence evidence, not a fresh optimizer correctness or hosted scalability certification.
