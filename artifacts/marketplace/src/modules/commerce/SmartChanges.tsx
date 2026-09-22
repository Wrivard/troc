import { useState } from "react";
import type { SmartResult } from "@workspace/commerce";
import { Button } from "@workspace/troc-design-system/components/ui/button";
import { commerceMessages } from "./messages";
import { catalogMessages, type CatalogMessage } from "../catalog/messages";
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
      g.lines.map(
        (l) => [l.listingId, { line: l, seller: g.seller.name }] as const,
      ),
    ),
  );
  const destinations = new Map(
    result.optimized.groups.flatMap((g) =>
      g.lines.map(
        (l) => [l.listingId, { line: l, seller: g.seller.name }] as const,
      ),
    ),
  );
  const money = (cents: number, signed = false) =>
    new Intl.NumberFormat(locale === "en" ? "en-CA" : "fr-CA", {
      style: "currency",
      currency: "CAD",
      signDisplay: signed ? "always" : "auto",
    }).format(cents / 100);
  return (
    <details>
      <summary className="cursor-pointer font-semibold">
        {commerceMessages.substitutions[index]} · {result.substitutions.length}
      </summary>
      <ul className="grid gap-3 py-4">
        {result.substitutions.slice(page * 10, page * 10 + 10).map((s, i) => {
          const original = originals.get(s.fromListingId);
          const destination = destinations.get(s.toListingId);
          return (
            <li key={i} className="grid gap-2 border-b border-border pb-4">
              <strong>
                {s.quantity} ×{" "}
                {original?.line.listing.name[locale] ??
                  destination?.line.listing.name[locale]}
              </strong>
              <dl className="grid gap-3 sm:grid-cols-2">
                {[
                  {
                    label: locale === "fr" ? "Avant" : "Before",
                    value: original,
                  },
                  {
                    label: locale === "fr" ? "Proposition" : "Proposed",
                    value: destination,
                  },
                ].map(({ label, value }) => (
                  <div key={label} className="grid gap-1">
                    <dt className="text-sm text-muted-foreground">{label}</dt>
                    <dd className="grid gap-1">
                      {value ? (
                        <>
                          <span>{value.seller}</span>
                          <span className="text-sm text-muted-foreground">
                            {[
                              value.line.listing.language.toUpperCase(),
                              value.line.listing.variantKey &&
                                (Object.hasOwn(
                                  catalogMessages,
                                  value.line.listing.variantKey,
                                )
                                  ? catalogMessages[
                                      value.line.listing
                                        .variantKey as CatalogMessage
                                    ][index]
                                  : value.line.listing.variantKey),
                              value.line.listing.collectorNumber &&
                                `#${value.line.listing.collectorNumber}`,
                              value.line.listing.condition ??
                                catalogMessages[value.line.listing.productType][
                                  index
                                ],
                            ]
                              .filter(Boolean)
                              .join(" · ")}
                          </span>
                          <span>
                            {money(value.line.unitCents)} /{" "}
                            {locale === "fr" ? "exemplaire" : "unit"}
                          </span>
                        </>
                      ) : (
                        <span>
                          {locale === "fr"
                            ? "Détails indisponibles"
                            : "Details unavailable"}
                        </span>
                      )}
                    </dd>
                  </div>
                ))}
              </dl>
              <p className="text-sm text-muted-foreground">
                {commerceMessages.difference[index]}:{" "}
                {money(s.merchandiseDifferenceCents, true)}
              </p>
            </li>
          );
        })}
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
