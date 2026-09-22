# Card artwork in the visual examples

These static reference images were downloaded on 2026-09-21 for the style guide.
They are not connected to a card catalog, inventory, live pricing, or sales API.
Demo prices, sellers, ratings, and stock figures are illustrative.

| Asset | Printed identity | Source |
|---|---|---|
| `charizard-ex.webp` | Charizard ex, Scarlet & Violet—151, 199/165 | [TCGdex](https://api.tcgdex.net/v2/en/cards/sv03.5-199), [image](https://assets.tcgdex.net/en/sv/sv03.5/199/high.webp) |
| `pikachu.webp` | Pikachu, Scarlet & Violet—151, 173/165 | [TCGdex](https://api.tcgdex.net/v2/en/cards/sv03.5-173), [image](https://assets.tcgdex.net/en/sv/sv03.5/173/high.webp) |
| `lightning-bolt.jpg` | Lightning Bolt, Magic 2011, 149 | [Scryfall](https://scryfall.com/card/m11/149/lightning-bolt), [image endpoint](https://api.scryfall.com/cards/m11/149?format=image&version=normal) |
| `luffy.png` | Monkey D. Luffy, OP05-060 | [OPTCG reference image](https://image.optcg.gg/images/en/OP05-060.png) |

Working copies live under `src/assets/cards/`; original downloads are also
retained under the workspace's `attached_assets/catalog-references/`. The
style-guide-only module `src/preview/demo-assets.tsx` exposes the bundled URLs.
Reusable product components receive their image URLs through props.

Card artwork and game marks belong to their respective publishers and artists.
These references do not grant a license for other uses or imply endorsement.