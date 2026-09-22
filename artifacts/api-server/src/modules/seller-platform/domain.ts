import { applicationInput } from "../sellers/domain";
import { DomainError } from "../shared/domain";
export function text(value: unknown, max = 120): string {
  if (typeof value !== "string" || !value.trim() || value.length > max)
    throw new DomainError("invalid_input");
  return value.trim();
}
export function uuid(value: unknown): string {
  if (
    typeof value !== "string" ||
    !/^[0-9a-f]{8}(-[0-9a-f]{4}){3}-[0-9a-f]{12}$/i.test(value)
  )
    throw new DomainError("invalid_id");
  return value;
}
export const roles = [
  "owner",
  "manager",
  "inventory",
  "fulfillment",
  "customer_service",
] as const;
export function application(value: unknown) {
  const base = applicationInput(value),
    v = value as Record<string, unknown>;
  const list = (key: string) => {
    const values = v[key] ?? [];
    if (!Array.isArray(values) || values.length > 15)
      throw new DomainError("invalid_input");
    return [...new Set(values.map((item) => text(item, 200)))];
  };
  const channels = list("channels");
  for (const channel of channels) {
    let url: URL;
    try {
      url = new URL(channel);
    } catch {
      throw new DomainError("invalid_channel_url");
    }
    if (
      !["https:", "http:"].includes(url.protocol) ||
      url.username ||
      url.password
    )
      throw new DomainError("invalid_channel_url");
  }
  const inventorySize = v.inventorySize ?? 0;
  if (
    !Number.isSafeInteger(inventorySize) ||
    Number(inventorySize) < 0 ||
    Number(inventorySize) > 100000000
  )
    throw new DomainError("invalid_inventory_size");
  return {
    ...base,
    profile: {
      displayName: text(v.displayName ?? base.contactName),
      channels,
      games: list("games"),
      platforms: list("platforms"),
      inventorySize,
      salesRange: v.salesRange ? text(v.salesRange) : "",
      taxRegistered: v.taxRegistered === true,
    },
  };
}
