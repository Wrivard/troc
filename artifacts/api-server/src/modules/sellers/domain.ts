import { DomainError } from "../shared/domain";
export const sellerTypes = [
  "individual",
  "professional",
  "verified_online",
  "verified_hobby_shop",
] as const;
const provinces = [
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
];
export function applicationInput(input: unknown) {
  const v = input as Record<string, unknown> | null;
  if (
    !v ||
    v.adultConfirmed !== true ||
    v.country !== "CA" ||
    !provinces.includes(String(v.province)) ||
    !sellerTypes.includes(v.sellerType as (typeof sellerTypes)[number]) ||
    typeof v.contactName !== "string" ||
    !v.contactName.trim() ||
    v.contactName.length > 120
  )
    throw new DomainError("invalid_application");
  return {
    contactName: v.contactName.trim(),
    country: "CA",
    province: String(v.province),
    sellerType: String(v.sellerType),
    adultConfirmed: true,
  };
}
