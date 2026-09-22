import { createHash } from "node:crypto";
const digest = (sql) => createHash("sha256").update(sql).digest("hex");
/** New records use LF; existing LF/CRLF records are accepted without rewriting history. */
export function migrationChecksums(sql) {
  const canonicalSql = sql.replaceAll("\r\n", "\n");
  const checksum = digest(canonicalSql);
  return {
    checksum,
    accepted: new Set([
      checksum,
      digest(canonicalSql.replaceAll("\n", "\r\n")),
    ]),
  };
}
