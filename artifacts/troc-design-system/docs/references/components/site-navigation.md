# Site navigation

- **Normalized family:** `site-navigation`
- **Status:** Pending approval — future family; do not implement in the pilot.
- **Source provenance:** Provided TROC specification only; no imported third-party component code.
- **Planned source:** `src/components/ui/site-navigation.tsx`
- **Planned preview:** `src/preview/demos/site-navigation.tsx`
- **Package export:** `@workspace/troc-design-system/components/ui/site-navigation`
- **Exports:** SiteHeader, MobileNavigation
- **Implementation:** New responsive composition using Logo, GlobalSearch, locale/theme controls, Buttons, and semantic nav landmarks.
- **Dependencies:** TrocLogo; GlobalSearch; LocaleSwitcher; ThemeSwitcher; Button; Badge/Status for cart count; lucide-react.
- **Required variants/states:** Desktop links for Shop/Sell/Collect, search, locale, theme, account, and cart; restrained mobile logo/search/cart-account and appropriate bottom/menu navigation; active, focus-visible, signed-out/account, and narrow states.
- **Evidence:** `docs/references/specifications/00_START_HERE_1790026725044.md:6-16`; `docs/references/specifications/05_STYLE_GUIDE_PAGE_1790026725045.md:13-17`; `docs/references/specifications/Pasted-We-are-starting-the-first-development-milestone-for-TRO_1790027534621.txt:529-565`.
- **Sequential chunk:** 4 of 7 — begins only after every prior chunk is approved and complete.

## Scope guardrail

This record specifies a reusable visual component only. It does not authorize marketplace pages, business logic, APIs, persistence, optimization, checkout, authentication, or backend work.
