# Remaining public surface review

Integrated baseline: A 16ef87b / application43b32b5, merged into the isolated Design checkout. This continues the earlier section work; hosted database/auth gates do not stop public presentation review.

| Finding | Change | Evidence / status |
| --- | --- | --- |
| H01/H02 | Native Sell/Collect links; internal approval wording removed from hero | 58e5d1f,4 mobile/desktop EN/FR keyboard/new-tab cases; independent targeted pass |
| Game/set hierarchy | Set shortcuts once in hero; results anchor reaches cards; planned collection callout below populated results only | 6054263,12 game/set focus+axe cases and4 empty-set reset cases; independent targeted pass |
| I01–04 | Distinct planned want-list example,151-only binder artwork, contextual info links, footer demo fragment focus/scroll | ee99b83,4 EN/FR mobile/desktop checks; independent targeted pass |
| Pagination | First page removes cursor only, preserves price/sort/locale/store/game | d049f24,4 actual browser round trips; independent targeted pass in UX-AUDIT/16-PUBLIC-RECOVERY-FINAL.md |
| Public fallback | Existing shell and reusable empty state, localized home link, loading status; fetch/retry unchanged | b613ae0/bb981b9,8 response-fixture404/503+retry+axe cases and slow-load recovery; independent targeted pass in UX-AUDIT/16-PUBLIC-RECOVERY-FINAL.md |
| Planned account copy | Notifications, wishlist, alerts and following describe their own inactive purpose | 0e02483,8 EN/FR states; no feature activation |
| Shared empty artwork | GameHero renders no empty shadow/art zone when no approved cards exist; guide example included | e75cdb1;20 game renders and4 guide entries pass |
| H03 | Header advertises listbox despite no suggestion provider | 8c338e7 plain-mode header, default autocomplete preserved;4 header journeys +guide keyboard regressions pass, independent targeted pass in UX-AUDIT/16-PUBLIC-RECOVERY-FINAL.md |

Verification so far: integrated99 tests pass, full build/typecheck/lint pass at0e02483.20 game render checks (all5 games × mobile/desktop × themes) and4 style-guide entry checks pass. Follow-up shared heading/no-artwork changes receive targeted rechecks before final build. Screenshots actually inspected include homepageFRmobile, gamePokemon, Riftbound missing-artwork, want-listFRmobile, error503FRmobile and style-guide editorial desktop. Browser fixtures are clearly synthetic and do not prove server/auth readiness.

Preserved: approved logo/type/palette, hero motion and composition, existing product/cart fixes, actual availability boundaries, all backend/contracts/provider rules. No imports, real transactions, schema changes, auth changes or deployments by Design.

Remaining outside public presentation: authenticated order journeys, seller-team/account-ID configured review and production database/load/readiness gates belong to A and the independent owners. Auditor owns UX-AUDIT reports/index. A retains sole integration/release and shared status ownership. This report is a progress record, not blanket production readiness.


## Candidate and review boundaries

Current application candidate:8c338e7. New section commits after merging A16ef87b:58e5d1f,6054263,ee99b83,d049f24,b613ae0,bb981b9,0e02483,e75cdb1,8c338e7. Integrate these through A; do not push independently. The earlier report remains history of the first lot, not the total scope of this continuation.

Public inventory covered by author/reviewer observations: homepage/navigation/footer; search/game/set result and empty states; full store navigation/product return and pagination; sell/founding information; about/help/condition/developer pages; collection/want-list previews; planned account and seller surfaces; public404/503/loading/retry; style-guide editorial and search examples. Available game coverage includes Pokémon, Magic, Yu-Gi-Oh!, One Piece and Riftbound. Independent verification is limited to each recorded criterion and viewport; all-game render checks are author evidence, not independently inspected screenshots for every combination.

No new motion was added. Existing layered hero and Canadian contrast section were retained; visual edits focus on truthful content, semantic navigation, and removing unused/repeated space. Shared component extensions have style-guide examples. No claims of user research, conversion improvements, actual demand, live seller activity, or production readiness.

Build evidence:99 integrated domain tests passed at0e02483; final typecheck/lint passed at8c338e7. Final production build at8c338e7 passed. Tests are not rerun unchanged merely to increase counts. New browser scripts contain focused regression assertions and fixture boundaries.


Independent verdict checkpoint: UX-AUDIT/15-PUBLIC-REVALIDATION.md and16-PUBLIC-RECOVERY-FINAL.md record targeted PASS for H01/H02, GS01/GS02, I01–04, first-page pagination, public404/503/retry, H03 plain search, no-artwork Riftbound and contextual planned-account copy. Error heading h1 and full style-guide independent support review are not yet claimed; author checks cover them. Authenticated and release gates remain explicit. A should reconcile any later auditor additions before release.
