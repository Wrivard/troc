# Seller/admin and prelaunch UX — prepared, ownership pending

Read-only baseline inspected: A a7e7539. No seller/prelaunch/order/video sources edited. Exact B/C presentation handoff requested from A; task-message approval reviews timed out and later stalled, so delivery/authorization is not assumed.

## Ready implementation scope

- AD01: in SellerPlatformApp admin application cards, show the existing review_note with translated Review note / Note d’examen label. Do not invent history, actor or date.
- AD02: decision select uses required defaultValue="" and disabled Choose a decision / Choisir une décision option. Keep approved/rejected values and existing submit handler unchanged. Verify native form validation prevents an unchosen decision; both choices remain available; error preserves note.
- AD03: render admin pagination only if adminPage > 0 or applications.length >= 50. Keep existing next/previous guards; verify50→1→50 fixture and initial single-page absence.
- PL01: centralize early-access navigation around the current locale and the existing bounded source/ref parameters. Apply to logo/home, collector, seller, back and withdrawal links. Do not alter journey/session/consent logic. Test fresh FR browser form→success→withdraw and source/ref retention.
- PL02: show the existing receipt in a labeled read-only Input so it is keyboard-focusable and selectable. No extra secret storage, logs or API calls. Preserve anti-enumeration copy and success semantics; test selection and retained value after errors.

Behavior findings O01/O02 in UX report21 belong to A: asynchronous message submission clears draft before success, and order503 suggests sign-in. Do not modify these under presentation-only ownership.

Fixtures: use auditor reports18/20/21 and A’s isolated preview; intercept decision/message/lead/withdraw writes. These tests do not prove real authorization, persistence or hosted readiness.

## Bounded video review

Read STORYBOARD.md and all4 supplied contact sheets (EN/FR landscape/vertical) in Troc-Launch-Video. Approved-logo treatment, palette, main hierarchy and French grammar are consistent. Initial sheets show overly small conceptual/prelaunch labels:22px at1080 scales to roughly8px on a390px phone. Request larger readable disclosure within safe area. Source Launch.tsx appears already updated to40/60px and different label text; those newer frames were not yet supplied, so do not claim the correction verified. Suggest consumer-facing “One card. Offers from Canadian sellers.” instead of “One card identity.” No video files edited. Final motion/timing requires actual video playback; contact sheets cannot establish it.

## Coordination limitation

Automatic approval-review timeouts are tool-service failures, not evidence of unsafe code. No ownership approval is inferred from elapsed time or missing replies. Continue once exact handoffs or stable revised video artifacts arrive; this is not a global design/database hold.
