# Store cover framing and hero resolution

Candidate follows 47a31c0. Presentation only; A integrates, UX independently reviews.

- Correct existing three demo store identities/assets preserved. Detail cover now fills its full available width with a 5:2 desktop /16:9 mobile cover frame. Home image frames remain uniformly16:9 and now crop rather than letterbox. Demo-only Card Forge focal position50%0% preserves its emblem; other/unknown/real sellers50%50%. No uploader/persistence/backend changes.
- Hero source is the supplied canadian-marketplace-2x-v1.webp (3344x1882,349694bytes). Original retained. Provenance: original1672x941, deterministic Lanczos2x and mild sharpening, WebP96; no AI detail restoration. No geometry/CSS changes to hero.

Author verification: marketplace typecheck, workspace lint, client and SSR builds PASS. Initial harness browser-global lint corrected. Formatter-only CSS churn removed before handoff. Focused browser test tests/store-cover-framing-preview.mjs PASS: all3store detail routes at1672ENdark/DPR2 and390FRlight, cover widths1376/358, no overflow, home frames443x249/358x201, actual hero natural dimensions3344x1882. Existing hero-alignment-preview PASS with unchanged frontcard1015/176.6 and search92/524.5/680x70. No server restarted; existing UI4313 used. API listener observed21784, UI38852.

Actually inspected: store-category-asset-contact.jpg (supplied artwork); store-frames-review.jpg (all3desktop/mobile); hero-upscale-review.jpg (new high-DPI hero render); store-frames-final-review.jpg (corrected Card Forge desktop emblem and all3home frames desktop/mobile). Full captures remain local verification/store-frame-{0,1,2}-{1672,390}.png and store-frames-home-{1672,390}.png. JSON verification/store-cover-framing.json. Screenshots excluded from commit.

Independent UX retest pending. No integration/push/deployment claim. Next separate lot: illustrative demo-only stats, supplied category backgrounds plus genuine game backs, static page-background grain. Supplied category backgrounds visually inspected: contain thematic symbols but no card art. Card backs still being located; no generated substitutions.