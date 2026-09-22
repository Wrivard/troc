export type Locale = "en" | "fr";
export type Theme = "dark" | "light";
export type Money = { cents: number; currency: "CAD" };
export class DomainError extends Error {
  constructor(
    public code: string,
    public status = 400,
  ) {
    super(code);
  }
}
export function money(cents: number): Money {
  if (!Number.isSafeInteger(cents) || cents < 0)
    throw new DomainError("invalid_money");
  return { cents, currency: "CAD" };
}
export function preferences(value: unknown): { locale: Locale; theme: Theme } {
  const v = value as Record<string, unknown> | null;
  if (
    !v ||
    !["en", "fr"].includes(String(v.locale)) ||
    !["dark", "light"].includes(String(v.theme))
  )
    throw new DomainError("invalid_preferences");
  return { locale: v.locale as Locale, theme: v.theme as Theme };
}
export const launchPolicy = Object.freeze({
  currency: "CAD",
  country: "CA",
  minimumsCents: [0, 200, 500, 1000],
  commissionBasisPoints: 800,
  shippingCommissionBasisPoints: 0,
  photoThresholdCents: 5000,
  trackedThresholdCents: 5000,
  foundingSellerLimit: 250,
});
