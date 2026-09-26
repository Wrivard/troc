import {
  readFileSync,
  writeFileSync,
  readdirSync,
  openSync,
  readSync,
  closeSync,
} from "node:fs";
import { createHash } from "node:crypto";
import { retainedRecords } from "./promote-local";
const map = new Map<
  string,
  { card: any; cacheFile: string; checksum: string }[]
>();
for (const file of readdirSync("tmp/catalog-cache")) {
  if (!/^[a-f0-9]{64}$/.test(file)) continue;
  const path = "tmp/catalog-cache/" + file;
  const fd = openSync(path, "r");
  const first = Buffer.alloc(1);
  try {
    readSync(fd, first, 0, 1, 0);
  } finally {
    closeSync(fd);
  }
  if (first[0] !== 123) continue;
  try {
    const raw = readFileSync(path);
    const p = JSON.parse(raw.toString());
    for (const c of p.data ?? [p]) {
      if (!c.id || (!c.set && !c.collector_number)) continue;
      const key = String(c.id);
      if (!map.has(key)) map.set(key, []);
      map
        .get(key)!
        .push({
          card: c,
          cacheFile: file,
          checksum: createHash("sha256").update(raw).digest("hex"),
        });
    }
  } catch {
    /* Not a card response. */
  }
}
const { manifest, records } = retainedRecords();
const results: any[] = [];
for (const r of records.filter(
  (r: any) => r.identityOrigin === "preserved-initial-catalogue",
)) {
  const possible = map.get(r.externalId) ?? [];
  const expected = r.product.variants;
  const matches = possible.filter(({ card: c }) =>
    r.provider === "tcgdex"
      ? c.localId === expected[0].number &&
        c.set?.name === r.set.name.en &&
        c.name === r.product.name.en
      : c.collector_number === expected[0].number &&
        c.set_name === r.set.name.en &&
        (c.printed_name ?? c.name) === r.product.name.en &&
        expected.every(
          (v: any) => v.language === c.lang && c.finishes.includes(v.key),
        ),
  );
  const chosen = matches[0];
  let reason: string | undefined;
  if (
    chosen &&
    r.provider === "tcgdex" &&
    !expected.every((v: any) => chosen.card.variants?.[v.key] === true)
  )
    reason = "legacy_finish_not_supported_by_source";
  results.push({
    sourceKey: r.sourceKey,
    status: !chosen
      ? "needs-source-review"
      : reason
        ? "quarantined"
        : "consistent-with-legacy-cached-source",
    reason: reason ?? (!chosen ? "no_matching_retained_response" : undefined),
    evidence: chosen
      ? { cacheFile: chosen.cacheFile, checksum: chosen.checksum }
      : null,
    independentlyVerifiedArtwork: false,
  });
}
const counts = Object.fromEntries(
  [...new Set(results.map((r) => r.status))].map((s) => [
    s,
    results.filter((r) => r.status === s).length,
  ]),
);
writeFileSync(
  "docs/evidence/catalog-integrity/legacy-consistency.json",
  JSON.stringify(
    {
      release: manifest.revision,
      scope:
        "Original cached-source consistency, not independent visual certification",
      counts,
      results,
    },
    null,
    2,
  ),
);
console.log(counts);
