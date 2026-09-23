# Closing seller CTA handoff

Export `SellerCtaSection({locale,href,demo})`; Design1 replaces existing final CTA markup with `<SellerCtaSection locale={page.locale} href={href} demo={page.demo} />`. Existing copy and /founding-sellers, /sell remain locale-aware.250 is explicitly a goal, not a seller-count claim. Brief-added value row bilingual; checkout disclosure renders only for demo=true. No checkout/auth behavior.

Exact original assets-for-ui/troc-card-saver.png copied byte-for-byte to module assets/troc-card-saver.png. SHA256 EB7D26320A54B45F70214317580EBD7634D14AE8B2FF4D3E341074344E9651C8.1254-square image remains transparent/proportional/uncropped; no recreation or applied glow. Original differs from screenshot logo/art colors intentionally. Original image already inspected.

Author checks: marketplace types/scoped lint PASS.16 cases at1440/768/390/320 × ENFR × light/dark PASS for original hash/dimensions, localized hrefs, three value items,250 goal, visible keyboard focus, no overflow/page errors, axe WCAG2A/AA/2.1AA zero violations and demo=false disclosure absence. Test tests/home-community-cta-browser.mjs. Captures/results verification/home-community-cta/. Actual complete-section inspection5:1440 ENdark/FRlight,768 FRdark,390 ENdark,320 FRlight. Others captured/asserted only. Real homepage routes and200%zoom/text resize remain integration gates.

Isolated Vite production build includes ALL3 new sections and original PNG:1688 modules, emitted troc-card-saver1,489.37kB. This is actual module-bundle inclusion, not integrated homepage acceptance. Root baseline client/SSR previously passed; Design1/A must build/test their wired candidate. Shared HomeSections/globalstyles untouched.

Preview4341/?section=cta&lang=en&theme=dark; demo=false removes disclaimer. About default and section=seller remain stable. Dependency of common styling is About e94e694; seller separate4f9b65c. UX2 independently passed About/seller in PAIR-2/03 report; surrounding homepage/routes/truezoom remain open. CTA now pending UX2 independent review.
