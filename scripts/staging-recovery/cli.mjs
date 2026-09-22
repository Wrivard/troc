import { spawnSync } from "node:child_process";
import { readFile } from "node:fs/promises";
import process from "node:process";
import console from "node:console";
import {
  validatePlan,
  expectedMigrations,
  parseSnapshot,
  verifyRestore,
  verifyBeforeRestore,
} from "./verify.mjs";

// No shell, database connection, dump, restore, or destructive command is run here.
export function toolVersions(major, run = spawnSync) {
  return ["psql", "pg_dump", "pg_restore"].map((tool) => {
    const result = run(tool, ["--version"], {
      encoding: "utf8",
      timeout: 5000,
      windowsHide: true,
      shell: false,
    });
    const match =
      result.status === 0 && result.stdout?.match(/\(PostgreSQL\) (\d+)\./);
    return {
      tool,
      status: match && Number(match[1]) === major ? "PASS" : "BLOCKED",
      requiredMajor: major,
    };
  });
}
async function main() {
  const [mode = "preflight", planPath, sourcePath, targetPath] =
    process.argv.slice(2);
  if (
    !["preflight", "verify", "identities"].includes(mode) ||
    !planPath ||
    (mode !== "preflight" && (!sourcePath || !targetPath))
  )
    throw new Error(
      "Usage: cli.mjs preflight PLAN.json | identities PLAN.json SOURCE.json TARGET.json | verify PLAN.json SOURCE.ndjson TARGET.ndjson. No execution mode exists.",
    );
  const plan = validatePlan(JSON.parse(await readFile(planPath, "utf8")));
  if (mode === "preflight") {
    const tools = toolVersions(plan.source.serverMajor);
    console.log(
      JSON.stringify(
        {
          status: tools.every((t) => t.status === "PASS")
            ? "PREFLIGHT_ONLY"
            : "BLOCKED",
          tools,
          next: "Follow docs/operations/staging-recovery.md. Confirm TLS, observed identity, artifact protection, empty target and operator authorization before a separate native exercise.",
        },
        null,
        2,
      ),
    );
    if (tools.some((t) => t.status !== "PASS")) process.exitCode = 2;
  } else if (mode === "identities") {
    console.log(
      JSON.stringify(
        verifyBeforeRestore(
          plan,
          JSON.parse(await readFile(sourcePath, "utf8")),
          JSON.parse(await readFile(targetPath, "utf8")),
        ),
        null,
        2,
      ),
    );
  } else {
    const source = parseSnapshot(await readFile(sourcePath, "utf8"));
    const target = parseSnapshot(await readFile(targetPath, "utf8"));
    console.log(
      JSON.stringify(
        verifyRestore(plan, source, target, await expectedMigrations()),
        null,
        2,
      ),
    );
  }
}
if (
  process.argv[1]?.replaceAll("\\", "/").endsWith("/staging-recovery/cli.mjs")
) {
  main().catch((error) => {
    // Never echo file contents, connection data, driver output, or assertion diffs.
    const safe =
      error?.code === "ERR_ASSERTION"
        ? "Snapshot comparison failed; inspect protected evidence for schema, history or row drift."
        : error instanceof SyntaxError
          ? "Invalid JSON evidence/plan; use the documented format."
          : error?.code
            ? "Evidence file unavailable; check the path and permissions."
            : error.message;
    console.error(`Recovery verification blocked: ${safe}`);
    process.exitCode = 1;
  });
}
