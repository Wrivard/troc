import { execFileSync } from "node:child_process";
import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
const here = path.dirname(fileURLToPath(import.meta.url)),
  root = path.resolve(here, "../../../../../../..");
const git = ["-c", `safe.directory=${root.replaceAll("\\", "/")}`, "-C", root];
await fs.mkdir(path.join(here, "baseline"), { recursive: true });
for (const [file, source] of [
  ["SmartCartFeaturePage.tsx", "smart-cart-feature/SmartCartFeaturePage.tsx"],
  ["smart-cart-feature.css", "smart-cart-feature/smart-cart-feature.css"],
  ["SmartCartDemo.tsx", "SmartCartDemo.tsx"],
]) {
  let text = execFileSync(
    "git",
    [
      ...git,
      "show",
      `11f699c:artifacts/marketplace/src/modules/brand/${source}`,
    ],
    { encoding: "utf8" },
  );
  if (file === "SmartCartFeaturePage.tsx") {
    text = text
      .replace("  comparisonDemo,", "  comparisonDemo,\n  collectionExercise,")
      .replace(
        "  comparisonDemo: ReactNode;",
        "  comparisonDemo: ReactNode;\n  collectionExercise?: ReactNode;",
      )
      .replace(
        '      <section className="troc-scf-review"',
        '      {collectionExercise}\n      <section className="troc-scf-review"',
      );
  }
  await fs.writeFile(path.join(here, "baseline", file), text);
}
globalThis.console.log(
  "Prepared frozen11f699c education/demo plus isolated optional slot only.",
);
