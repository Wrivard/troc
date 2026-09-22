import { test } from "node:test";
import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { migrationChecksums } from "../lib/db/scripts/migration-checksum.mjs";
test("migration checksum is portable while preserving legacy hashes and rejecting SQL edits", () => {
  const lf = "CREATE TABLE example(id integer);\nSELECT 1;\n";
  const crlf = lf.replaceAll("\n", "\r\n");
  const unix = migrationChecksums(lf),
    windows = migrationChecksums(crlf);
  assert.equal(unix.checksum, windows.checksum);
  for (const source of [lf, crlf]) {
    const legacy = createHash("sha256").update(source).digest("hex");
    assert.ok(unix.accepted.has(legacy));
    assert.ok(windows.accepted.has(legacy));
  }
  assert.equal(
    unix.accepted.has(
      migrationChecksums(lf.replace("SELECT 1", "SELECT 2")).checksum,
    ),
    false,
  );
});
