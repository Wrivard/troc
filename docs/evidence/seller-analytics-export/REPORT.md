# Bounded source-order export

GET /seller/platform/:seller/analytics-export reuses Analytics management permission and period/dataset/asOf scope. Response: CSV, safe generated filename, row count and asOf. Existing no-store and request rate limit apply. One SQL SELECT orders by exact timestamp and UUID, limits10001 to detect overflow, and excludes pending/cancelled orders consistently with Analytics. Export reflects statement-time state; it is not a historic snapshot pinned by asOf or a payout report.

CSV has source order ID, UTC microsecond timestamp, buyer, gross CAD, refunds CAD, status and sample marker. Quoting handles commas/quotes/newlines, formula-leading text is neutralized, BigInt cents formatting avoids floating point loss. No messages/artwork/line arrays are fetched. Row cap10000 and file cap5MiB reject before the response is returned; JSON transport overhead is separate from CSV size. Very large per-row source fields can still be read before byte rejection; hosted memory/time/load are not certified. Beyond-cap exports need a separate asynchronous design.

UI explicitly distinguishes source CSV from already delivered daily totals; shows caps and current-value semantics, pending/failed/oversized/success feedback. Scope-keyed component suppresses downloads after seller/period/dataset change or unmount. No automatic page-fetch loop, stock/money mutation or external message.

Verification:
- Expanded seller-analytics-summary.test.ts passes:6period/dataset scopes match expected IDs/counts on420orders; CSV formula/quote protection, max-safe integer cents exact string,5MiB byte rejection, injected10001-row guard, role rejection, HTTP200/no-store. Existing Analytics regression/access/cursor tests remain passing.
- check-seller-analytics-export.cjs: EN1440/FR390,422shows explanation and creates no file; retry downloads CSV; pending button disabled; changing period discards delayed old export; no page overflow. check.json. FR screenshot inspected.
- check-seller-analytics-export-live.cjs:8persisted sample orders downloaded through real local endpoint. live.json. API59376verified and replaced by46528, ready log checked before smoke; no new migrations.
- API/frontend types, scoped ESLint, API/client/SSR builds pass. No remote/production action.

Next: reconcile residual scale gates and inspect existing team/settings journey against original requirements; do not recreate delivered screens. Async large exports, hosted capacity and message activity/unread projections remain open.
