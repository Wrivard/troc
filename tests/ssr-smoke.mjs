import process from "node:process";
import assert from "node:assert/strict";
import { writeFile } from "node:fs/promises";
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
  assert.match(html, /rel="stylesheet" href="\/assets\/index-/);
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
assert.match(await (await globalThis.fetch(`${base}/robots.txt`)).text(), /Disallow: \//);
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
