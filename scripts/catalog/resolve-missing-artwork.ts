import { readFileSync, writeFileSync } from "node:fs";
import { db, json, publish } from "./store";
import { cacheArtwork } from "./artwork-cache";
const manifest = JSON.parse(readFileSync("catalog-data/current.json", "utf8"));
const missing = readFileSync(
  `catalog-data/releases/${manifest.revision}/records.jsonl`,
  "utf8",
)
  .trim()
  .split("\n")
  .map((r) => JSON.parse(r))
  .filter((r) => r.provider === "tcgdex" && !r.product.images?.length);
const results: { sourceKey: string; state: string; error?: string }[] = [];
let index = 0;
async function worker() {
  while (index < missing.length) {
    const r = missing[index++];
    try {
      const language = r.product.variants[0].language;
      const { data } = await json(
        `https://api.tcgdex.net/v2/${language}/cards/${encodeURIComponent(r.externalId)}`,
      );
      if (
        data.id !== r.externalId ||
        data.localId !== r.product.variants[0].number
      )
        throw Error("source_identity_mismatch");
      if (!data.image) {
        results.push({
          sourceKey: r.sourceKey,
          state: "provider_has_no_image",
        });
        continue;
      }
      const url = new URL(data.image);
      if (url.protocol !== "https:" || url.hostname !== "assets.tcgdex.net")
        throw Error("unexpected_image_host");
      r.artwork = [{ side: "front", url: data.image + "/high.webp" }];
      db.prepare(
        "INSERT OR IGNORE INTO assets(source_url,state) VALUES(?,'pending')",
      ).run(r.artwork[0].url);
      await cacheArtwork(r.artwork[0].url);
      db.prepare("UPDATE records SET payload=? WHERE source_key=?").run(
        JSON.stringify(r),
        r.sourceKey,
      );
      results.push({ sourceKey: r.sourceKey, state: "recovered" });
    } catch (e) {
      results.push({
        sourceKey: r.sourceKey,
        state: "unresolved",
        error: String(e),
      });
    }
    if (results.length % 50 === 0)
      console.log({ checked: results.length, total: missing.length });
  }
}
await Promise.all(Array.from({ length: 4 }, worker));
const next = publish({
  providers: ["tcgdex", "scryfall"],
  includeImages: true,
});
writeFileSync(
  "docs/evidence/catalog-scale/missing-artwork-detail.json",
  JSON.stringify({ results, manifest: next }, null, 2),
);
console.log({
  checked: results.length,
  recovered: results.filter((r) => r.state === "recovered").length,
  unresolved: results.filter((r) => r.state === "unresolved").length,
});
db.close();
