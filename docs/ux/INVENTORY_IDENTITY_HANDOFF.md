# Inventory identity — DI01

Existing API language, finish and collector number now appear in each listing's checkbox label, before editing controls. Known catalog finish/language labels reuse the catalog copy; unknown values remain visible and missing fields are omitted. No backend, mutation, selection, price or quantity logic changed.

Author validation: marketplace typecheck, workspace lint and client/SSR builds pass. tests/inventory-identity-preview.mjs passes 12 synthetic browser cells: 320/390/1440 × EN/FR × light/dark. Every API is intercepted; attempted writes return503. Each cell checks distinct Standard/Reverse identity, absent/unknown metadata, no horizontal overflow, correct selected row and exact save payload (design-reverse/version2/quantity4/price17 cents), and retained edits after failure. First test attempt used an incorrect alert selector; corrected to the existing status region, with no application change.

Captured all12 cells in ignored verification/di01-*.png. Actually inspected full320 EN light, plus readable detail crops390 FR dark,1440 EN light and320 FR light. Identity wraps naturally without ellipsis; Standard/Reverse remain distinct on desktop and metadata appears before fields. Remaining full-matrix visual judgment belongs to independent UX33 retest. These fixtures do not prove hosted authentication or database writes. Candidate source is frozen for that review.

Previous independent closures: UX34 CP01 and UX35 DA01/DA02 PASS exact account3e4c12f; A reports integrated3f47864 with source equivalence. Expanded DESIGN-VISION homepage/product work follows in separate owned files.
