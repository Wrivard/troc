import { DomainError } from "../shared/domain";
export type GlobalRole = "admin" | "support" | "catalog_moderator";
export type SellerRole =
  "owner" | "manager" | "inventory" | "fulfillment" | "customer_service";
export type Principal = {
  userId: string;
  roles: GlobalRole[];
  memberships: { sellerId: string; role: SellerRole; active: boolean }[];
};
export type Permission =
  | "account:read"
  | "account:write"
  | "seller:apply"
  | "seller:manage"
  | "inventory:write"
  | "orders:fulfill"
  | "messages:reply"
  | "support:read"
  | "catalog:write"
  | "seller:approve"
  | "demo:purge";
const memberPermissions: Record<SellerRole, Permission[]> = {
  owner: [
    "seller:manage",
    "inventory:write",
    "orders:fulfill",
    "messages:reply",
  ],
  manager: ["inventory:write", "orders:fulfill", "messages:reply"],
  inventory: ["inventory:write"],
  fulfillment: ["orders:fulfill"],
  customer_service: ["messages:reply"],
};
export function can(
  principal: Principal | null,
  permission: Permission,
  resourceId?: string,
): boolean {
  if (!principal) return false;
  if (permission === "account:read" || permission === "account:write")
    return resourceId === principal.userId;
  if (permission === "seller:apply") return true;
  if (principal.roles.includes("admin")) return true;
  if (permission === "support:read") return principal.roles.includes("support");
  if (permission === "catalog:write")
    return principal.roles.includes("catalog_moderator");
  return principal.memberships.some(
    (m) =>
      m.active &&
      m.sellerId === resourceId &&
      memberPermissions[m.role]?.includes(permission),
  );
}
export function authorize(
  principal: Principal | null,
  permission: Permission,
  resourceId?: string,
): asserts principal is Principal {
  if (!can(principal, permission, resourceId))
    throw new DomainError(
      principal ? "forbidden" : "unauthorized",
      principal ? 403 : 401,
    );
}
