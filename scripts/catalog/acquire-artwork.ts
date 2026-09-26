import { cacheArtwork } from "./artwork-cache";
import { physicalCatalogueRecord } from "./catalog-scope";
import { existsSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";
import { db, json, publish } from "./store";
const records = db
  .prepare(
    "SELECT payload FROM records WHERE provider IN ('tcgdex','scryfall') ORDER BY product_id",
  )
  .all()
  .map((r) => JSON.parse(String(r.payload)))
  .filter(physicalCatalogueRecord);
const sets = new Map<string, any[]>();
for (const r of records)
  if (r.provider === "tcgdex" && !r.product.images?.length) {
    const language = r.product.variants[0].language;
    const set = r.externalId.slice(0, r.externalId.lastIndexOf("-"));
    const key = language + "/" + set;
    sets.set(key, [...(sets.get(key) ?? []), r]);
  }
const missing: any[] = [];
for (const [key, group] of sets) {
  try {
    const [language, set] = key.split("/");
    const response = await json(
      "https://api.tcgdex.net/v2/" +
        encodeURIComponent(language) +
        "/sets/" +
        encodeURIComponent(set),
    );
    const cards = new Map(
      (response.data.cards ?? []).map((c: any) => [c.id, c]),
    );
    db.exec("BEGIN");
    for (const r of group) {
      const card = cards.get(r.externalId) as any;
      if (!card?.image) {
        missing.push({
          sourceKey: r.sourceKey,
          reason: "provider_has_no_image",
        });
        continue;
      }
      const base = new URL(card.image);
      if (base.protocol !== "https:" || base.hostname !== "assets.tcgdex.net")
        throw Error("unexpected_image_host");
      r.artwork = [{ side: "front", url: card.image + "/high.webp" }];
      db.prepare("UPDATE records SET payload=? WHERE source_key=?").run(
        JSON.stringify(r),
        r.sourceKey,
      );
      db.prepare(
        "INSERT OR IGNORE INTO assets(source_url,state) VALUES(?,'pending')",
      ).run(r.artwork[0].url);
    }
    db.exec("COMMIT");
  } catch (error) {
    try {
      db.exec("ROLLBACK");
    } catch {}
    missing.push({ set: key, reason: String(error) });
  }
}
console.log(
  JSON.stringify({
    phase: "resolved",
    sets: sets.size,
    missing: missing.length,
  }),
);
const urls = [
  ...new Set(
    records
      .filter((r) => !r.product.images?.length)
      .flatMap((r) => (r.artwork ?? []).map((a: any) => String(a.url))),
  ),
] as string[];
let completed = 0,
  failed = 0,
  reused = 0,
  index = 0;
async function worker() {
  while (index < urls.length) {
    const url = urls[index++];
    const row = db
      .prepare("SELECT state,payload FROM assets WHERE source_url=?")
      .get(url);
    if (row?.state === "ready") {
      const payload = JSON.parse(String(row.payload));
      if (
        payload.sources.every((s: any) =>
          existsSync(resolve("artifacts/marketplace/public", s.url.slice(1))),
        )
      ) {
        reused++;
        continue;
      }
    }
    try {
      await cacheArtwork(url);
      completed++;
    } catch (error) {
      failed++;
      db.prepare(
        "UPDATE assets SET state='failed',error=?,attempts=attempts+1 WHERE source_url=?",
      ).run(String(error).slice(0, 600), url);
    }
    if ((completed + failed) % 200 === 0)
      console.log(
        JSON.stringify({ completed, failed, reused, total: urls.length }),
      );
  }
}
await Promise.all(Array.from({ length: 8 }, () => worker()));
const manifest = publish({
  providers: ["tcgdex", "scryfall"],
  includeImages: true,
});
writeFileSync(
  "docs/evidence/catalog-scale/artwork-acquisition.json",
  JSON.stringify(
    {
      completedAt: new Date().toISOString(),
      completed,
      failed,
      reused,
      requested: urls.length,
      missing,
      manifest,
    },
    null,
    2,
  ),
);
console.log({ completed, failed, reused, missing: missing.length });
db.close();
