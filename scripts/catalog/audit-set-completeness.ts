import { readFileSync, writeFileSync } from "node:fs";
import { literalFields } from "./literal-fields";
const m = JSON.parse(readFileSync("catalog-data/current.json", "utf8"));
const records = readFileSync(
  "catalog-data/releases/" + m.revision + "/records.jsonl",
  "utf8",
)
  .trim()
  .split("\n")
  .map((r) => JSON.parse(r));
const source = JSON.parse(
  readFileSync("catalog-data/raw/tcgdex-source.json", "utf8"),
);
const expected = new Map<string, { name: string; numbers: Set<string> }>();
const parsed = new Map<string, any>();
for (const [path, text] of Object.entries(source)) {
  if (
    !path.startsWith("data/") ||
    path.split("/").length !== 4 ||
    !path.endsWith(".ts") ||
    path.includes("/Pokémon TCG Pocket/")
  )
    continue;
  const parent = path.slice(0, path.lastIndexOf("/")) + ".ts";
  if (!source[parent]) continue;
  let set = parsed.get(parent);
  if (!set) {
    set = literalFields(source[parent]);
    parsed.set(parent, set);
  }
  const card = literalFields(text as string) as any;
  if (!set.id || !set.name?.en || !card.name?.en) continue;
  let e = expected.get(set.id);
  if (!e) {
    e = { name: set.name.en, numbers: new Set() };
    expected.set(set.id, e);
  }
  e.numbers.add(
    String(card.localId ?? path.split("/").at(-1)!.replace(/\.ts$/, "")),
  );
}
const actual = new Map<string, Set<string>>();
for (const r of records.filter(
  (r) =>
    r.provider === "tcgdex" &&
    r.product.variants.every((v: any) => v.language === "en"),
)) {
  const number = r.product.variants[0].number;
  if (!r.externalId.endsWith("-" + number))
    throw Error("cannot_resolve_exact_source_set");
  const key = r.externalId.slice(0, -number.length - 1);
  if (!actual.has(key)) actual.set(key, new Set());
  actual.get(key)!.add(number);
}
const unmatchedSourceSets = [...actual]
  .filter(([key]) => !expected.has(key))
  .map(([sourceSetId, numbers]) => ({ sourceSetId, numbers: [...numbers] }));
const sets = [...expected].map(([sourceSetId, e]) => ({
  sourceSetId,
  name: e.name,
  expectedEnglishRecords: e.numbers.size,
  importedEnglishRecords: actual.get(sourceSetId)?.size ?? 0,
  missingNumbers: [...e.numbers].filter(
    (n) => !actual.get(sourceSetId)?.has(n),
  ),
  unexpectedNumbers: [...(actual.get(sourceSetId) ?? [])].filter(
    (n) => !e.numbers.has(n),
  ),
}));
writeFileSync(
  "docs/evidence/catalog-integrity/pokemon-source-coverage.json",
  JSON.stringify(
    {
      release: m.revision,
      sourceRevision: JSON.parse(
        readFileSync("catalog-data/tcgdex-revision.json", "utf8"),
      ).revision,
      scope:
        "English physical card entries in pinned TCGdex source, not publisher-certified set/finish completeness",
      unmatchedSourceSets,
      sets,
    },
    null,
    2,
  ),
);
console.log({
  sourceSets: sets.length,
  sourceEnglishRecords: sets.reduce((n, s) => n + s.expectedEnglishRecords, 0),
  imported: sets.reduce((n, s) => n + s.importedEnglishRecords, 0),
  incompleteSourceSets: sets.filter((s) => s.missingNumbers.length).length,
  unmatchedSourceSets,
  unexpected: sets.reduce((n, s) => n + s.unexpectedNumbers.length, 0),
});
