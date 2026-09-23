# Global search presentation harness

Isolated developer-only entry point; not imported by the marketplace router/header. No search engine, request debounce, ranking, authentication or persistence is implemented here. Text entry is echoed exactly, while fixed supplied groups remain visible in the results scenario.

`fixtures.json` is a bounded snapshot captured2026-09-23 from the existing approved local demo API: `/api/catalog/page?path=/search&lang=en&q=BP02-EN179` and `/api/catalog/page?path=/search&lang=en&type=sealed`. One matching card, two existing sealed products, related sets/games and two existing fictional sellers. Original canonical IDs, product names, prices and available artwork provenance retained. No provider request, scraping or invented collector number/reputation. Source artwork is served from the unchanged marketplace public directory. Fixture image URLs may be absent; approved neutral icons represent absent images.

From artifacts/marketplace:

```
node ../../node_modules/.pnpm/vite@7.3.6_@types+node@25.9_4aa3f31c6ec2040a2842a601e7a4a735/node_modules/vite/bin/vite.js --config src/modules/global-search/harness/vite.config.ts --configLoader runner
```

Port4314 is dedicated to this harness. Verify free before starting. Add `build` before `--config` to build only this harness into worktree verification/global-search-dist. Never publish this harness as product UI.

URL controls: `?lang=fr&theme=light&q=BP02-EN179`. Scenario buttons select results/loading/empty/error. By default destination callbacks are displayed in an output element. `&navigate=1` uses native destination navigation. Destinations point to existing preview4313 routes, including `/sets/:slug`; port4313 must be available for destination checks.

From the worktree root: `node tests/global-search-presentation-preview.mjs` and `node tests/global-search-accessibility-preview.mjs`. Screenshots and JSON evidence stay local in verification/. Independent reviewers can reproduce against the frozen source.
