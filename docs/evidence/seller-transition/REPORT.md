# Seller transition fallback repair

User symptom: a lone Loading… appears in the upper-left when switching seller pages, instead of existing preload components.

## Reproduction / causes
Holding SellerSettings route code produced visible main text exactly Loading… and zero seller skeletons (before.json). The outer Suspense boundary wrapped WorkspaceBoundary, replacing the whole seller workspace while a child module loaded. The separate session-loading branch showed Opening your workspace… instead of seller geometry. Settings and team initial data reads also retained plain loading paragraphs. Initial index HTML has an empty root, not the reproduced Loading label.

## Fix
Move route Suspense inside WorkspaceBoundary so authorized SellerShell remains mounted while its child code loads. Shared SellerRouteLoading provides localized headings/chrome and existing SellerLoading shapes. During auth verification, use only public skeleton geometry, including a placeholder sidebar; do not mount SellerShell or protected data readers before permission success. Inventory/overview and seller-order-detail lazy boundaries also use the appropriate fallback. Replace settings/team initial data paragraphs with skeletons; retain status messages for actual actions and scoped conversation loads.

## Verification
scripts/check-seller-transition.cjs navigates native seller sidebar links with account response and destination code held independently, covering all11destinations: overview, settings, team, orders, messages, inventory, analytics, payouts, promotions, storefront and help. EN1440/FR390 samples, reduced motion. Each shows auth skeleton with zero private reads, keeps workspace navigation once authorized, shows chunk skeleton without the plain Loading label and settles without overflow. Settings/team data responses additionally held separately to test their initial-data skeletons. Mobile tests invoke the same sidebar href programmatically; this is not a new mobile-drawer interaction audit.

Desktop settings and mobile French team chunk screenshots inspected. No full-page visual or hosted-performance certification. Existing anonymous access, operations503 retry, directory503 retry and empty directory regression passes. Frontend types, scoped lint and client+SSR build pass. No stock/money/auth policy changes, remote deployment or real mutations.

Files: SellerRouteLoading.tsx, main.tsx, Workspace.tsx, SellerSettings.tsx, SellerTeam.tsx, seller-loading.css. Evidence under docs/evidence/seller-transition/{before.json,after.json,settings-chunk.png,team-chunk.png}; existing seller-loading/access-recovery.json refreshed. Original reproducer remains historical; use check-seller-transition.cjs for regression.
