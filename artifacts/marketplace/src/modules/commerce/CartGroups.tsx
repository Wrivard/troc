import { useState } from "react";
import type { CartLine, CartQuote } from "@workspace/commerce";
import {
  CartItem,
  CartSellerGroup,
} from "@workspace/troc-design-system/components/ui/cart-seller-group";
import { CardImage } from "@workspace/troc-design-system/components/ui/product-presentation";
import {
  SellerMinimumProgress,
  FreeShippingProgress,
} from "@workspace/troc-design-system/components/ui/marketplace-progress";
import { Button } from "@workspace/troc-design-system/components/ui/button";
import { Checkbox } from "@workspace/troc-design-system/components/ui/selection-controls";
import { SellerBadge } from "@workspace/troc-design-system/components/ui/seller-badges";
import { commerceMessages, type CommerceMessage } from "./messages";
import { catalogMessages, type CatalogMessage } from "../catalog/messages";
export function CartGroups({
  quote,
  locale,
  change,
  readOnly = false,
}: {
  quote: CartQuote;
  locale: "en" | "fr";
  change?: (lines: CartLine[]) => void;
  readOnly?: boolean;
}) {
  const [pages, setPages] = useState<Record<string, number>>({});
  const t = (k: CommerceMessage) =>
    commerceMessages[k][locale === "en" ? 0 : 1];
  const money = (cents: number) =>
    new Intl.NumberFormat(locale === "en" ? "en-CA" : "fr-CA", {
      style: "currency",
      currency: "CAD",
    }).format(cents / 100);
  const lines = quote.groups.flatMap((g) =>
    g.lines.map(({ listingId, quantity, lockListing, lockSeller }) => ({
      listingId,
      quantity,
      lockListing,
      lockSeller,
    })),
  );
  return (
    <div className="grid gap-6">
      {quote.groups.map((g) => {
        const page = pages[g.seller.id] ?? 0,
          visible = g.lines.slice(page * 10, page * 10 + 10);
        const store = `/store/${g.seller.slug}?lang=${locale}`;
        return (
          <CartSellerGroup
            key={g.seller.id}
            id={`cart-seller-${g.seller.id}`}
            tabIndex={-1}
            sellerName={<a href={store}>{g.seller.name}</a>}
            sellerMeta={
              <>
                <span className="text-sm">
                  {g.cards}{" "}
                  {locale === "fr"
                    ? g.cards <= 1
                      ? "exemplaire"
                      : "exemplaires"
                    : g.cards === 1
                      ? "unit"
                      : "units"}{" "}
                  · {t("handling")}: {g.seller.handlingDays} ·{" "}
                  {g.seller.reputation
                    ? `${t("reputation")}: ${g.seller.reputation}/100`
                    : t("noReviews")}
                </span>
                {g.seller.badges.map((badge) => {
                  const definitions = {
                    verified_hobby_shop: [
                      "verified-hobby-shop",
                      "verifiedShop",
                    ],
                    identity_verified: ["verified-seller", "verifiedSeller"],
                    top_seller: ["top-seller", "topSeller"],
                    founding_seller: ["founding-seller", "foundingSeller"],
                  } as const;
                  const value = definitions[badge as keyof typeof definitions];
                  return value ? (
                    <SellerBadge
                      key={badge}
                      kind={value[0]}
                      label={t(value[1])}
                    />
                  ) : null;
                })}
              </>
            }
            subtotalLabel={t("merchandise")}
            subtotal={money(g.merchandiseCents - g.discountCents)}
            shippingLabel={`${t("shipping")}: ${money(g.shipping.cents)}${g.shipping.tracked ? " · " + t("tracking") : ""}`}
            minimumProgress={
              g.seller.minimumCents === 0 ? (
                <p className="text-sm">{t("noMinimum")}</p>
              ) : (
                <SellerMinimumProgress
                  locale={locale}
                  label={t("minimum")}
                  current={g.merchandiseCents / 100}
                  minimum={g.seller.minimumCents / 100}
                  reachedLabel={t("reached")}
                  remainingLabel={(_, text) =>
                    `${t("addMore")} ${text} ${t("fromSeller")}`
                  }
                />
              )
            }
            promotionProgress={
              <div className="grid gap-2">
                {g.discountCents > 0 && (
                  <p>
                    {t("discount")}: −{money(g.discountCents)}
                  </p>
                )}
                {g.nextPromotion && (
                  <p>
                    {t("promotion")}:{" "}
                    {g.nextPromotion.minimumCards
                      ? `${g.cards} / ${g.nextPromotion.minimumCards} ${t("cards")}`
                      : `${money(g.merchandiseCents)} / ${money(g.nextPromotion.minimumCents ?? 0)}`}{" "}
                    → {g.nextPromotion.basisPoints / 100}%
                  </p>
                )}
                {g.freeShippingRemainingCents !== null && (
                  <FreeShippingProgress
                    locale={locale}
                    label={t("free")}
                    current={(g.merchandiseCents - g.discountCents) / 100}
                    threshold={(g.seller.freeShippingCents ?? 0) / 100}
                    reachedLabel={t("freeReached")}
                    remainingLabel={(_, text) => `${t("addMore")} ${text}`}
                  />
                )}
              </div>
            }
          >
            <details open={g.lines.length <= 10}>
              <summary className="cursor-pointer p-4 font-semibold">
                {t("show")} · {g.lines.length}{" "}
                {locale === "fr"
                  ? g.lines.length === 1
                    ? "référence"
                    : "références"
                  : g.lines.length === 1
                    ? "line item"
                    : "line items"}{" "}
                · {g.cards}{" "}
                {locale === "fr"
                  ? g.cards <= 1
                    ? "exemplaire"
                    : "exemplaires"
                  : g.cards === 1
                    ? "unit"
                    : "units"}
              </summary>
              {visible.map((l) => (
                <div key={l.listingId}>
                  <CartItem
                    title={
                      <a
                        href={`/product/${l.listing.slug}?lang=${locale}&variantId=${l.listing.variantId}`}
                      >
                        {l.listing.name[locale]}
                      </a>
                    }
                    image={
                      <CardImage
                        src={l.listing.imageUrl ?? undefined}
                        alt={l.listing.name[locale]}
                        missingLabel="TROC"
                      />
                    }
                    metadata={[
                      l.listing.language.toUpperCase(),
                      l.listing.variantKey &&
                        (Object.hasOwn(catalogMessages, l.listing.variantKey)
                          ? catalogMessages[
                              l.listing.variantKey as CatalogMessage
                            ][locale === "en" ? 0 : 1]
                          : l.listing.variantKey),
                      l.listing.collectorNumber &&
                        `#${l.listing.collectorNumber}`,
                      l.listing.condition ?? l.listing.productType,
                    ]
                      .filter(Boolean)
                      .join(" · ")}
                    unitPrice={`${money(l.unitCents)} / ${locale === "fr" ? "exemplaire" : "unit"}`}
                    lineTotal={`${locale === "fr" ? "Ligne" : "Line total"} ${money(l.totalCents)}`}
                    quantity={l.quantity}
                    max={Math.min(100, l.listing.quantity)}
                    quantityLabel={`${t("quantity")} ${l.listing.name[locale]}`}
                    incrementLabel={t("more")}
                    decrementLabel={t("less")}
                    removeLabel={`${t("remove")} ${l.listing.name[locale]}`}
                    loading={readOnly}
                    onQuantityChange={(quantity) =>
                      change?.(
                        lines.map((x) =>
                          x.listingId === l.listingId ? { ...x, quantity } : x,
                        ),
                      )
                    }
                    onRemove={() =>
                      change?.(lines.filter((x) => x.listingId !== l.listingId))
                    }
                  />
                  {!readOnly && (
                    <div className="flex flex-wrap gap-4 px-4 pb-3">
                      {(["lockListing", "lockSeller"] as const).map((lock) => (
                        <label
                          key={lock}
                          className="flex items-center gap-2 text-sm"
                        >
                          <Checkbox
                            checked={!!l[lock]}
                            onCheckedChange={(checked) =>
                              change?.(
                                lines.map((x) =>
                                  x.listingId === l.listingId
                                    ? { ...x, [lock]: checked === true }
                                    : x,
                                ),
                              )
                            }
                          />
                          {t(lock)}
                        </label>
                      ))}
                    </div>
                  )}
                </div>
              ))}
              {g.lines.length > 10 && (
                <div className="flex justify-between p-4">
                  <Button
                    variant="outline"
                    disabled={page === 0}
                    onClick={() =>
                      setPages({ ...pages, [g.seller.id]: page - 1 })
                    }
                  >
                    {t("previous")}
                  </Button>
                  <span>
                    {page + 1} / {Math.ceil(g.lines.length / 10)}
                  </span>
                  <Button
                    variant="outline"
                    disabled={(page + 1) * 10 >= g.lines.length}
                    onClick={() =>
                      setPages({ ...pages, [g.seller.id]: page + 1 })
                    }
                  >
                    {t("next")}
                  </Button>
                </div>
              )}
            </details>
            {!readOnly && (
              <div className="grid gap-3 p-4">
                <div className="flex flex-wrap gap-4 text-sm">
                  <a className="underline" href={store + "&max=99"}>
                    {t("underDollar")}
                  </a>
                  <a
                    className="underline"
                    href={`/search?lang=${locale}&seller=${g.seller.slug}&set=${g.lines[0]?.listing.setSlug}`}
                  >
                    {t("sameSet")}
                  </a>
                  <a className="underline" href={store + "&max=99"}>
                    {t("deals")}
                  </a>
                </div>
                {g.minimumRemainingCents > 0 && (
                  <p className="text-sm text-muted-foreground">{t("future")}</p>
                )}
              </div>
            )}
          </CartSellerGroup>
        );
      })}
    </div>
  );
}
