# Homepage motion continuation

No-change local review: existing reduced-motion behavior works. scripts/check-home-motion.cjs checks1440EN/390FR while switching media preferences at runtime. After the homepage data state is ready: all running CSS animations stop, html scrolling becomes auto, Smart Cart/About/community/CTA text stays identical and the Smart Cart link remains keyboard-focusable. Returning to normal preference restores smooth scrolling. Existing composition and data preserved; no added decorative loop. This does not certify every animation across all routes or constitute user testing.

Evidence: check.json. Next ready: D14 uncovered actual zoom/image behavior; consult prior coverage before repeating asset tests. D08 subjective reference/motion acceptance remains distinct from verified accessibility behavior.
