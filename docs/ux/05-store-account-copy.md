# Lots 05–07 — Store discovery, account helper, founding copy

- Store: primary Browse cards / Voir les cartes beside seller identity; activates the shop panel and focuses/scrolls the results count. Existing filtered selection remains intact. Planned Follow is secondary and disabled. Mobile cover reduced to 160px in shared StoreHero (desktop remains 280px); mobile duplicate catalog navigation removed. Handling appears once; minimum and combined shipping remain.
- Account: password creation helper and its aria-describedby appear only on sign-up. Authentication, password validation and autocomplete remain unchanged.
- Founding copy (3a24fd9): superseded 250-place and lifetime-Pro promises removed as directed by orchestrator/current product decisions. No new benefit, timeline or approval promise.

Twelve browser combinations (390/768/1440 × EN/FR × light/dark) pass: store CTA within first 844px viewport, keyboard focus destination, About-to-Shop transition, under-$1 max99/sortprice/locale, no horizontal overflow, axe, password helper appropriate to route. Mobile CTA bottom 668px in both languages; mobile store screenshot inspected. Founding EN/FR rendered separately; FR full-page screenshot inspected. Independent targeted B01, A01 and G01 revalidation passed; follow-up 046142a preserves locale between sign-in and signup, independently checked at 072676a. Existing style-guide StoreHero examples automatically share responsive cover refinement.

No public API, commerce mutation, provider or authentication change. No deployment by Design. Authenticated routes and integration with pending seller/prelaunch work require A’s combined preview.
