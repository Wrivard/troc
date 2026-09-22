import { useEffect, useState, type FormEvent } from "react";
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
import { TrocLogo } from "@workspace/troc-design-system/components/ui/logo";
import { LocaleSwitcher } from "@workspace/troc-design-system/components/ui/locale-switcher";
import { ThemeSwitcher } from "@workspace/troc-design-system/components/ui/theme-switcher";
import { OrderTotals } from "@workspace/troc-design-system/components/ui/order-totals";
import { SmartCartComparison } from "@workspace/troc-design-system/components/ui/smart-cart";
import { api } from "../../api";
import { readCart, writeCart } from "./cart-storage";
import { trackCommerce } from "./analytics";
import { CartGroups } from "./CartGroups";
import { SmartChanges } from "./SmartChanges";
import { OrderPages } from "./OrderPages";
import { commerceMessages, type CommerceMessage } from "./messages";
export function CommerceApp({ path }: { path: string }) {
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
  const [checkoutKey, setCheckoutKey] = useState(() => crypto.randomUUID());
  const orderPage =
      path.startsWith("/account/orders") || path.startsWith("/seller/orders"),
    checkout = path === "/checkout",
    smartPage = path === "/smart-cart";
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
        if (!readCart().length && data.lines.length) {
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
    api<CartQuote>("/commerce/quote", "POST", {
      lines,
      coupon: appliedCoupon,
      province: checkout ? province : undefined,
    })
      .then((data) => {
        if (active) {
          setQuote(data);
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
        if (active) report(error);
      })
      .finally(() => {
        if (active) setBusy(false);
      });
    return () => {
      active = false;
    };
  }, [lines, appliedCoupon, province, checkout, orderPage]);
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
    setBusy(true);
    setStatus(null);
    try {
      trackCommerce("smart_cart_started", { cards: quote?.cards ?? 0 });
      const result = await api<SmartResult>("/commerce/smart", "POST", {
        lines,
        coupon: appliedCoupon,
      });
      setSmart(result);
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
    if (!smart) return;
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
  return (
    <div className="min-h-screen bg-background text-foreground">
      <header className="flex flex-wrap items-center justify-between gap-4 border-b border-border p-4 print:hidden">
        <a href={link("/")} aria-label="TROC">
          <TrocLogo height={26} />
        </a>
        <nav className="flex flex-wrap gap-4" aria-label="TROC">
          {(
            [
              ["/cart", "cart"],
              ["/smart-cart", "smart"],
              ["/account/orders", "orders"],
              ["/seller/orders", "fulfillment"],
            ] as const
          ).map(([url, key]) => (
            <a key={url} className="text-sm underline" href={link(url)}>
              {t(key)}
            </a>
          ))}
        </nav>
        <div className="flex gap-2">
          <LocaleSwitcher
            value={locale}
            onValueChange={setLocale}
            groupLabel={locale === "en" ? "Language" : "Langue"}
            options={[
              { value: "en", code: "EN", label: "English" },
              { value: "fr", code: "FR", label: "Français" },
            ]}
          />
          <ThemeSwitcher
            value={theme}
            onValueChange={setTheme}
            groupLabel={locale === "en" ? "Theme" : "Thème"}
            options={[
              { value: "dark", label: "TROC Dark" },
              { value: "light", label: "TROC Light" },
            ]}
            iconOnly
          />
        </div>
      </header>
      <main className="mx-auto grid max-w-screen-xl gap-6 p-4 md:p-8">
        <p className="text-sm text-muted-foreground">{t("demo")}</p>
        {orderPage ? (
          <OrderPages path={path} locale={locale} />
        ) : (
          <>
            <h1 className="text-2xl font-bold">
              {t(checkout ? "checkout" : smartPage ? "smart" : "cart")}
            </h1>
            {status && (
              <p role="alert">
                {t(status)}
                {(status === "inventory_unavailable" ||
                  status === "seller_unavailable") && (
                  <Button
                    className="ml-2"
                    variant="outline"
                    disabled={busy}
                    onClick={repair}
                  >
                    {t("repairCart")}
                  </Button>
                )}
                {(status === "unauthorized" ||
                  status === "service_unavailable") && (
                  <a className="ml-2 underline" href={link("/sign-in")}>
                    {t("signIn")}
                  </a>
                )}
              </p>
            )}
            {busy && <p role="status">{t("loading")}</p>}
            {!lines.length ? (
              <p>
                {t("empty")}{" "}
                <a className="underline" href={link("/search")}>
                  {t("browse")}
                </a>
              </p>
            ) : (
              quote && (
                <>
                  {smartPage && (
                    <>
                      <Button disabled={busy} onClick={optimize}>
                        {t("optimize")}
                      </Button>
                      {smart && (
                        <>
                          <SmartCartComparison
                            locale={locale}
                            sellersRowLabel={t("sellers")}
                            columns={[
                              {
                                heading: t("original"),
                                sellersLabel: `${smart.original.cards} ${t("cards")} · ${smart.original.groups.length} ${t("sellers")}`,
                                lines: summary(smart.original),
                                totalLabel: t("total"),
                                total: smart.original.totalCents / 100,
                              },
                              {
                                heading: t("optimized"),
                                sellersLabel: `${smart.optimized.cards} ${t("cards")} · ${smart.optimized.groups.length} ${t("sellers")}`,
                                lines: summary(smart.optimized),
                                totalLabel: t("total"),
                                total: smart.optimized.totalCents / 100,
                                recommended: true,
                              },
                            ]}
                            savings={{
                              label: t(
                                smart.savingsCents < 0
                                  ? "additionalCost"
                                  : "save",
                              ),
                              amount: Math.abs(smart.savingsCents) / 100,
                            }}
                            explanation={`${t("shippingSaved")}: ${money(smart.shippingSavingsCents)}`}
                          />
                          <SmartChanges result={smart} locale={locale} />
                          <p>
                            {smart.substitutions.length
                              ? `${t("substitutions")}: ${smart.substitutions.length} · ${t("difference")}: ${money(smart.substitutions.reduce((n, s) => n + s.merchandiseDifferenceCents, 0))}`
                              : t("unchanged")}
                          </p>
                          <Button disabled={busy} onClick={applySmart}>
                            {t("applySmart")}
                          </Button>
                        </>
                      )}
                    </>
                  )}
                  <div className="grid items-start gap-6 lg:grid-cols-[minmax(0,1fr)_20rem]">
                    <CartGroups quote={quote} locale={locale} change={change} />
                    <aside className="grid gap-4">
                      <OrderTotals
                        locale={locale}
                        lines={[
                          ...summary(quote),
                          {
                            id: "tax",
                            label: t("tax"),
                            amount: checkout ? quote.taxCents / 100 : null,
                          },
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
                        totalLabel={t("total")}
                        total={(quote.totalCents - used) / 100}
                      />
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
                      {!checkout && (
                        <>
                          <a className="underline" href={link("/smart-cart")}>
                            {t("smart")}
                          </a>
                          <Button
                            disabled={!quote.eligible || busy}
                            onClick={() =>
                              window.location.assign(link("/checkout"))
                            }
                          >
                            {t("checkout")}
                          </Button>
                        </>
                      )}
                    </aside>
                  </div>
                  {checkout && (
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
                        disabled={busy || !authenticated || !quote.eligible}
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
      </main>
    </div>
  );
}
