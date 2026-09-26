/** Exact decimal conversion; API amounts remain integer Canadian cents. */
export function priceInputCents(input: string): number | null | undefined {
  const text = input.trim();
  if (!text) return null;
  if (!/^\d+(?:[.,]\d{1,2})?$/.test(text)) return undefined;
  const [whole, fraction = ""] = text.replace(",", ".").split(".");
  const cents = Number(whole) * 100 + Number(fraction.padEnd(2, "0"));
  return Number.isSafeInteger(cents) && cents <= 2147483647 ? cents : undefined;
}
export function priceInputValue(cents: number | null): string {
  return cents === null ? "" : (cents / 100).toFixed(2);
}
