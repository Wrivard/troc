# Google sign-in brand assets

Retrieved2026-09-23 from official Google sources, for the existing TROC Google-auth action only. This is a custom button following published guidance, not a claim of Google review/certification.

- Guidance: https://developers.google.com/identity/branding-guidelines — recommends localized Continue with Google, standard gradient G onwhite, GoogleSansMedium14/20, lightfill#FFFFFF/text#1F1F1F/border#747775,12px leadingpadding/10px logotextgap. Button uses44px minimumheight for accessibility; Google G remains20px, unstretched/unrecolored. Approved TROC focusoutline added outside control.
- Official bundle: https://developers.google.com/static/identity/images/signin-assets.zip . Source retained byte-for-byte as google-icon-button-source.png from Android + Web/PNG @4x/Light/Theme=Light, Show text=No, Shape=Square, Platform=Android+Web@4x.png (160x160). google-g.png extracts central80x80 at40,40, removing only outer button chrome/whitespace, preserving original G pixels/colors; displayed20x20. No red/monochrome substitute or recreated mark.
- Font stylesheet: https://fonts.googleapis.com/css2?family=Google+Sans:wght@500&display=swap&text=Continue%20with%20Google%20Continuer%20avec%20Google . Official5,476byte TTF subset for exactexistingENFRlabels, locallybundled; no runtime GoogleFonts request. Fullfont1.9MB deliberately replaced. If labels change, request the appropriate officialsubset; do not silently fall back for unsupportedglyphs.
- Fontlicense: Google-Sans-OFL.txt, obtained https://raw.githubusercontent.com/google/fonts/main/ofl/googlesans/OFL.txt . Font copyright2025GoogleSansProjectAuthors, SILOpenFontLicense1.1. This license applies to the font, not the Google trademark. Asset use remains subject to Google's brandingguidelines.

No Google Identity SDK script added; A's Supabase/controller remains the only authentication implementation.
