# TROC design quality review — 2026-09-22

Scope: the two user-supplied design-quality/reviewer briefs. This is a design pass over existing Milestones 1–3, not authorization for new marketplace business features. Milestone 3.5 is developed separately. The approved logo, typography, semantic palette, Canada story and footer remain the visual baseline.

## Screenshot review and iteration

Local evidence is retained under `verification/quality-before`, `quality-iteration1`, `quality-iteration2`, and `quality-final` (screenshots are intentionally excluded from Git). Each capture covers 18 important routes at 1440 and 390 px, with full-page and first-screen views and individual homepage sections. The first iteration completed desktop but stopped on a hidden mobile image; the capture was corrected. Initial captures could precede the React image paint; final captures wait for fonts, image decoding and paint. Artwork validation independently verifies decoded local assets.

The route matrix additionally checks 50 routes at 390/768/1280/1920 in EN dark and FR light. Separate art checks cover both languages and both themes, and dedicated checks cover 375/430/1024/1600, touch, motion and the guide. These are automated checks, not a claim of manual inspection of every pixel of every route.

## Critical route review

| Route / section | Strongest baseline element | Weakness / hierarchy / brand problem | Change and resulting behavior | Remaining limitation |
|---|---|---|---|---|
| Homepage hero | Approved wordmark and direct search-first headline | Art felt flat; lead identity weak; pointer depth too small | DOM perspective stack, Pokémon in front, three distinct depth layers, eased pointer tracking; no new palette | Bounded demo selection, not personalized inventory |
| Homepage game destinations | Five clear destinations | Small tile treatment resembled navigation | Larger card-led destinations, category descriptors and contextual arrow | One Piece/Riftbound lack approved catalog art; honest fallback retained |
| Discovery / cheap singles | Real 5¢ offers and approved card art | Generic wide grey buttons competed with price | Whole-card links, larger art, FROM price and quiet reference | Demo prices and stock remain clearly disclosed |
| How it works | Useful three-step sequence | Text-only explanation felt generic | Small search, seller and cart examples; all illustrative | First visual iteration exposed unequal top padding; corrected in second iteration |
| Smart Cart story | Useful shipping premise | Savings needed an immediate explanation | $6.75+$7.50 → $7.22+$4.00; $14.25→$11.22; $3.03 saved with three sellers→one | Illustrative tested arithmetic, not a promise for all baskets |
| Canada story / footer | Strong light contrast and distinctive brand rhythm | No material reason to redesign | Preserved composition, copy, navigation and legal hierarchy | No invented Canadian storefront photography |
| Seller discovery | Real demo seller identities | Plain placeholders lacked store character | Cover, avatar, location, sample cards and exploration action | Sample thumbnails are labelled; no fabricated sales or feedback |
| `/search` | Useful same-offer filters | Form-heavy boxed layout; important condition/price hidden | Open desktop filter rail with condition/max price, secondary More filters; collapsed mobile panel | Native disclosure, not a custom drawer; query units remain explicitly cents |
| `/games/pokemon`, `/games/magic`, set page | Correct catalog identity | Generic page introduction | Compact game-specific art hero and set shortcuts | Full set navigation remains available below |
| `/product/:slug` | Real artwork and functioning offers | Vertical data dump; artwork and decisions disconnected | Sticky artwork beside identity/offers, quieter metadata, stronger seller identity, compact 7/30/90 reference chart | Full-image link retained; not a newly built zoom modal. Reference history remains external/demo data |
| Product mobile | Large art | First revised screenshot put name below image | Title now precedes art; offer rows wrap into usable groups | Art deliberately remains large rather than thumbnail-sized |
| `/store/cartes-du-nord` | Seller location and minimums | Small cover; repeated store name; weak avatar placement | 280px desktop cover, focal-point support, avatar outside clipping, strong name/profile and underlined tabs | Cover art and initials are demo branding. No fake trust metrics; following remains planned |
| `/sell` | Clear Canada-first proposition | Text chapters without product evidence | Reusable storefront preview with real approved demo art | Seller workflows remain owned by separate milestone work |
| `/founding-sellers` | Locked 250 / Pro offer | Benefit hierarchy too quiet | Prominent 250 spots / Pro forever block and application-review-approval sequence | Applications remain not open; no invented live enrollment |
| `/collection`, `/want-lists` | Honest roadmap status | Abstract empty placeholders | Real card binder preview, 162/207, 78%, 45 missing, explicit illustrative/planned labels | No collection ownership or matching implemented; button stays disabled |
| `/sign-in`, `/sign-up`, `/account` | Simple existing forms | Unused desktop space | Two-column brand/form composition, form-only mobile | Hosted authentication activation is a separate service dependency |
| `/cart`, `/smart-cart`, `/checkout` empty | Honest demo and service messages | Bare empty paragraph | Shared illustrated empty state and useful browse action | Account-dependent checkout remains unavailable on the public demo |
| `/account/orders` | Working authenticated test history | Empty history lacked a clear next action | Shared designed empty state where an authenticated account has no orders | Signed-out/service errors remain explicit rather than disguised as empty history |
| Populated cart / checkout / order | Working multi-seller flow | Dense by necessity | Preserved working logic and validated current layouts | No business-rule changes in this pass |
| Messages / notifications / other planned routes | Honest roadmap status | Still less rich than active marketplace pages | Reviewed in route matrix; existing planned explanations retained | These remain intentionally planned, not fake active empty inboxes |

## Components and interaction

New shared compositions: InteractiveCardStack, MarketplaceProductCard, GameTile, GameHero, SmartCartComparison, SellerPreviewCard, ProductArtworkPanel, StoreHero, PremiumEmptyState. All are demonstrated on the existing editorial style-guide page. App-only catalog previews supply catalog data; the design system does not fetch business data.

Stack depth: perspective 1200px; layer translations 64px, 20px, −18px. Pointer input is clamped to ±6° Y / ±4.5° X; layers respond differently. RequestAnimationFrame interpolation avoids React renders for pointer movement. Mouse leave eases back; observer disables offscreen work. Touch and reduced motion disable tracking. Idle movement is a single calm 4.8-second settling motion, not an endless loop. Existing approved icon family and focus treatments are reused.

## Evidence and release

- 59 domain/database tests passed.
- Typecheck passed as part of full workspace production build.
- ESLint passed through its Node entry point. A concurrent package-tool shim rewrite temporarily broke `pnpm lint`; no source lint errors remained.
- Full workspace production build passed after allowing esbuild its required subprocess filesystem access.
- Vercel production build passed.
- 12 authenticated local commerce browser cases passed across EN/FR, light/dark, mobile/tablet/desktop.
- 96 real-art cases passed, including variant context and approved image loading.
- 8 stack/motion/style-guide accessibility cases passed.
- Wider route, preference, touch and live checks are recorded in the final release update below.

## Honest remaining weaknesses

This is a stronger demo marketplace, not a fully branded live seller network. Two game destinations have no approved imagery, seller branding uses representative art/initials, and public authenticated commerce requires service activation. Roadmap pages intentionally retain disabled planned controls. The native mobile filter disclosure is functional but not the richer drawer experience described as a preference in the brief. No production catalog scraping, payments, fabricated metrics or new milestone scope was introduced.

### Final local gate

400 responsive route cases, 96 image cases, 12 commerce flows, 8 motion/guide cases and 8 preference/guide-parity combinations passed. Additional 375/430/1024/1600 tests passed for touch capability, unclipped avatars and no-results; keyboard whole-card activation and mobile title-first order passed. Final human screenshot review covered the homepage sections, full-route composition sheets, mobile first screens and product/store/binder/auth details. These passed layout/contrast checks without claiming that planned surfaces are live features.
