import { db, publish } from "./store";
import { cacheArtwork } from "./artwork-cache";
import { physicalCatalogueRecord } from "./catalog-scope";
import { writeFileSync } from "node:fs";
const allowed = new Set(
  db
    .prepare("SELECT payload FROM records WHERE provider='tcgdex'")
    .all()
    .map((r) => JSON.parse(String(r.payload)))
    .filter(physicalCatalogueRecord)
    .flatMap((r) => (r.artwork ?? []).map((a: any) => a.url)),
);
const results = [];
for (const row of db
  .prepare("SELECT source_url,error FROM assets WHERE state='failed'")
  .all()) {
  const url = String(row.source_url);
  if (!allowed.has(url) || !/source_http_(404|503)/.test(String(row.error)))
    continue;
  let recovered = false;
  const attempts = [];
  for (const format of (String(row.error).includes("source_http_404") ? ["high.png", "low.webp"] : ["high.webp"])) {
    const alternate = url.replace(/high\.webp$/, format);
    try {
      await cacheArtwork(url, alternate);
      recovered = true;
      attempts.push({ url: alternate, success: true });
      break;
    } catch (error) {
      attempts.push({ url: alternate, error: String(error) });
    }
  }
  results.push({ url, recovered, attempts });
}
const manifest = publish({
  providers: ["tcgdex", "scryfall"],
  includeImages: true,
});
writeFileSync(
  "docs/evidence/catalog-scale/artwork-recovery.json",
  JSON.stringify({ results, manifest }, null, 2),
);
console.log(results);
db.close();
