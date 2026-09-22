/** Preserve integer CAD cents beyond Number.MAX_SAFE_INTEGER. */
export function formatCad(cents: string, locale: string): string {
  if (!/^\d+$/.test(cents)) return "—";
  const amount = BigInt(cents);
  return new Intl.NumberFormat(locale === "fr" ? "fr-CA" : "en-CA", {
    style: "currency",
    currency: "CAD",
  })
    .formatToParts(amount / 100n)
    .map((part) =>
      part.type === "fraction"
        ? (amount % 100n).toString().padStart(2, "0")
        : part.value,
    )
    .join("");
}
