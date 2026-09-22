import process from "node:process";
import assert from "node:assert/strict";
import { readFile, writeFile } from "node:fs/promises";
const base = process.env.SSR_ORIGIN || "http://localhost:3001";
const evidence = [];
for (const locale of ["en", "fr"]) {
  const response = await globalThis.fetch(
    `${base}/product/pokemon-northern-spark?lang=${locale}`,
    { headers: { cookie: "troc_theme=light" } },
  );
  const html = await response.text();
  assert.equal(response.status, 200);
  assert.ok(html.includes(`lang="${locale}-CA"`));
  assert.ok(html.includes('data-theme="troc-light"'));
  assert.match(html, /<h1/);
  assert.match(html, /rel="canonical"/);
  assert.match(html, /hreflang="fr-CA"/);
  assert.match(html, /name="robots" content="noindex,follow"/);
  assert.match(html, /window\.__TROC_PAGE__/);
  const stylesheet = html.match(
    /rel="stylesheet" href="(\/assets\/[A-Za-z0-9_-]+\.css)"/,
  );
  assert.ok(stylesheet, "SSR must include a built stylesheet");
  // Hosting serves static assets separately from the API-only local SSR server.
  const css = await readFile(
    new URL(`../artifacts/marketplace/dist${stylesheet[1]}`, import.meta.url),
    "utf8",
  );
  assert.ok(
    css.length > 0,
    "SSR stylesheet must exist in the deployment output",
  );
  evidence.push({
    locale,
    status: response.status,
    serverRendered: true,
    canonical: true,
    hreflang: true,
    demoNoindex: true,
  });
}
assert.equal((await globalThis.fetch(`${base}/product/missing`)).status, 404);
assert.match(
  await (await globalThis.fetch(`${base}/robots.txt`)).text(),
  /Disallow: \//,
);
const sitemap = await (await globalThis.fetch(`${base}/sitemap.xml`)).text();
assert.match(sitemap, /<sitemapindex/);
assert.ok(!sitemap.includes("<loc>"));
await writeFile(
  new URL("../verification/ssr-results.json", import.meta.url),
  JSON.stringify(evidence, null, 2) + "\n",
);
console.log(
  "Passed bilingual SSR content, metadata, theme cookie, missing-product status and demo indexing checks.",
);
