import { useState } from "react";
import type { SmartResult } from "@workspace/commerce";
import { Button } from "@workspace/troc-design-system/components/ui/button";
import { commerceMessages } from "./messages";
export function SmartChanges({
  result,
  locale,
}: {
  result: SmartResult;
  locale: "en" | "fr";
}) {
  const [page, setPage] = useState(0);
  const index = locale === "en" ? 0 : 1;
  const originals = new Map(
    result.original.groups.flatMap((g) =>
      g.lines.map((l) => [l.listingId, l] as const),
    ),
  );
  const destinations = new Map(
    result.optimized.groups.flatMap((g) =>
      g.lines.map(
        (l) => [l.listingId, { line: l, seller: g.seller.name }] as const,
      ),
    ),
  );
  const money = (cents: number) =>
    new Intl.NumberFormat(locale === "en" ? "en-CA" : "fr-CA", {
      style: "currency",
      currency: "CAD",
      signDisplay: "always",
    }).format(cents / 100);
  return (
    <details>
      <summary className="cursor-pointer font-semibold">
        {commerceMessages.substitutions[index]} · {result.substitutions.length}
      </summary>
      <ul className="grid gap-3 py-4">
        {result.substitutions.slice(page * 10, page * 10 + 10).map((s, i) => (
          <li key={i}>
            {s.quantity} ×{" "}
            {originals.get(s.fromListingId)?.listing.name[locale]} →{" "}
            {destinations.get(s.toListingId)?.seller}
            <br />
            <span className="text-sm text-muted-foreground">
              {commerceMessages.difference[index]}:{" "}
              {money(s.merchandiseDifferenceCents)}
            </span>
          </li>
        ))}
      </ul>
      {result.substitutions.length > 10 && (
        <div className="flex gap-4">
          <Button
            variant="outline"
            disabled={page === 0}
            onClick={() => setPage(page - 1)}
          >
            {commerceMessages.previous[index]}
          </Button>
          <Button
            variant="outline"
            disabled={(page + 1) * 10 >= result.substitutions.length}
            onClick={() => setPage(page + 1)}
          >
            {commerceMessages.next[index]}
          </Button>
        </div>
      )}
    </details>
  );
}
