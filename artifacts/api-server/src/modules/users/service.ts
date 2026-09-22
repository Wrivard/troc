import { pool } from "@workspace/db";
import { authorize, type Principal } from "../auth/permissions";
import { preferences } from "../shared/domain";
export async function account(principal: Principal) {
  authorize(principal, "account:read", principal.userId);
  const result = await pool.query(
    `SELECT u.id,u.email,p.display_name AS "displayName",pr.locale,pr.theme FROM troc.users u JOIN troc.user_profiles p ON p.user_id=u.id JOIN troc.user_preferences pr ON pr.user_id=u.id WHERE u.id=$1`,
    [principal.userId],
  );
  return result.rows[0];
}
export async function savePreferences(principal: Principal, input: unknown) {
  authorize(principal, "account:write", principal.userId);
  const value = preferences(input);
  const client = await pool.connect();
  try {
    await client.query("BEGIN");
    await client.query(
      "UPDATE troc.user_preferences SET locale=$2,theme=$3,updated_at=now() WHERE user_id=$1",
      [principal.userId, value.locale, value.theme],
    );
    await client.query(
      "INSERT INTO troc.audit_events(actor_id,action,entity_type,entity_id) VALUES($1,'preferences.updated','user',$1)",
      [principal.userId],
    );
    await client.query("COMMIT");
    return value;
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  } finally {
    client.release();
  }
}
