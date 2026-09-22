# Latest user backdrop correction

Supersedes the hero-panel and white values-strip treatment in1ae19f9/UX41. Hero background now transparent with no panel radius; values strip uses transparent background and no forced light theme. Both inherit actual page background. Content, approved tokens, spacing and actions retained. Broader section-rhythm work remains separate.

Author tests/home-backdrop-preview.mjs PASS8 ENFR390/1440 light/dark cells: actual backgrounds transparent, no forced-light class and no horizontal overflow. Captured16 images; actually opened verification/home-backdrop-390-fr-dark-rail.png and home-backdrop-1440-en-light-hero.png. Dark values remain readable without white fill; light hero blends into grey page. Local client/SSR build passes. Independent targeted recheck requested; no earlier PASS used to retain rejected treatment.
