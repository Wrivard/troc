import { DomainError } from "../shared/domain";
export const consentVersion = "prelaunch-2026-09-v1";
export const games = [
  "pokemon",
  "magic",
  "yugioh",
  "one-piece",
  "riftbound",
] as const;
export const provinces = [
  "AB",
  "BC",
  "MB",
  "NB",
  "NL",
  "NS",
  "NT",
  "NU",
  "ON",
  "PE",
  "QC",
  "SK",
  "YT",
] as const;
export const channels = [
  "ebay",
  "shopify",
  "tcgplayer",
  "facebook",
  "lgs",
  "other",
] as const;
export const software = [
  "sortswift",
  "carduploader",
  "binderpos",
  "spreadsheet",
  "custom",
  "none",
] as const;
export const cohorts = [
  "unassigned",
  "internal",
  "founding_sellers",
  "private_alpha",
  "collector_closed_beta",
  "public",
] as const;
export const statuses = [
  "new",
  "reviewing",
  "contacted",
  "waitlisted",
] as const;
export type Kind = "collector" | "seller";
export function object(value: unknown): Record<string, unknown> {
  if (!value || typeof value !== "object" || Array.isArray(value))
    throw new DomainError("invalid_input");
  return value as Record<string, unknown>;
}
export function text(value: unknown, max = 200, multiline = false): string {
  if (
    typeof value !== "string" ||
    value.length > max ||
    [...value].some(
      (character) =>
        character.charCodeAt(0) < 32 &&
        !(multiline && ["\n", "\r", "\t"].includes(character)),
    )
  )
    throw new DomainError("invalid_input");
  return value.trim();
}
export function choice<T extends string>(
  value: unknown,
  values: readonly T[],
): T {
  if (typeof value !== "string" || !values.includes(value as T))
    throw new DomainError("invalid_input");
  return value as T;
}
export function kind(value: unknown): Kind {
  return choice(value, ["collector", "seller"]);
}
export function id(value: unknown): string {
  const s = text(value, 36);
  if (
    !/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(s)
  )
    throw new DomainError("invalid_input");
  return s;
}
export function secret(value: unknown): string {
  const s = text(value, 100);
  if (!/^[A-Za-z0-9_-]{43}$/.test(s)) throw new DomainError("invalid_input");
  return s;
}
function selections(value: unknown, allowed: readonly string[]): string[] {
  if (!Array.isArray(value) || value.length > allowed.length)
    throw new DomainError("invalid_input");
  return [...new Set(value.map((v) => choice(v, allowed)))];
}
export function signup(value: unknown, audience: Kind) {
  const v = object(value);
  if (
    v.consent !== true ||
    v.consentVersion !== consentVersion ||
    v.country !== "CA"
  )
    throw new DomainError("consent_required");
  if (text(v.website ?? "", 100) !== "") throw new DomainError("invalid_input");
  const email = text(v.email, 254).toLowerCase();
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email))
    throw new DomainError("invalid_input");
  const details: Record<string, unknown> = {
    games: selections(v.games, games),
    province: choice(v.province, provinces),
    channels: selections(v.channels, channels),
  };
  if (audience === "seller") {
    if (v.adult !== true) throw new DomainError("invalid_input");
    details.contact = text(v.contact, 100);
    if (!details.contact) throw new DomainError("invalid_input");
    details.software = selections(v.software, software);
    details.inventory = choice(v.inventory, [
      "under_1000",
      "1000_9999",
      "10000_49999",
      "50000_plus",
    ]);
    details.sellerType = choice(v.sellerType, [
      "individual",
      "professional",
      "online_store",
      "hobby_shop",
    ]);
    details.experience = choice(v.experience, [
      "starting",
      "under_1_year",
      "1_3_years",
      "3_plus_years",
    ]);
  } else {
    details.frequency = choice(v.frequency, [
      "not_specified",
      "occasionally",
      "monthly",
      "weekly",
    ]);
    details.frustrations = text(v.frustrations ?? "", 500, true);
    details.wishlist = text(v.wishlist ?? "", 1000, true);
  }
  return {
    email,
    locale: choice(v.locale, ["en", "fr"]),
    details,
    withdrawal: secret(v.withdrawal),
  };
}
