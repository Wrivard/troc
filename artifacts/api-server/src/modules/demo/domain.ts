import { DomainError } from "../shared/domain";
// Explicit allowlist. Catalog identities/mappings and real leads cannot enter purge plans.
export const demoTables = [
  "users",
  "seller_accounts",
  "listings",
  "marketplace_orders",
] as const;
export function demoProvenance(
  table: string,
  entityId: string,
  batchId: string,
) {
  if (!(demoTables as readonly string[]).includes(table))
    throw new DomainError("protected_demo_entity");
  if (
    ![entityId, batchId].every((id) =>
      /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(
        id,
      ),
    )
  )
    throw new DomainError("invalid_id");
  return { table, entityId, batchId };
}
