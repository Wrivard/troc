import { readFileSync, writeFileSync } from "node:fs";
import { digest } from "./identity-integrity";
const coverage = JSON.parse(
  readFileSync("docs/evidence/catalog-integrity/coverage.json", "utf8"),
);
const source = JSON.parse(
  readFileSync(
    "docs/evidence/catalog-integrity/source-consistency.json",
    "utf8",
  ),
);
const legacy = JSON.parse(
  readFileSync(
    "docs/evidence/catalog-integrity/legacy-consistency.json",
    "utf8",
  ),
);
if (coverage.release !== source.release || coverage.release !== legacy.release)
  throw Error("mixed_audit_revisions");
const tasks = new Map<string, any>();
const add = (key: string, reason: string, evidence: unknown) => {
  if (!tasks.has(key))
    tasks.set(key, {
      sourceKey: key,
      release: coverage.release,
      status: "needs-review",
      reasons: [],
      evidence: [],
    });
  const task = tasks.get(key);
  task.reasons.push(reason);
  task.evidence.push(evidence);
};
for (const r of coverage.missing) add(r.sourceKey, "missing-artwork", r);
for (const r of coverage.unresolved) add(r.sourceKey, "unresolved-finish", r);
for (const r of [...source.results, ...legacy.results])
  if (r.status === "quarantined" || r.status === "needs-source-review")
    add(r.sourceKey, r.status, r);
const items = [...tasks.values()];
const checksum = digest(items);
writeFileSync(
  "docs/evidence/catalog-integrity/verification-queue.json",
  JSON.stringify(
    {
      version: 1,
      release: coverage.release,
      checksum,
      scope:
        "Review queue only; does not grant production rights, change records, or certify artwork",
      items,
    },
    null,
    2,
  ),
);
console.log({ reviewRecords: items.length, checksum });
