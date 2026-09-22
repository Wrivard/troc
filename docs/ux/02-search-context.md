# UX section 02 — search context and recovery

Source: independent UX-AUDIT/02-RECHERCHE.md. Implements S01–S03 without changing price units/API rules.

Mobile search uses a compact utility heading, keeps the first result name and price in its initial viewport, and removes only its duplicated mobile game shortcut row (game filter remains). Applied query and criteria are visible outside the collapsed form. Each criterion can be removed while retaining the others; cursor resets. Cents inputs explain100¢=$1CAD and applied prices display dollars. Empty results offer Edit search (opens/focuses existing query field) and reset without a large illustration. Empty desktop filters collapse so recovery is not pushed below the form.

Tests: tests/ux-search-browser.mjs covers mobile/desktop, EN/FR, light/dark, first-card price placement, removal/back navigation, no-results edit/reset, selected-theme persistence, overflow and accessibility. URL theme is a temporary preview override; persistence is checked after an actual theme choice. Typecheck/lint passed. Independent revalidation pending; A integrates local commits only.

Section01 predecessor9ab3b50 independently validated for F01–F04 by UX-AUDIT/01-REVALIDATION-9ab3b50.md; unobserved fixture states remain distinguished from reviewer-observed cases.
