import { pool } from "@workspace/db";
import { seedCommerceDemo } from "./seed-demo";
// Requires an operator connection. No users, memberships or auth bypasses are created.
if (!process.env.DATABASE_URL || process.env.CATALOG_MODE !== "demo")
  throw new Error(
    "Set the operator DATABASE_URL and CATALOG_MODE=demo for this bounded seed.",
  );
const db = await pool.connect();
try {
  await db.query("BEGIN");
  const result = await seedCommerceDemo(db);
  await db.query("COMMIT");
  console.log(JSON.stringify(result));
} catch (error) {
  await db.query("ROLLBACK");
  throw error;
} finally {
  db.release();
  await pool.end();
}
