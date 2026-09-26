import { pool } from "../lib/db/src/index";
if (!process.env.DATABASE_URL) throw new Error("DATABASE_URL required");
try {
  if (process.argv.includes("--apply")) {
    const result = await pool.query(
      "DELETE FROM troc.onboarding_drafts WHERE expires_at<=now() RETURNING id",
    );
    console.log(JSON.stringify({ expiredDraftsDeleted: result.rows.length }));
  } else {
    const result = await pool.query(
      "SELECT count(*)::int AS expired FROM troc.onboarding_drafts WHERE expires_at<=now()",
    );
    console.log(JSON.stringify({ dryRun: true, ...result.rows[0] }));
  }
} finally {
  await pool.end();
}
