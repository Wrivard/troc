# Marketplace compositions

Implementation: `src/components/ui/interactive-card-stack.tsx`, `marketplace-compositions.tsx`; styles: `scripts/components/marketplace-compositions.css`; examples: `src/preview/pages/editorial.tsx`.

- InteractiveCardStack: at most three caller-supplied art nodes, lead first, optional caption/compact mode. Perspective1200; Z64/20/−18. Fine mouse only; rAF interpolation; offscreen cancellation; reduced-motion/static touch; single bounded idle settle.
- ProductArtworkPanel: shared, weaker tilt around arbitrary caller-provided gallery; no data fetching or forced image crop.
- MarketplaceProductCard: one link with image, title, metadata, price, availability and optional reference. Do not nest buttons/links. Missing prices and missing art are supplied through existing primitives.
- GameTile: destination link, translated descriptor, art or fallback. GameHero: compact intro, shortcuts and supplied game-specific art; heading level1 or2.
- SmartCartComparison: caller-supplied integer-cent cards/shipping/seller counts, locale and labels; presentation arithmetic only, not an optimizer. Demo examples must be labelled.
- SellerPreviewCard: whole-link seller identity, representative cover, avatar, detail, optional thumbnails and action. Never invent feedback or sales.
- StoreHero: cover with configurable CSS focal point; identity/avatar outside clipped cover. Level1 or2. Caller supplies honest verification and action states.
- PremiumEmptyState: translated title/explanation/actions, optional visual; default card-back visual is decorative.

All styles use approved semantic tokens. EN/FR and both themes are demonstrated; keyboard focus, touch, reduced-motion and unclipped avatar behavior are browser checked. The marketplace owns catalog fetches, formats, links, actions and any domain rules.

## ProductPurchaseSummary — UX audit 01

Translated printing, available price, seller availability, explicit offer-selection action and shipping caveat. The caller owns navigation/focus; the component never selects a seller or adds to cart. Reference/median prices belong outside this purchase summary. The editorial guide demonstrates the composition. Existing SellerOfferRow accepts an optional seller-specific accessible action name; quantity labels remain caller supplied.

## MarketplaceJourney and complete store artwork

MarketplaceJourney renders an ordered sequence of caller-supplied id/title/description/illustration, with full-width supporting art and natural mobile stacking. The editorial guide shows a bilingual three-step example. It has no navigation, animation or commerce behavior. StoreHero optionally accepts bannerFit="contain" to preserve complete artwork with dark framing; default cover behavior remains. At narrow mobile sizes, identity and actions use the available width beneath the avatar.
