import { DomainError } from "../shared/domain";
const prefixes: Record<string, string> = {
  AB: "T",
  BC: "V",
  MB: "R",
  NB: "E",
  NL: "A",
  NS: "B",
  NT: "X",
  NU: "X",
  ON: "KLMNP",
  PE: "C",
  QC: "GHJ",
  SK: "S",
  YT: "Y",
};
/** Plausibility only: does not prove occupancy or residency. Do not log the address. */
export function canadianAddress(value: unknown) {
  if (!value || typeof value !== "object")
    throw new DomainError("canadian_address_required");
  const v = value as Record<string, unknown>;
  const street = typeof v.street === "string" ? v.street.trim() : "";
  const city = typeof v.city === "string" ? v.city.trim() : "";
  const province = typeof v.province === "string" ? v.province : "";
  const postalCode =
    typeof v.postalCode === "string"
      ? v.postalCode.replace(/\s/g, "").toUpperCase()
      : "";
  if (
    v.country !== "CA" ||
    street.length < 3 ||
    street.length > 160 ||
    city.length < 2 ||
    city.length > 80 ||
    [...street + city].some(character => character.charCodeAt(0) < 32) ||
    !/^[ABCEGHJ-NPRSTVXY][0-9][ABCEGHJ-NPRSTV-Z][0-9][ABCEGHJ-NPRSTV-Z][0-9]$/.test(
      postalCode,
    ) ||
    !prefixes[province]?.includes(postalCode[0])
  )
    throw new DomainError("canadian_address_required");
  return {
    street,
    city,
    province,
    postalCode: postalCode.slice(0, 3) + " " + postalCode.slice(3),
    country: "CA",
  };
}
