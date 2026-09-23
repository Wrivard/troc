# Design2 — About TROC lot

Base: e7059e659d0113268b235d834dfed4cb90024bf0. Scope: new home-community files and uniquely named test only. No existing homepage/global files changed.

Export: `AboutTrocSection({ locale: "en" | "fr", href: (path: string) => string })` from `./home-community/AboutTrocSection`. Design1 replaces its existing About section with `<AboutTrocSection locale={page.locale} href={href} />` and removes only its now-unused MarketplacePrinciples import. Existing bilingual story, four descriptions and /about destination are transferred verbatim. Existing globe/coin/language/layers icons retained. No duplicate live content after wiring.

Dark view follows the supplied reference's restrained split/2x2 composition. Light preference uses neutral light surfaces and dark text to preserve readable theme behavior. About is split at >1050px, story above 2x2 at tablet, four stacked cards <=600px. All styling is scoped to `.troc-hc`/`.troc-hc-about` descendants.

Author checks: marketplace typecheck and scoped ESLint PASS. Client+SSR build PASS, but current main entry does not import this isolated module, so bundle inclusion must be checked after wiring. 16 Playwright cases PASS: widths1440/768/390/320 × EN/FR × dark/light, four features, localized About href, visible keyboard focus, no horizontal document overflow, responsive grid count and zero page errors. Test: `tests/home-community-about-browser.mjs`, optional HOME_COMMUNITY_URL and HOME_COMMUNITY_EVIDENCE. This checks href but does not certify destination page behavior.

Actual visual inspection: original About/community/CTA reference images and original CTA artwork; final About1440 ENdark/FRlight,768 ENlight/FRdark,390 ENdark/FRlight. All16 full-section captures exist under `.design2-preview/references/about-*`. An initial light contrast defect and wrong font token were found visually and corrected before final capture. Remaining combinations are captured/asserted, not claimed inspected. Independent UX2 and integrated-homepage checks remain required.

Preview: http://127.0.0.1:4341/?lang=en&theme=dark, switch lang=en/fr, theme=dark/light. Task-local untracked harness renders the real new module with frozen e7059e6 marketplace/design-system CSS. Its Vite aliases pin design-system source to this worktree. Node_modules junctions reuse installed dependencies read-only after frozen offline install failed with ERR_PNPM_LOCKFILE_CONFIG_MISMATCH. No package/lockfile edits. Node24/pnpm10, Vite7.3.6. Preview is NOT integrated homepage acceptance.

Windows sandbox exec/Node/view_image fail apply deny-read ACLs. Approved escalated shell works. Reference viewing via task-local loopback5341 and browser succeeded; final screenshots read through approved shell and displayed as actual images. Recovery notified. No security/config/account edits.
