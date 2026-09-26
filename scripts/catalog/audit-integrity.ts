import { readFileSync, writeFileSync, mkdirSync } from "node:fs";
import { createHash } from "node:crypto";
import { makeBaseline, auditIdentities, identity } from "./identity-integrity";
const manifest = JSON.parse(readFileSync("catalog-data/current.json", "utf8"));
if (!/^[a-f0-9]{64}$/.test(manifest.revision)) throw Error("invalid_revision");
const raw = readFileSync(
  "catalog-data/releases/" + manifest.revision + "/records.jsonl",
);
if (createHash("sha256").update(raw).digest("hex") !== manifest.revision)
  throw Error("release_checksum_mismatch");
const records = raw
  .toString()
  .trim()
  .split("\n")
  .map((r) => JSON.parse(r));
if (records.length !== manifest.products) throw Error("release_count_mismatch");
const details = JSON.parse(
  readFileSync(
    "docs/evidence/catalog-scale/missing-artwork-detail.json",
    "utf8",
  ),
);
const states = new Map(details.results.map((r: any) => [r.sourceKey, r.state]));
const sets = new Map<string, any>(),
  missing: any[] = [],
  unresolved: any[] = [];
for (const r of records) {
  const i = identity(r);
  let set = sets.get(r.set.id);
  if (!set) {
    set = {
      game: r.game,
      setId: r.set.id,
      setSlug: r.set.slug,
      name: r.set.name.en,
      records: 0,
      missingArtwork: 0,
      unresolvedFinish: 0,
      expectedRecords: null,
      completeness: "unknown-until-authoritative-set-manifest",
    };
    sets.set(r.set.id, set);
  }
  set.records++;
  const unknown = i.variants.filter(
    (v: any) =>
      v.key === "unspecified" ||
      v.attributes.finishResolution === "not-yet-resolved",
  );
  if (unknown.length) {
    set.unresolvedFinish += unknown.length;
    unresolved.push({
      sourceKey: r.sourceKey,
      productId: i.productId,
      variantIds: unknown.map((v: any) => v.id),
      reason: "finish_unresolved",
      eligibleForExactVariantCertification: false,
    });
  }
  if (!r.product.images?.length) {
    set.missingArtwork++;
    missing.push({
      sourceKey: r.sourceKey,
      productId: i.productId,
      provider: r.provider,
      externalId: r.externalId,
      game: r.game,
      setId: r.set.id,
      set: r.set.name.en,
      variants: i.variants,
      sourceUrl: r.sourceUrl,
      state: states.get(r.sourceKey) ?? "not-audited",
      action: "require-approved-source-and-exact-printing-evidence",
    });
  }
}
const issues = auditIdentities(records);
const report = {
  release: manifest.revision,
  generatedAt: new Date().toISOString(),
  scope: "retained acquisition release; excludes 59 legacy sample records",
  products: records.length,
  missingArtwork: missing.length,
  unresolvedFinishRecords: unresolved.length,
  identityIssues: issues,
  existingRecordsIndependentlyVerified: false,
  sets: [...sets.values()].sort((a, b) => b.missingArtwork - a.missingArtwork),
  missing,
  unresolved,
};
mkdirSync("docs/evidence/catalog-integrity", { recursive: true });
writeFileSync(
  "docs/evidence/catalog-integrity/coverage.json",
  JSON.stringify(report, null, 2),
);
const rows = report.sets
  .filter((s) => s.missingArtwork)
  .map(
    (s) =>
      `| ${s.game} | ${s.name.replaceAll("|", "/")} | ${s.records} | ${s.missingArtwork} | ${s.unresolvedFinish} |`,
  );
writeFileSync(
  "docs/evidence/catalog-integrity/COVERAGE.md",
  `# Catalogue integrity and missing artwork\n\nRelease ${manifest.revision}\n\n${records.length} retained records; ${missing.length} missing artwork; ${unresolved.length} records with unresolved finish. ${issues.length} structural identity conflicts. This is consistency evidence, not independent proof of correct artwork or complete sets. Expected set sizes remain unknown. Legacy59samples excluded from this release audit.\n\n| Game | Set | Imported | Missing artwork | Unresolved finish variants |\n|---|---|---:|---:|---:|\n${rows.join("\n")}\n`,
);
if (process.argv.includes("--establish-baseline")) {
  if (issues.length) throw Error("cannot_baseline_conflicts");
  writeFileSync(
    "catalog-data/identity-baseline.json",
    JSON.stringify(makeBaseline(records, manifest.revision), null, 2),
    { flag: "wx" },
  );
}
console.log({
  products: records.length,
  missing: missing.length,
  unresolvedFinish: unresolved.length,
  identityIssues: issues.length,
  sets: sets.size,
});
