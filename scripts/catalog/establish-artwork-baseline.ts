import { readFileSync, writeFileSync } from "node:fs";
import { artworkIdentity, digest, assertBaseline } from "./identity-integrity";
const m = JSON.parse(readFileSync("catalog-data/current.json", "utf8"));
const records = readFileSync(
  "catalog-data/releases/" + m.revision + "/records.jsonl",
  "utf8",
)
  .trim()
  .split("\n")
  .map((r) => JSON.parse(r));
assertBaseline(
  records,
  JSON.parse(readFileSync("catalog-data/identity-baseline.json", "utf8")),
);
const identities = Object.fromEntries(
  records.map((r) => [r.sourceKey, digest(artworkIdentity(r))]),
);
writeFileSync(
  "catalog-data/artwork-baseline.json",
  JSON.stringify(
    {
      version: 1,
      release: m.revision,
      status: "established-not-independently-verified",
      identities,
      checksum: digest(identities),
    },
    null,
    2,
  ),
  { flag: "wx" },
);
console.log(
  "Established artwork association baseline without changing release",
);
