import { pool } from "@workspace/db";
import { authorize, type Principal } from "../auth/permissions";
import { applicationInput } from "./domain";
import { DomainError } from "../shared/domain";
export async function submitApplication(principal: Principal, input: unknown) {
  authorize(principal, "seller:apply");
  const v = applicationInput(input);
  const client = await pool.connect();
  try {
    await client.query("BEGIN");
    const result = await client.query(
      "INSERT INTO troc.seller_applications(applicant_id,contact_name,country,province,seller_type,adult_confirmed) VALUES($1,$2,$3,$4,$5,true) RETURNING id,status,created_at",
      [principal.userId, v.contactName, v.country, v.province, v.sellerType],
    );
    await client.query(
      "INSERT INTO troc.audit_events(actor_id,action,entity_type,entity_id) VALUES($1,'seller.application.submitted','seller_application',$2)",
      [principal.userId, result.rows[0].id],
    );
    await client.query("COMMIT");
    return result.rows[0];
  } catch (error) {
    await client.query("ROLLBACK");
    if ((error as { code?: string }).code === "23505")
      throw new DomainError("application_exists", 409);
    throw error;
  } finally {
    client.release();
  }
}
