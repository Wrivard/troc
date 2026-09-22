import { pool } from "@workspace/db";
import { DemoCatalogProvider } from "./demo";
import { runImport } from "./importer";
import type { GlobalRole } from "../auth/permissions";
// Offline operator command only; no production provider is wired or fetched.
const actorId = process.env.IMPORT_ACTOR_ID;
if (!actorId || !process.env.DATABASE_URL)
  throw new Error(
    "Set DATABASE_URL for the operator connection and IMPORT_ACTOR_ID.",
  );
const actor = await pool.query<{ role: GlobalRole }>(
  "SELECT r.role FROM troc.user_roles r JOIN troc.users u ON u.id=r.user_id WHERE r.user_id=$1 AND u.status='active'",
  [actorId],
);
const client = await pool.connect();
try {
  const report = await runImport(
    client,
    new DemoCatalogProvider(),
    { userId: actorId, roles: actor.rows.map((r) => r.role), memberships: [] },
    process.argv[2] || "demo-initial",
  );
  console.log(JSON.stringify(report, null, 2));
} finally {
  client.release();
  await pool.end();
}
