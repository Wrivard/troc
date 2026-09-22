import { pool } from "@workspace/db";
import { authorize, type Principal } from "../auth/permissions";
import { DomainError } from "../shared/domain";
// Internal tooling foundation only. No public seed/purge endpoint in Milestone 1.
// Use a dedicated operator DB connection with explicit demo grants in Milestone 6.
export async function beginDemoBatch(principal: Principal, seedKey: string) {
  authorize(principal, "demo:purge");
  if (!/^[a-z0-9][a-z0-9_-]{2,79}$/.test(seedKey))
    throw new DomainError("invalid_seed_key");
  const result = await pool.query(
    "INSERT INTO troc.demo_batches(seed_key) VALUES($1) ON CONFLICT(seed_key) DO UPDATE SET seed_key=EXCLUDED.seed_key RETURNING id,seed_key,purged_at",
    [seedKey],
  );
  if (result.rows[0].purged_at) throw new DomainError("demo_batch_purged", 409);
  return result.rows[0];
}
