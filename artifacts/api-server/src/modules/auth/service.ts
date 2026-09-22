import { pool } from "@workspace/db";
import type { User } from "@supabase/supabase-js";
import { DomainError } from "../shared/domain";
import type { GlobalRole, Principal, SellerRole } from "./permissions";
export async function ensureBuyer(user: User): Promise<Principal> {
  if (!user.email || !user.email_confirmed_at)
    throw new DomainError("unauthorized", 401);
  const client = await pool.connect();
  try {
    await client.query("BEGIN");
    await client.query(
      "INSERT INTO troc.users(id,email) VALUES($1,$2) ON CONFLICT(id) DO NOTHING",
      [user.id, user.email],
    );
    const { rows } = await client.query(
      "SELECT status FROM troc.users WHERE id=$1",
      [user.id],
    );
    if (rows[0]?.status !== "active") throw new DomainError("forbidden", 403);
    await client.query(
      "INSERT INTO troc.user_profiles(user_id) VALUES($1) ON CONFLICT DO NOTHING",
      [user.id],
    );
    await client.query(
      "INSERT INTO troc.user_preferences(user_id) VALUES($1) ON CONFLICT DO NOTHING",
      [user.id],
    );
    const roles = await client.query<{ role: GlobalRole }>(
      "SELECT role FROM troc.user_roles WHERE user_id=$1",
      [user.id],
    );
    const members = await client.query<{
      sellerId: string;
      role: SellerRole;
      active: boolean;
    }>(
      `SELECT m.seller_id AS "sellerId",m.role,(s.status='active') AS active FROM troc.seller_members m JOIN troc.seller_accounts s ON s.id=m.seller_id WHERE m.user_id=$1`,
      [user.id],
    );
    await client.query("COMMIT");
    return {
      userId: user.id,
      roles: roles.rows.map((r) => r.role),
      memberships: members.rows,
    };
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  } finally {
    client.release();
  }
}
