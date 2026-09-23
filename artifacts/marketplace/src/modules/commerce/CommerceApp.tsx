import { Progress } from "@workspace/troc-design-system/components/ui/progress";
import { SmartCartDemo } from "../brand/SmartCartDemo";
import { commerceSellerName } from "../brand/demo-store-branding";
import { PremiumEmptyState } from "@workspace/troc-design-system/components/ui/marketplace-compositions";
import { EditorialIntro } from "@workspace/troc-design-system/components/ui/editorial";
import { MarketplaceHeader, MarketplaceFooter } from "../brand/SiteChrome";
import { useEffect, useMemo, useState, type FormEvent } from "react";
import type { CartLine, CartQuote, SmartResult } from "@workspace/commerce";
import { usePreferences } from "@workspace/troc-design-system/hooks/use-preferences";
import { Button } from "@workspace/troc-design-system/components/ui/button";
import { Input } from "@workspace/troc-design-system/components/ui/input";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@workspace/troc-design-system/components/ui/select";
import { OrderTotals } from "@workspace/troc-design-system/components/ui/order-totals";
import { SmartCartComparison } from "@workspace/troc-design-system/components/ui/smart-cart";
import { api } from "../../api";
import { canHydrateCart, readCart, writeCart } from "./cart-storage";
import { trackCommerce } from "./analytics";
import { CartGroups } from "./CartGroups";
import { SmartChanges } from "./SmartChanges";
import { OrderPages } from "./OrderPages";
import { commerceMessages, type CommerceMessage } from "./messages";
export function CommerceApp({
  path,
  embedded = false,
}: {
  path: string;
  embedded?: boolean;
}) {
  const embeddedCart = embedded && path === "/cart";
  const Container = embeddedCart ? "div" : "main";
  const { locale, setLocale, theme, setTheme } = usePreferences();
  const t = (key: CommerceMessage) =>
    commerceMessages[key][locale === "en" ? 0 : 1];
  const money = (n: number) =>
    new Intl.NumberFormat(locale === "en" ? "en-CA" : "fr-CA", {
      style: "currency",
      currency: "CAD",
    }).format(n / 100);
  const [lines, setLines] = useState<CartLine[]>(readCart),
    [quote, setQuote] = useState<CartQuote | null>(null),
    [smart, setSmart] = useState<SmartResult | null>(null),
    [status, setStatus] = useState<CommerceMessage | null>(null),
    [busy, setBusy] = useState(false),
    [coupon, setCoupon] = useState(""),
    [appliedCoupon, setAppliedCoupon] = useState(""),
    [province, setProvince] = useState("ON"),
    [credit, setCredit] = useState("0"),
    [available, setAvailable] = useState(0),
    [authenticated, setAuthenticated] = useState(false);
  const [quoteRevision, setQuoteRevision] = useState(0);
  const [quoteFailed, setQuoteFailed] = useState(false);
  const [quoteStatus, setQuoteStatus] = useState<CommerceMessage | null>(null);
  const visibleStatus = status ?? quoteStatus;
  const [checkoutKey, setCheckoutKey] = useState(() => crypto.randomUUID());
  const orderPage =
      path.startsWith("/account/orders") || path.startsWith("/seller/orders"),
    checkout = path === "/checkout",
    smartPage = path === "/smart-cart";
  const quoteInput = useMemo(
    () => ({
      request: {
        lines,
        coupon: appliedCoupon,
        province: checkout ? province : undefined,
      },
      revision: quoteRevision,
    }),
    [lines, appliedCoupon, province, checkout, quoteRevision],
  );
  const [quotedInput, setQuotedInput] = useState<typeof quoteInput | null>(
    null,
  );
  const quoteFresh = quote !== null && quotedInput === quoteInput;
  const [smartInput, setSmartInput] = useState<typeof quoteInput | null>(null);
  const report = (error: unknown) =>
    setStatus(
      error instanceof Error && error.message in commerceMessages
        ? (error.message as CommerceMessage)
        : "error",
    );
  const link = (route: string) => `${route}?lang=${locale}`;
  useEffect(() => {
    if (orderPage) return;
    let active = true;
    api<{ lines: CartLine[]; coupon: string; creditCents: number }>(
      "/commerce/cart",
    )
      .then((data) => {
        if (!active) return;
        setAuthenticated(true);
        setAvailable(data.creditCents);
        if (canHydrateCart() && data.lines.length) {
          setLines(data.lines);
          writeCart(data.lines);
        }
        setCoupon(data.coupon);
        setAppliedCoupon(data.coupon);
      })
      .catch((error) => {
        if (active && checkout) report(error);
      });
    return () => {
      active = false;
    };
  }, [orderPage, checkout]);
  useEffect(() => {
    if (orderPage) return;
    let active = true;
    setBusy(true);
    setQuoteFailed(false);
    setQuoteStatus(null);
    api<CartQuote>("/commerce/quote", "POST", quoteInput.request)
      .then((data) => {
        if (active) {
          setQuote(data);
          setQuotedInput(quoteInput);
          setQuoteFailed(false);
          trackCommerce("cart_view", {
            cards: data.cards,
            minimumRemainingCents: data.groups.reduce(
              (n, g) => n + g.minimumRemainingCents,
              0,
            ),
          });
        }
      })
      .catch((error) => {
        if (active) {
          setQuoteFailed(true);
          setQuoteStatus(
            error instanceof Error && error.message in commerceMessages
              ? (error.message as CommerceMessage)
              : "error",
          );
        }
      })
      .finally(() => {
        if (active) setBusy(false);
      });
    return () => {
      active = false;
    };
  }, [quoteInput, orderPage]);
  const change = async (next: CartLine[]) => {
    setStatus(null);
    setSmart(null);
    setCheckoutKey(crypto.randomUUID());
    try {
      writeCart(next, true);
      setLines(next);
      if (authenticated)
        await api("/commerce/cart", "PUT", {
          lines: next,
          coupon: appliedCoupon,
        });
    } catch (error) {
      report(error);
    }
  };
  const comparisonCount = (q: CartQuote) => {
    const cards =
      locale === "fr"
        ? q.cards <= 1
          ? "carte/produit"
          : "cartes/produits"
        : q.cards === 1
          ? "card/product"
          : "cards/products";
    const sellers =
      locale === "fr"
        ? q.groups.length <= 1
          ? "vendeur"
          : "vendeurs"
        : q.groups.length === 1
          ? "seller"
          : "sellers";
    return `${q.cards} ${cards} · ${q.groups.length} ${sellers}`;
  };
  const summary = (q: CartQuote) => [
    {
      id: "merchandise",
      label: t("merchandise"),
      amount: q.merchandiseCents / 100,
    },
    {
      id: "discount",
      label: t("discount"),
      amount: q.discountCents / 100,
      credit: true,
    },
    { id: "shipping", label: t("shipping"), amount: q.shippingCents / 100 },
  ];
  async function optimize() {
    if (!quoteFresh || busy) return;
    setBusy(true);
    setStatus(null);
    try {
      trackCommerce("smart_cart_started", { cards: quote?.cards ?? 0 });
      const result = await api<SmartResult>("/commerce/smart", "POST", {
        lines,
        coupon: appliedCoupon,
      });
      setSmart(result);
      setSmartInput(quoteInput);
      trackCommerce("smart_cart_completed", {
        savingsCents: result.savingsCents,
        sellersBefore: result.original.groups.length,
        sellersAfter: result.optimized.groups.length,
      });
    } catch (error) {
      report(error);
    } finally {
      setBusy(false);
    }
  }
  async function repair() {
    setBusy(true);
    try {
      const result = await api<{ lines: CartLine[] }>(
        "/commerce/repair",
        "POST",
        { lines },
      );
      await change(result.lines);
    } catch (error) {
      report(error);
    } finally {
      setBusy(false);
    }
  }
  async function applySmart() {
    if (!smart || smartInput !== quoteInput || !quoteFresh || busy) return;
    setBusy(true);
    try {
      if (authenticated)
        await api("/commerce/smart/apply", "POST", {
          lines,
          coupon: appliedCoupon,
        });
      writeCart(smart.lines);
      setLines(smart.lines);
      setQuote(smart.optimized);
      setSmart(null);
    } catch (error) {
      report(error);
    } finally {
      setBusy(false);
    }
  }
  async function place(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!quoteFresh || !quote?.eligible || busy) return;
    setBusy(true);
    setStatus(null);
    const values = new FormData(event.currentTarget);
    try {
      await api("/commerce/cart", "PUT", { lines, coupon: appliedCoupon });
      const result = await api<{ id: string }>("/commerce/checkout", "POST", {
        address: Object.fromEntries([
          ...values.entries(),
          ["province", province],
          ["country", "CA"],
        ]),
        creditCents: Math.round(Number(credit) * 100),
        idempotencyKey: checkoutKey,
      });
      writeCart([]);
      window.location.assign(link("/account/orders/" + result.id));
    } catch (error) {
      report(error);
    } finally {
      setBusy(false);
    }
  }
  const used = Math.min(
    quote?.totalCents ?? 0,
    available,
    Math.max(0, Math.round(Number(credit) * 100) || 0),
  );
  const unchanged =
    !!smart &&
    smart.lines.length === lines.length &&
    smart.lines.every((candidate) =>
      lines.some(
        (line) =>
          line.listingId === candidate.listingId &&
          line.quantity === candidate.quantity &&
          !!line.lockListing === !!candidate.lockListing &&
          !!line.lockSeller === !!candidate.lockSeller,
      ),
    );
  const beforeTaxLabel =
    locale === "fr" ? "Total avant taxes" : "Total before taxes";
  return (
    <div
      className={
        embeddedCart
          ? "troc-cart-embedded"
          : "min-h-screen bg-background text-foreground"
      }
    >
      {!embeddedCart && (
        <MarketplaceHeader
          cartBehavior="route"
          locale={locale}
          theme={theme}
          onLocale={setLocale}
          onTheme={setTheme}
        />
      )}

      <Container
        id={embeddedCart ? undefined : "main-content"}
        className={
          embeddedCart
            ? "troc-cart-drawer-body grid content-start gap-5"
            : "mx-auto grid min-h-[60vh] max-w-screen-xl content-start gap-6 px-4 py-8 md:px-8 md:py-12"
        }
      >
        {!embeddedCart && (
          <nav
            className="flex flex-wrap gap-4 border-b border-border pb-4 text-sm"
            aria-label={
              locale === "fr" ? "Navigation des commandes" : "Order navigation"
            }
          >
            {[
              ["/cart", "cart"],
              ["/smart-cart", "smart"],
              ["/account/orders", "orders"],
              ["/seller/orders", "fulfillment"],
            ].map(([url, key]) => (
              <a
                key={url}
                href={link(url)}
                className="underline"
                aria-current={path === url ? "page" : undefined}
              >
                {t(key as CommerceMessage)}
              </a>
            ))}
          </nav>
        )}
        {(!embeddedCart || !lines.length) && (
          <p
            className={
              embeddedCart
                ? "troc-cart-demo-note"
                : "border-l-2 border-border pl-3 text-xs leading-relaxed text-muted-foreground"
            }
          >
            {t("demo")}
          </p>
        )}
        {orderPage ? (
          <OrderPages path={path} locale={locale} />
        ) : (
          <>
            {!embeddedCart && (
              <EditorialIntro
                level={1}
                compact
                className="troc-page-opening"
                eyebrow="TROC · CANADA"
                title={t(checkout ? "checkout" : smartPage ? "smart" : "cart")}
                description={
                  locale === "fr"
                    ? checkout
                      ? "Vérifiez votre adresse et le détail de chaque vendeur. Ce paiement est simulé : aucun montant ne sera prélevé."
                      : smartPage
                        ? "Comparez le coût total, livraison comprise. Vérifiez chaque changement avant de l’appliquer à votre panier."
                        : "Vos cartes, regroupées par vendeur. Vérifiez les minimums et la livraison avant de poursuivre."
                    : checkout
                      ? "Review your address and each seller’s order. This checkout is simulated: no money will be charged."
                      : smartPage
                        ? "Compare the complete cost, including shipping. Review every change before applying it to your cart."
                        : "Your cards, grouped by seller. Check minimums and shipping before you continue."
                }
              />
            )}
            {!embeddedCart && !!lines.length && quote && !checkout && (
              <a className="troc-editorial-text-link" href="#cart-summary">
                {locale === "fr"
                  ? "Voir le récapitulatif"
                  : "View order summary"}
              </a>
            )}
            {visibleStatus && (
              <p role="alert">
                {!status && quoteStatus === "service_unavailable"
                  ? locale === "fr"
                    ? "Le devis est temporairement indisponible. Votre sélection est conservée."
                    : "The estimate is temporarily unavailable. Your selection is saved."
                  : t(visibleStatus)}
                {(visibleStatus === "inventory_unavailable" ||
                  visibleStatus === "seller_unavailable") && (
                  <Button
                    className="ml-2"
                    variant="outline"
                    disabled={busy}
                    onClick={repair}
                  >
                    {t("repairCart")}
                  </Button>
                )}
                {visibleStatus === "unauthorized" && (
                  <a className="ml-2 underline" href={link("/sign-in")}>
                    {t("signIn")}
                  </a>
                )}
                {status === "service_unavailable" && checkout && (
                  <span className="block mt-2">
                    {locale === "fr"
                      ? "Le paiement simulé est temporairement indisponible. Votre panier est conservé."
                      : "Simulated checkout is temporarily unavailable. Your cart is saved."}{" "}
                    <a className="underline" href={link("/cart")}>
                      {locale === "fr" ? "Retour au panier" : "Return to cart"}
                    </a>
                  </span>
                )}
              </p>
            )}
            {busy && <p role="status">{t("loading")}</p>}
            {!!lines.length && !quoteFresh && (
              <div className="troc-quote-recovery" role="status">
                <p>
                  {locale === "fr"
                    ? "Votre sélection est conservée. Les montants précédents ne sont plus à jour; un nouveau devis est nécessaire pour poursuivre."
                    : "Your selection is saved. Previous amounts are no longer current; refresh the estimate before continuing."}
                </p>
                {quoteFailed && (
                  <Button
                    variant="secondary"
                    disabled={busy}
                    onClick={() => {
                      setQuoteStatus(null);
                      setQuoteRevision((value) => value + 1);
                    }}
                  >
                    {locale === "fr" ? "Réessayer le devis" : "Retry estimate"}
                  </Button>
                )}
              </div>
            )}
            {!lines.length ? (
              smartPage ? (
                <SmartCartDemo locale={locale} catalogHref={link("/search")} />
              ) : (
                <PremiumEmptyState
                  title={
                    locale === "fr"
                      ? "Votre panier attend sa première carte."
                      : "Your cart is ready for its first card."
                  }
                  description={
                    locale === "fr"
                      ? "Une commune pour compléter votre extension ou votre prochaine grande trouvaille. Commencez par les cartes."
                      : "A common to complete your set, or your next great find. Start with the cards."
                  }
                  actions={
                    <>
                      <Button asChild>
                        <a href={link("/search")}>{t("browse")}</a>
                      </Button>
                      <a
                        className="troc-editorial-text-link"
                        href={link("/want-lists")}
                      >
                        {locale === "fr"
                          ? "Listes de souhaits · à venir"
                          : "Want lists · planned"}
                      </a>
                    </>
                  }
                />
              )
            ) : (
              quote && (
                <>
                  {smartPage && (
                    <>
                      <Button disabled={busy || !quoteFresh} onClick={optimize}>
                        {t("optimize")}
                      </Button>
                      {smart && smartInput === quoteInput && (
                        <>
                          {unchanged && (
                            <div role="status" className="grid gap-2">
                              <h2 className="text-xl font-semibold">
                                {locale === "fr"
                                  ? "Aucun meilleur total trouvé"
                                  : "No better total found"}
                              </h2>
                              <p>
                                {locale === "fr"
                                  ? "Parmi les offres comparées, Smart Cart conserve vos cartes et vos vendeurs actuels."
                                  : "Among the offers compared, Smart Cart keeps your current cards and sellers."}
                              </p>
                            </div>
                          )}
                          <SmartCartComparison
                            locale={locale}
                            sellersRowLabel=""
                            columns={[
                              {
                                heading: t("original"),
                                sellersLabel: comparisonCount(smart.original),
                                lines: summary(smart.original),
                                totalLabel: beforeTaxLabel,
                                total: smart.original.totalCents / 100,
                              },
                              {
                                heading: t("optimized"),
                                sellersLabel: comparisonCount(smart.optimized),
                                lines: summary(smart.optimized),
                                totalLabel: beforeTaxLabel,
                                total: smart.optimized.totalCents / 100,
                                recommended: smart.savingsCents > 0,
                              },
                            ]}
                            savings={
                              smart.savingsCents === 0
                                ? undefined
                                : {
                                    label: t(
                                      smart.savingsCents < 0
                                        ? "additionalCost"
                                        : "save",
                                    ),
                                    amount: Math.abs(smart.savingsCents) / 100,
                                  }
                            }
                            explanation={
                              smart.shippingSavingsCents === 0
                                ? undefined
                                : `${t("shippingSaved")}: ${money(smart.shippingSavingsCents)}`
                            }
                          />
                          <SmartChanges result={smart} locale={locale} />
                          {!unchanged && (
                            <p>
                              {smart.substitutions.length
                                ? `${t("substitutions")}: ${smart.substitutions.length} · ${t("difference")}: ${money(smart.substitutions.reduce((n, s) => n + s.merchandiseDifferenceCents, 0))}`
                                : t("unchanged")}
                            </p>
                          )}
                          {unchanged ? (
                            <Button asChild>
                              <a href={link("/cart")}>
                                {locale === "fr"
                                  ? "Retour au panier"
                                  : "Return to cart"}
                              </a>
                            </Button>
                          ) : (
                            <Button
                              disabled={busy || !quoteFresh}
                              onClick={applySmart}
                            >
                              {t("applySmart")}
                            </Button>
                          )}
                        </>
                      )}
                    </>
                  )}
                  {embeddedCart && quoteFresh && (
                    <div className="troc-cart-goals">
                      {quote.groups
                        .filter(
                          (g) =>
                            g.minimumRemainingCents > 0 ||
                            g.freeShippingRemainingCents !== null ||
                            g.nextPromotion,
                        )
                        .map((g) => (
                          <div key={g.seller.id}>
                            <strong>{commerceSellerName(g)}</strong>
                            {g.minimumRemainingCents > 0 ? (
                              <Progress
                                size="compact"
                                tone="accent"
                                label={t("minimum")}
                                value={g.merchandiseCents}
                                max={g.seller.minimumCents}
                                valueLabel={
                                  t("addMore") +
                                  " " +
                                  money(g.minimumRemainingCents)
                                }
                              />
                            ) : g.freeShippingRemainingCents !== null ? (
                              <Progress
                                size="compact"
                                tone="accent"
                                label={t("free")}
                                value={g.merchandiseCents - g.discountCents}
                                max={g.seller.freeShippingCents ?? 0}
                                valueLabel={
                                  g.freeShippingRemainingCents === 0
                                    ? t("freeReached")
                                    : t("addMore") +
                                      " " +
                                      money(g.freeShippingRemainingCents)
                                }
                              />
                            ) : (
                              g.nextPromotion && (
                                <Progress
                                  size="compact"
                                  tone="accent"
                                  label={
                                    t("promotion") +
                                    " · " +
                                    g.nextPromotion.basisPoints / 100 +
                                    "%"
                                  }
                                  value={
                                    g.nextPromotion.minimumCards
                                      ? g.cards
                                      : g.merchandiseCents
                                  }
                                  max={
                                    g.nextPromotion.minimumCards ??
                                    g.nextPromotion.minimumCents ??
                                    0
                                  }
                                  valueLabel={
                                    g.nextPromotion.minimumCards
                                      ? g.cards +
                                        " / " +
                                        g.nextPromotion.minimumCards +
                                        " " +
                                        t("cards")
                                      : money(g.merchandiseCents) +
                                        " / " +
                                        money(g.nextPromotion.minimumCents ?? 0)
                                  }
                                />
                              )
                            )}
                          </div>
                        ))}
                    </div>
                  )}
                  {embeddedCart && (
                    <div className="troc-cart-order-heading">
                      <h2>
                        {locale === "fr" ? "Votre commande" : "Order summary"}
                      </h2>
                      <span>
                        {quote.groups.length}{" "}
                        {locale === "fr"
                          ? quote.groups.length > 1
                            ? "vendeurs"
                            : "vendeur"
                          : quote.groups.length === 1
                            ? "seller"
                            : "sellers"}{" "}
                        · {quote.cards}{" "}
                        {locale === "fr"
                          ? quote.cards > 1
                            ? "cartes"
                            : "carte"
                          : quote.cards === 1
                            ? "card"
                            : "cards"}
                      </span>
                    </div>
                  )}
                  <div className="troc-commerce-layout grid items-start gap-6 lg:grid-cols-[minmax(0,1fr)_20rem]">
                    <CartGroups
                      compact={embeddedCart}
                      quote={quote}
                      locale={locale}
                      change={change}
                      readOnly={!quoteFresh || (embeddedCart && busy)}
                    />
                    <aside
                      id="cart-summary"
                      tabIndex={-1}
                      aria-label={
                        locale === "fr" ? "Récapitulatif" : "Order summary"
                      }
                      className={
                        embeddedCart
                          ? "troc-cart-sticky-summary"
                          : "grid gap-4 rounded-lg border border-border bg-card p-4 lg:sticky lg:top-6"
                      }
                    >
                      {!quoteFresh && (
                        <p className="font-semibold" role="status">
                          {locale === "fr"
                            ? "Devis précédent — à actualiser"
                            : "Previous estimate — refresh required"}
                        </p>
                      )}
                      <OrderTotals
                        locale={locale}
                        lines={[
                          ...summary(quote).filter(
                            (line) =>
                              !embeddedCart ||
                              line.id !== "discount" ||
                              line.amount !== 0,
                          ),
                          ...(!embeddedCart
                            ? [
                                {
                                  id: "tax",
                                  label: t("tax"),
                                  amount: checkout
                                    ? quote.taxCents / 100
                                    : null,
                                },
                              ]
                            : []),
                          ...(checkout
                            ? [
                                {
                                  id: "credit",
                                  label: t("credit"),
                                  amount: used / 100,
                                  credit: true,
                                },
                              ]
                            : []),
                        ]}
                        totalLabel={checkout ? t("total") : beforeTaxLabel}
                        total={(quote.totalCents - used) / 100}
                      />
                      {!checkout && (
                        <p className="troc-cart-tax-note text-sm text-muted-foreground">
                          {locale === "fr"
                            ? embeddedCart
                              ? "Taxes estimées au paiement simulé."
                              : "Les taxes seront estimées au paiement simulé, selon votre province."
                            : embeddedCart
                              ? "Taxes estimated at simulated checkout."
                              : "Taxes will be estimated at simulated checkout, based on your province."}
                        </p>
                      )}
                      <details>
                        <summary className="cursor-pointer py-3 font-medium">
                          {t("coupon")}
                        </summary>
                        <div className="grid gap-3 pb-2">
                          <label className="grid gap-2">
                            {t("coupon")}
                            <Input
                              value={coupon}
                              maxLength={40}
                              onChange={(e) => setCoupon(e.target.value)}
                            />
                          </label>
                          <Button
                            variant="outline"
                            onClick={() => {
                              setAppliedCoupon(coupon);
                              setSmart(null);
                              setCheckoutKey(crypto.randomUUID());
                            }}
                          >
                            {t("apply")}
                          </Button>
                        </div>
                      </details>
                      {!busy &&
                        quote.groups.some(
                          (group) => group.minimumRemainingCents > 0,
                        ) && (
                          <div
                            id="cart-minimum-explanation"
                            className="grid gap-2 text-sm"
                          >
                            <p>
                              {locale === "fr"
                                ? embeddedCart
                                  ? "Minimums requis :"
                                  : "Atteignez les minimums de ces vendeurs pour poursuivre :"
                                : embeddedCart
                                  ? "Required seller minimums:"
                                  : "Meet these seller minimums to continue:"}
                            </p>
                            <ul className="grid gap-2">
                              {quote.groups
                                .filter(
                                  (group) => group.minimumRemainingCents > 0,
                                )
                                .map((group) => (
                                  <li key={group.seller.id}>
                                    <a
                                      className="underline"
                                      href={`#cart-seller-${group.seller.id}`}
                                    >
                                      {commerceSellerName(group)} ·{" "}
                                      {locale === "fr" ? "il manque" : "add"}{" "}
                                      {money(group.minimumRemainingCents)}
                                    </a>
                                  </li>
                                ))}
                            </ul>
                          </div>
                        )}
                      {!checkout && (
                        <>
                          <a
                            className="troc-cart-smart-link underline"
                            href={link("/smart-cart")}
                          >
                            {t("smart")}
                          </a>
                          <Button
                            disabled={!quote.eligible || busy || !quoteFresh}
                            aria-describedby={
                              !busy &&
                              quote.groups.some(
                                (group) => group.minimumRemainingCents > 0,
                              )
                                ? "cart-minimum-explanation"
                                : undefined
                            }
                            onClick={() =>
                              window.location.assign(link("/checkout"))
                            }
                          >
                            {embeddedCart
                              ? locale === "fr"
                                ? "Vérifier la commande →"
                                : "Review order →"
                              : t("checkout")}
                          </Button>
                        </>
                      )}
                      {embeddedCart && (
                        <p className="troc-cart-payment-note">
                          {locale === "fr"
                            ? "Panier de démonstration. Aucun paiement ne sera prélevé."
                            : "This is a demo cart. No payment will be charged."}
                        </p>
                      )}
                    </aside>
                  </div>
                  {checkout && status !== "service_unavailable" && (
                    <form onSubmit={place} className="grid max-w-xl gap-4">
                      <h2 className="text-xl font-bold">{t("country")}</h2>
                      {(
                        [
                          "recipient",
                          "line1",
                          "line2",
                          "city",
                          "postalCode",
                        ] as const
                      ).map((name) => (
                        <label key={name} className="grid gap-2">
                          {t(name)}
                          <Input
                            name={name}
                            required={name !== "line2"}
                            maxLength={150}
                            autoComplete={
                              {
                                recipient: "name",
                                line1: "address-line1",
                                line2: "address-line2",
                                city: "address-level2",
                                postalCode: "postal-code",
                              }[name]
                            }
                            onChange={() => setCheckoutKey(crypto.randomUUID())}
                          />
                        </label>
                      ))}
                      <label className="grid gap-2">
                        {t("province")}
                        <Select
                          value={province}
                          onValueChange={(value) => {
                            setProvince(value);
                            setCheckoutKey(crypto.randomUUID());
                          }}
                        >
                          <SelectTrigger aria-label={t("province")}>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {[
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
                            ].map((p) => (
                              <SelectItem key={p} value={p}>
                                {p}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </label>
                      <p>
                        {t("creditAvailable")}: {money(available)}
                      </p>
                      <label className="grid gap-2">
                        {t("creditUse")}
                        <Input
                          type="number"
                          min="0"
                          max={available / 100}
                          step="0.01"
                          value={credit}
                          onChange={(e) => {
                            setCredit(e.target.value);
                            setCheckoutKey(crypto.randomUUID());
                          }}
                        />
                      </label>
                      <p className="text-sm text-muted-foreground">
                        {t("estimate")}
                      </p>
                      {!authenticated && (
                        <a className="underline" href={link("/sign-in")}>
                          {t("signIn")}
                        </a>
                      )}
                      <Button
                        type="submit"
                        disabled={
                          busy ||
                          !authenticated ||
                          !quote.eligible ||
                          !quoteFresh
                        }
                      >
                        {t("pay")}
                      </Button>
                    </form>
                  )}
                </>
              )
            )}
          </>
        )}
      </Container>
      {!embeddedCart && <MarketplaceFooter locale={locale} />}
    </div>
  );
}
