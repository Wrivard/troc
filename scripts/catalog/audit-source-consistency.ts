import { readFileSync, writeFileSync } from "node:fs";
import { createHash } from "node:crypto";
import { literalFields } from "./literal-fields";
import { retainedRecords } from "./promote-local";
const { manifest, records } = retainedRecords();
const archive = JSON.parse(
  readFileSync("catalog-data/raw/tcgdex-source.json", "utf8"),
);
const cached = new Map<string, any>();
const results: any[] = [];
const sha = (b: string | Buffer) =>
  createHash("sha256").update(b).digest("hex");
for (const r of records) {
  if (r.identityOrigin === "preserved-initial-catalogue") {
    results.push({
      sourceKey: r.sourceKey,
      status: "needs-legacy-provenance-review",
    });
    continue;
  }
  const reasons: string[] = [];
  try {
    if (r.provider === "tcgdex") {
      const path =
        "data/" +
        decodeURIComponent(
          new URL(r.sourceUrl).pathname.split("/data/")[1] ?? "",
        );
      const text = archive[path];
      if (typeof text !== "string") throw Error("pinned_source_missing");
      if (sha(text) !== r.rawHash) reasons.push("source_hash_mismatch");
      const card = literalFields(text) as any;
      const setPath = path.slice(0, path.lastIndexOf("/")) + ".ts";
      const set = literalFields(archive[setPath]) as any;
      const number = String(
        card.localId ?? path.split("/").at(-1)!.replace(/\.ts$/, ""),
      );
      if (r.externalId !== set.id + "-" + number)
        reasons.push("external_identity_mismatch");
      if (r.product.name.en !== card.name.en) reasons.push("name_mismatch");
      if (r.set.name.en !== set.name.en) reasons.push("set_name_mismatch");
      for (const v of r.product.variants)
        if (v.number !== number || v.language !== "en")
          reasons.push("printing_mismatch");
    } else if (r.provider === "scryfall") {
      if (!/^[a-f0-9]{64}$/.test(r.rawHash)) throw Error("invalid_raw_hash");
      if (!cached.has(r.rawHash)) {
        const raw = readFileSync("catalog-data/raw/" + r.rawHash);
        if (sha(raw) !== r.rawHash) throw Error("source_hash_mismatch");
        const payload = JSON.parse(raw.toString());
        cached.set(
          r.rawHash,
          new Map((payload.data ?? [payload]).map((c: any) => [c.id, c])),
        );
      }
      const card = cached.get(r.rawHash).get(r.externalId);
      if (!card) throw Error("source_card_missing");
      if (r.product.name.en !== card.name) reasons.push("name_mismatch");
      if (r.set.name.en !== card.set_name) reasons.push("set_name_mismatch");
      for (const v of r.product.variants) {
        if (v.language !== card.lang || v.number !== card.collector_number)
          reasons.push("printing_mismatch");
        if (!card.finishes.includes(v.key)) reasons.push("unsupported_finish");
      }
    } else throw Error("unsupported_source");
    results.push({
      sourceKey: r.sourceKey,
      status: reasons.length
        ? "quarantined"
        : "consistent-with-retained-source",
      reasons,
    });
  } catch (e) {
    results.push({
      sourceKey: r.sourceKey,
      status: "quarantined",
      reasons: [String(e)],
    });
  }
}
const counts = Object.fromEntries(
  [...new Set(results.map((r) => r.status))].map((s) => [
    s,
    results.filter((r) => r.status === s).length,
  ]),
);
writeFileSync(
  "docs/evidence/catalog-integrity/source-consistency.json",
  JSON.stringify(
    {
      release: manifest.revision,
      generatedAt: new Date().toISOString(),
      scope:
        "metadata consistency with retained source; not independent visual/artwork certification",
      counts,
      results,
    },
    null,
    2,
  ),
);
console.log(counts);
