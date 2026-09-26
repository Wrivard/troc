# D14 retained artwork source sample

2026-09-24, solo local read-only browser/API review. No application or catalogue changes.

scripts/check-artwork-game-sample.cjs queries at most12existing results for each of the five listed games, then tests the first illustrated candidate at1440EN and390FR. Pokémon, Magic and Yu-Gi-Oh pass: decoded natural image dimensions, preserved ratio, object-fit contain, frame containment, no horizontal overflow, keyboard-focusable full-image link, and displayed source/full-image URL belonging to the exact recorded image ID and its permitted renditions. IDs/URLs/metrics retained in check.json.

One Piece and Riftbound returned no illustrated candidate in this bounded query. This is not proof the underlying catalogue contains no artwork and is not coverage of those games; no imports attempted. Discovery filters and temporary missing-art policy remain unchanged.

Actually inspected pokemon-mobile.jpg (AZ’s Tranquility): complete card and French full-image link/provenance visible. Other sampled images were browser-measured, not individually visually inspected. No exhaustive catalogue/variant or screen-reader certification. Prior404/transparent/loading/cart tests were not repeated.

Actual desktop browser zoom remains unverified. Viewport resizing or device/pinch scaling is not substituted as proof of desktop zoom. Next ready bounded check: multiple-image gallery side selection across product/variant changes using an isolated fixture; verify current aria-pressed/image/link stay in sync. Preserve imagesForVariant precedence and all canonical identity rules.
