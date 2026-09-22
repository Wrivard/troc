import { useState } from "react";
import type { PublicPage, Locale, ProductResult } from "@workspace/catalog";
import { Button } from "@workspace/troc-design-system/components/ui/button";
import { Input } from "@workspace/troc-design-system/components/ui/input";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@workspace/troc-design-system/components/ui/select";
import { SiteHeader } from "@workspace/troc-design-system/components/ui/site-navigation";
import {
  ProductCard,
  CardImage,
  CardTitle,
  CardMetadata,
  ProductAvailability,
} from "@workspace/troc-design-system/components/ui/product-presentation";
import { CatalogArtwork } from "./CatalogArtwork";
import { TrocLogo } from "@workspace/troc-design-system/components/ui/logo";
import {
  PriceBlock,
  ReferencePrice,
  LowestAvailable,
} from "@workspace/troc-design-system/components/ui/price";
import { SellerOfferRow } from "@workspace/troc-design-system/components/ui/seller-offer";
import {
  SellerAvatar,
  SellerBanner,
  SellerStorefrontHeader,
} from "@workspace/troc-design-system/components/ui/seller-storefront";
import { SellerBadge } from "@workspace/troc-design-system/components/ui/seller-badges";
import { ConditionBadge } from "@workspace/troc-design-system/components/ui/marketplace-badges";
import {
  ChartContainer,
  ChartTooltip,
} from "@workspace/troc-design-system/components/ui/chart";
import { LineChart, Line, XAxis, YAxis, Tooltip } from "recharts";
import { catalogMessages, type CatalogMessage } from "./messages";
import { formatSourcePrice, productSelection } from "./presentation";
export interface PublicProps {
  page: PublicPage;
  theme?: "dark" | "light";
  base?: string;
  onLocale?: (locale: Locale) => void;
  onTheme?: (theme: "dark" | "light") => void;
}
export function PublicMarketplace({
  page,
  theme = "dark",
  base = "",
  onLocale,
  onTheme,
}: PublicProps) {
  const locale = page.locale;
  const t = (key: CatalogMessage) =>
    catalogMessages[key][locale === "en" ? 0 : 1];
  const [query, setQuery] = useState(page.filters.q);
  const [tab, setTab] = useState(
    page.filters.max === 99 && page.kind === "store" ? "deals" : "shop",
  );
  const href = (path: string, values: Record<string, string> = {}) => {
    const p = new URLSearchParams({ lang: locale, ...values });
    return `${base}${path}?${p}`;
  };
  const go = (path: string, values: Record<string, string> = {}) =>
    window.location.assign(href(path, values));
  const money = (cents: number | null, label: CatalogMessage) => {
    const Price =
      label === "lowest"
        ? LowestAvailable
        : label === "reference"
          ? ReferencePrice
          : PriceBlock;
    return (
      <Price
        amount={cents === null ? null : cents / 100}
        label={t(label)}
        locale={locale}
      />
    );
  };
  const format = (cents: number) =>
    new Intl.NumberFormat(`${locale}-CA`, {
      style: "currency",
      currency: "CAD",
    }).format(cents / 100);
  const currentGame = page.games.find((g) => g.slug === page.filters.game);
  const currentSet = page.sets.find((s) => s.slug === page.filters.set);
  const product = page.product;
  const selected = product?.variants.find(
    (v) => v.id === page.selectedVariantId,
  );
  const title =
    product?.name[locale] ??
    page.seller?.name ??
    currentSet?.name[locale] ??
    currentGame?.name[locale] ??
    t(page.kind === "home" ? "title" : "results");
  const offerHref = (offerPage: number) =>
    href(page.path, {
      variantId: page.selectedVariantId ?? "",
      offerPage: String(offerPage),
      offerLimit: String(page.offerLimit),
      offerSort: page.offerSort,
      condition: page.filters.condition,
      seller: page.filters.seller,
      min: page.filters.min === null ? "" : String(page.filters.min),
      max: page.filters.max === null ? "" : String(page.filters.max),
      grade: page.selectedGrade ?? "",
    });
  const cards = (items: ProductResult[]) => (
    <div className="grid grid-cols-2 gap-4 md:grid-cols-3 xl:grid-cols-4">
      {items.map((result) => {
        const p = result.product;
        const set = page.sets.find((s) => s.id === p.setId);
        const selection = productSelection(p, page.filters);
        const productHref = href(`/product/${p.slug}`, selection.params);
        return (
          <ProductCard
            key={p.id}
            image={
              <a href={productHref} tabIndex={-1} aria-hidden="true">
                <CatalogArtwork
                  product={p}
                  variant={selection.variant}
                  locale={locale}
                />
              </a>
            }
            title={
              <CardTitle>
                <a href={productHref}>{p.name[locale]}</a>
              </CardTitle>
            }
            metadata={
              <CardMetadata
                items={[
                  page.games.find((g) => g.id === p.gameId)?.name[locale],
                  set?.name[locale] ?? "",
                  selection.variant?.number,
                  t(p.type),
                ]}
              />
            }
            price={
              <div className="flex flex-wrap gap-4">
                {money(result.lowestCents, "lowest")}
                {money(result.referenceCents, "reference")}
              </div>
            }
            availability={
              <ProductAvailability
                sellersLabel={`${result.sellerCount} ${t("sellers")}`}
                stockLabel={`${result.quantity} ${t("available")}`}
                outOfStock={!result.quantity}
              />
            }
            actions={
              <Button asChild variant="secondary" size="sm">
                <a href={productHref}>{t("view")}</a>
              </Button>
            }
          />
        );
      })}
    </div>
  );
  const filter = (
    key: string,
    label: CatalogMessage,
    value: string,
    options: { value: string; label: string }[],
  ) => (
    <label className="grid min-w-0 gap-2">
      <span>{t(label)}</span>
      <Select name={key} defaultValue={value || "__all"}>
        <SelectTrigger aria-label={t(label)}>
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="__all">{t("all")}</SelectItem>
          {options.map((o) => (
            <SelectItem key={o.value} value={o.value}>
              {o.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </label>
  );
  const filterForm = (
    <form
      action={`${base}${page.path}`}
      className="grid gap-4 rounded-lg border border-border p-4 sm:grid-cols-2 lg:grid-cols-4"
      onSubmit={(event) => {
        event.preventDefault();
        const values = new URLSearchParams();
        new FormData(event.currentTarget).forEach((v, k) => {
          if (v && v !== "__all") values.set(k, String(v));
        });
        window.location.assign(`${base}${page.path}?${values}`);
      }}
    >
      <input type="hidden" name="lang" value={locale} />
      <label className="grid gap-2">
        {t("searchLabel")}
        <Input name="q" defaultValue={page.filters.q} maxLength={100} />
      </label>
      {page.kind !== "game" &&
        filter(
          "game",
          "game",
          page.filters.game,
          page.games.map((g) => ({ value: g.slug, label: g.name[locale] })),
        )}
      {page.kind !== "set" &&
        filter(
          "set",
          "set",
          page.filters.set,
          page.sets
            .filter((s) => !currentGame || s.gameId === currentGame.id)
            .map((s) => ({ value: s.slug, label: s.name[locale] })),
        )}
      {filter(
        "type",
        "type",
        page.filters.type,
        ["raw_single", "graded_card", "sealed"].map((v) => ({
          value: v,
          label: t(v as CatalogMessage),
        })),
      )}
      {filter("language", "language", page.filters.language, [
        { value: "en", label: t("english") },
        { value: "ja", label: t("japanese") },
      ])}
      {filter(
        "variant",
        "variant",
        page.filters.variant,
        [
          ...new Set([
            page.filters.variant,
            ...page.results.flatMap((r) =>
              r.product.variants.map((v) => v.key),
            ),
          ]),
        ]
          .filter(Boolean)
          .map((v) => ({
            value: v,
            label: v in catalogMessages ? t(v as CatalogMessage) : v,
          })),
      )}
      {filter(
        "rarity",
        "rarity",
        page.filters.rarity,
        [
          ...new Set([
            page.filters.rarity,
            ...page.results.flatMap((r) =>
              r.product.variants.map((v) => v.rarity),
            ),
          ]),
        ]
          .filter(Boolean)
          .map((v) => ({
            value: v,
            label: v in catalogMessages ? t(v as CatalogMessage) : v,
          })),
      )}
      {filter(
        "condition",
        "condition",
        page.filters.condition,
        ["NM", "LP", "MP", "HP", "DMG"].map((v) => ({ value: v, label: v })),
      )}
      <label className="grid gap-2">
        {t("min")}
        <Input
          type="number"
          min={0}
          step={1}
          name="min"
          defaultValue={page.filters.min ?? ""}
        />
      </label>
      <label className="grid gap-2">
        {t("max")}
        <Input
          type="number"
          min={0}
          step={1}
          name="max"
          defaultValue={page.filters.max ?? ""}
        />
      </label>
      {filter(
        "sort",
        "sort",
        page.filters.sort,
        ["name", "price", "newest"].map((v) => ({
          value: v,
          label: t(v as CatalogMessage),
        })),
      )}
      <div className="flex flex-wrap items-end gap-2">
        <Button type="submit">{t("apply")}</Button>
        <Button asChild variant="ghost">
          <a href={href(page.path)}>{t("reset")}</a>
        </Button>
      </div>
    </form>
  );
  return (
    <div className="min-h-screen bg-background text-foreground">
      <SiteHeader
        homeHref={href("/")}
        logoLabel="TROC"
        navLabel={t("navigation")}
        navItems={[
          {
            id: "shop",
            label: t("shop"),
            current: true,
            onSelect: () => go("/"),
          },
          { id: "sell", label: t("sell"), disabled: true },
          { id: "collect", label: t("collect"), disabled: true },
        ]}
        search={{
          label: t("searchLabel"),
          placeholder: t("search"),
          value: query,
          onValueChange: setQuery,
          suggestions: [],
          onSubmit: (q) => go("/search", { q }),
          loadingLabel: t("loading"),
          emptyLabel: t("searchAction"),
          clearLabel: t("clear"),
          submitLabel: t("searchAction"),
        }}
        locale={{
          value: locale,
          onValueChange: (value) => onLocale?.(value),
          groupLabel: t("language"),
          options: [
            { value: "en", code: "EN", label: "English" },
            { value: "fr", code: "FR", label: "Français" },
          ],
        }}
        theme={{
          value: theme,
          onValueChange: (value) => onTheme?.(value),
          groupLabel: t("theme"),
          options: [
            { value: "dark", label: "TROC Dark" },
            { value: "light", label: "TROC Light" },
          ],
        }}
        cartLabel={t("cart")}
        accountLabel={t("account")}
        signInLabel={t("signIn")}
        onSignIn={() => go("/sign-in")}
        onCart={() =>
          document
            .getElementById("browse-only")
            ?.scrollIntoView({ behavior: "smooth" })
        }
      />
      <main className="mx-auto grid max-w-screen-xl gap-8 p-4 md:p-8">
        {page.demo && (
          <p
            className="rounded-lg border border-border bg-muted p-4 text-sm"
            role="note"
          >
            {t("demo")}
          </p>
        )}
        <nav aria-label={t("game")} className="flex flex-wrap gap-2">
          <Button asChild variant="ghost" size="sm">
            <a href={href("/")}>{t("home")}</a>
          </Button>
          {page.games.map((g) => (
            <Button
              key={g.id}
              asChild
              variant={currentGame?.id === g.id ? "primary" : "secondary"}
              size="sm"
            >
              <a href={href(`/games/${g.slug}`)}>{g.name[locale]}</a>
            </Button>
          ))}
        </nav>
        <header className="grid gap-3">
          <h1 className="text-3xl font-bold tracking-tight">{title}</h1>
          {page.kind === "home" && (
            <p className="text-muted-foreground">{t("subtitle")}</p>
          )}
        </header>
        {page.kind === "home" ? (
          <>
            <section className="grid gap-4">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <h2 className="text-xl font-bold">{t("trending")}</h2>
                <span className="text-sm text-muted-foreground">
                  {page.demo ? t("demoSelection") : t("newest")}
                </span>
              </div>
              {cards(page.results.slice(0, 8))}
            </section>
            <section className="grid gap-4">
              <h2 className="text-xl font-bold">{t("sets")}</h2>
              <div className="flex flex-wrap gap-3">
                {page.sets.map((s) => (
                  <Button asChild variant="secondary" key={s.id}>
                    <a href={href(`/sets/${s.slug}`)}>
                      {page.games.find((g) => g.id === s.gameId)?.name[locale]}{" "}
                      · {s.name[locale]}
                    </a>
                  </Button>
                ))}
              </div>
            </section>
            <section className="grid gap-4">
              <h2 className="text-xl font-bold">{t("deals")}</h2>
              {cards(
                page.results
                  .filter((r) => r.lowestCents !== null && r.lowestCents < 100)
                  .slice(0, 4),
              )}
              <Button asChild variant="outline">
                <a href={href("/search", { max: "99", sort: "price" })}>
                  {t("deals")}
                </a>
              </Button>
            </section>
            <section className="grid gap-4">
              <h2 className="text-xl font-bold">{t("featured")}</h2>
              <div className="grid gap-4 md:grid-cols-3">
                {page.sellers.map((s) => (
                  <SellerStorefrontHeader
                    key={s.id}
                    name={s.name}
                    avatar={<SellerAvatar name={s.name} src={s.logoUrl} />}
                    tagline={`${s.city}, ${s.province}`}
                    compact
                    actions={
                      <Button asChild variant="secondary">
                        <a href={href(`/store/${s.slug}`)}>{t("store")}</a>
                      </Button>
                    }
                  />
                ))}
              </div>
            </section>
            <section className="grid gap-2 border-t border-border pt-6">
              <h2 className="text-xl font-bold">{t("recent")}</h2>
              <p>{t("noSales")}</p>
            </section>
            <section className="grid gap-3 rounded-lg border border-border p-6">
              <h2 className="text-2xl font-bold">{t("collectTitle")}</h2>
              <p>{t("collectCopy")}</p>
              <Button disabled>{t("missing")}</Button>
            </section>
            <section className="grid gap-2">
              <h2 className="text-xl font-bold">{t("canada")}</h2>
              <p>{t("canadaCopy")}</p>
            </section>
            <section className="grid gap-2">
              <h2 className="text-xl font-bold">{t("founding")}</h2>
              <p>{t("foundingCopy")}</p>
            </section>
          </>
        ) : product ? (
          <>
            <section className="grid gap-6 md:grid-cols-3">
              <div>
                <CatalogArtwork
                  key={selected?.id ?? product.id}
                  product={product}
                  variant={selected}
                  locale={locale}
                  gallery
                />
              </div>
              <div className="grid content-start gap-6 md:col-span-2">
                <CardMetadata
                  items={[
                    page.games.find((g) => g.id === product.gameId)?.name[
                      locale
                    ],
                    page.sets.find((s) => s.id === product.setId)?.name[locale],
                    selected?.number,
                    t(product.type),
                  ]}
                />
                <div className="flex flex-wrap gap-2">
                  {product.variants.map((v) => (
                    <Button
                      asChild
                      variant={v.id === selected?.id ? "primary" : "secondary"}
                      key={v.id}
                    >
                      <a href={href(page.path, { variantId: v.id })}>
                        {t(v.language === "en" ? "english" : "japanese")} ·{" "}
                        {v.key in catalogMessages
                          ? t(v.key as CatalogMessage)
                          : v.key}
                      </a>
                    </Button>
                  ))}
                </div>
                <CardMetadata
                  items={[
                    selected?.rarity &&
                      (selected.rarity in catalogMessages
                        ? t(selected.rarity as CatalogMessage)
                        : selected.rarity),
                    selected?.artist,
                    ...Object.values(selected?.attributes ?? {}).map((v) =>
                      v in catalogMessages ? t(v as CatalogMessage) : v,
                    ),
                  ]}
                />
                <div className="flex flex-wrap gap-6">
                  {money(page.results[0]?.referenceCents ?? null, "reference")}
                  {money(page.results[0]?.lowestCents ?? null, "lowest")}
                  {money(page.results[0]?.medianCents ?? null, "median")}
                </div>
                <ProductAvailability
                  sellersLabel={`${page.results[0]?.sellerCount ?? 0} ${t("sellers")}`}
                  stockLabel={`${page.results[0]?.quantity ?? 0} ${t("available")}`}
                />
                <p className="text-sm text-muted-foreground">
                  {t("referenceNote")}
                </p>
                <div className="flex flex-wrap gap-2">
                  {(
                    [
                      "wishlist",
                      "want",
                      "alert",
                      "collection",
                      "correction",
                    ] as const
                  ).map((key) => (
                    <Button key={key} disabled variant="outline" size="sm">
                      {t(key)}
                    </Button>
                  ))}
                </div>
              </div>
            </section>
            <section className="grid gap-4">
              <h2 className="text-xl font-bold">{t("offers")}</h2>
              <form
                action={page.path}
                className="flex flex-wrap items-end gap-4"
                onSubmit={(event) => {
                  event.preventDefault();
                  const params = new URLSearchParams();
                  new FormData(event.currentTarget).forEach((v, k) => {
                    if (v && v !== "__all") params.set(k, String(v));
                  });
                  window.location.assign(page.path + "?" + params);
                }}
              >
                <input type="hidden" name="lang" value={locale} />
                <input
                  type="hidden"
                  name="offerLimit"
                  value={page.offerLimit}
                />
                <input
                  type="hidden"
                  name="variantId"
                  value={page.selectedVariantId}
                />
                <input
                  type="hidden"
                  name="seller"
                  value={page.filters.seller}
                />
                <input
                  type="hidden"
                  name="min"
                  value={page.filters.min ?? ""}
                />
                <input
                  type="hidden"
                  name="max"
                  value={page.filters.max ?? ""}
                />
                <label className="grid gap-2">
                  <span>{t("offerSort")}</span>
                  <Select name="offerSort" defaultValue={page.offerSort}>
                    <SelectTrigger aria-label={t("offerSort")}>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {[
                        ["price_asc", "priceAscending"],
                        ["price_desc", "priceDescending"],
                        ["quantity", "quantityDescending"],
                      ].map(([value, label]) => (
                        <SelectItem key={value} value={value}>
                          {t(label as CatalogMessage)}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </label>
                {product.type === "raw_single" &&
                  filter(
                    "condition",
                    "condition",
                    page.filters.condition,
                    ["NM", "LP", "MP", "HP", "DMG"].map((v) => ({
                      value: v,
                      label: v,
                    })),
                  )}
                {product.type === "graded_card" && (
                  <label className="grid gap-2">
                    {t("grade")}
                    <Input
                      name="grade"
                      defaultValue={page.selectedGrade ?? ""}
                      maxLength={20}
                    />
                  </label>
                )}
                <Button type="submit">{t("apply")}</Button>
              </form>
              <p className="text-sm text-muted-foreground">
                {t("referenceBasis")}:{" "}
                {product.type === "raw_single"
                  ? page.filters.condition || "NM"
                  : product.type === "graded_card"
                    ? page.selectedGrade || t("chooseGrade")
                    : t("sealed")}
              </p>
              {page.offers.length === 0 && <p>{t("empty")}</p>}
              {page.offers.map((offer) => {
                const seller = page.sellers.find(
                  (s) => s.id === offer.sellerId,
                )!;
                return (
                  <div className="grid gap-2" key={offer.id}>
                    <SellerOfferRow
                      sellerName={seller.name}
                      verification={
                        seller.verifiedShop ? (
                          <SellerBadge
                            kind="verified-hobby-shop"
                            label={t("verifiedShop")}
                          />
                        ) : undefined
                      }
                      ratingValue={null}
                      ratingLabel={t("rating")}
                      locale={locale}
                      condition={
                        offer.condition ? (
                          <ConditionBadge
                            condition={offer.condition}
                            label={offer.condition}
                          />
                        ) : undefined
                      }
                      price={money(offer.cents, "price")}
                      shipping={`${t("minimum")}: ${seller.minimumCents ? format(seller.minimumCents) : t("none")} · ${t("handling")}: ${seller.handlingDays}`}
                      promotion={`${offer.quantity} ${t("available")}${offer.grade ? ` · ${t("grade")}: ${offer.grade}` : ""}`}
                      quantityLabel={t("quantity")}
                      quantityDecrementLabel={t("less")}
                      quantityIncrementLabel={t("more")}
                      maxQuantity={offer.quantity}
                      addToCartLabel={t("buySoon")}
                      disabled
                      data-disabled={false}
                    />
                    <a
                      className="underline"
                      href={href(`/store/${seller.slug}`)}
                    >
                      {t("store")} · {seller.name}
                    </a>
                    {(offer.grade ||
                      offer.gradingCompany ||
                      offer.certificateNumber) && (
                      <p className="text-sm text-muted-foreground">
                        {offer.gradingCompany} {offer.grade}{" "}
                        {offer.certificateNumber
                          ? t("certificate") + ": " + offer.certificateNumber
                          : ""}{" "}
                        · {t("photo")}:{" "}
                        {offer.photos.length ? offer.photos.length : t("image")}
                      </p>
                    )}
                    {(offer.photoUrls ?? []).length > 0 && (
                      <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
                        {offer.photoUrls!.map((url, index) => (
                          <a
                            key={url}
                            href={url}
                            target="_blank"
                            rel="noreferrer"
                          >
                            <CardImage
                              src={url}
                              alt={
                                product.name[locale] +
                                " · " +
                                seller.name +
                                " · " +
                                t("photo") +
                                " " +
                                (index + 1)
                              }
                              missingLabel={t("image")}
                            />
                          </a>
                        ))}
                      </div>
                    )}
                  </div>
                );
              })}
              <nav className="flex flex-wrap gap-4" aria-label={t("offers")}>
                {page.offerPage > 1 && (
                  <Button asChild variant="secondary">
                    <a href={offerHref(page.offerPage - 1)}>
                      {t("previousOffers")}
                    </a>
                  </Button>
                )}
                {page.nextOfferPage && (
                  <Button asChild variant="secondary">
                    <a href={offerHref(page.nextOfferPage)}>
                      {t("nextOffers")}
                    </a>
                  </Button>
                )}
              </nav>
              <p className="text-sm text-muted-foreground">{t("shipping")}</p>
            </section>
            <section className="grid gap-4">
              <h2 className="text-xl font-bold">{t("history")}</h2>
              <ChartContainer
                label={t("history")}
                state={page.prices.length ? "ready" : "empty"}
                emptySlot={<p>{t("empty")}</p>}
                dataTable={
                  <table>
                    <caption>{t("history")}</caption>
                    <thead>
                      <tr>
                        <th>{t("date")}</th>
                        <th>{t("reference")}</th>
                      </tr>
                    </thead>
                    <tbody>
                      {page.prices.map((p, i) => (
                        <tr key={i}>
                          <td>{p.capturedAt.slice(0, 10)}</td>
                          <td>{format(p.cents)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                }
              >
                <LineChart data={page.prices}>
                  <XAxis
                    dataKey="capturedAt"
                    tickFormatter={(v) => String(v).slice(5, 10)}
                  />
                  <YAxis tickFormatter={(v) => format(Number(v))} />
                  <Tooltip content={<ChartTooltip formatValue={format} />} />
                  <Line
                    dataKey="cents"
                    name={t("reference")}
                    stroke="var(--color-primary)"
                    strokeWidth={2}
                    isAnimationActive={false}
                  />
                </LineChart>
              </ChartContainer>
              {page.prices.at(-1) && (
                <p className="text-sm text-muted-foreground">
                  {t("source")}: {page.prices.at(-1)!.provider} ·{" "}
                  {formatSourcePrice(
                    page.prices.at(-1)!.sourceMinorUnits,
                    page.prices.at(-1)!.sourceCurrency,
                    locale,
                  )}{" "}
                  · {t("fx")}: {page.prices.at(-1)!.fxRate} /{" "}
                  {page.prices.at(-1)!.fxDate}
                </p>
              )}
            </section>
          </>
        ) : (
          <>
            {page.seller && (
              <>
                <SellerStorefrontHeader
                  name={page.seller.name}
                  avatar={
                    <SellerAvatar
                      name={page.seller.name}
                      src={page.seller.logoUrl}
                      size="lg"
                    />
                  }
                  banner={<SellerBanner src={page.seller.bannerUrl} />}
                  tagline={`${page.seller.city}, ${page.seller.province}`}
                  badges={
                    page.seller.verifiedShop ? (
                      <SellerBadge
                        kind="verified-hobby-shop"
                        label={t("verifiedShop")}
                      />
                    ) : undefined
                  }
                  stats={
                    <p>
                      {page.seller.level in catalogMessages
                        ? t(page.seller.level as CatalogMessage)
                        : page.seller.level}{" "}
                      · {t("minimum")}: {format(page.seller.minimumCents)}
                    </p>
                  }
                  actions={
                    <Button disabled variant="secondary">
                      {t("follow")}
                    </Button>
                  }
                />
                <nav className="flex flex-wrap gap-2" aria-label={t("store")}>
                  {["shop", "deals", "about", "reviews"].map((v) => (
                    <Button
                      key={v}
                      variant={tab === v ? "primary" : "secondary"}
                      onClick={() => {
                        if (v === "shop" || v === "deals")
                          go(
                            page.path,
                            v === "deals" ? { max: "99", sort: "price" } : {},
                          );
                        else setTab(v);
                      }}
                      aria-pressed={tab === v}
                    >
                      {t(v as CatalogMessage)}
                    </Button>
                  ))}
                </nav>
                <p>{t("matches")}</p>
              </>
            )}
            {page.seller && tab === "about" ? (
              <p>{page.seller.story[locale]}</p>
            ) : page.seller && tab === "reviews" ? (
              <p>{t("noReviews")}</p>
            ) : (
              <>
                {filterForm}
                {page.kind === "set" && (
                  <div className="grid gap-2">
                    <h2 className="text-xl font-bold">{t("binder")}</h2>
                    <p>{t("owned")}</p>
                    <Button disabled>{t("missing")}</Button>
                  </div>
                )}
                {page.results.length ? (
                  cards(
                    tab === "deals"
                      ? page.results.filter(
                          (r) => r.lowestCents !== null && r.lowestCents < 100,
                        )
                      : page.results,
                  )
                ) : (
                  <p role="status">{t("empty")}</p>
                )}
                <div className="flex flex-wrap gap-3">
                  {page.filters.cursor && (
                    <Button asChild variant="secondary">
                      <a href={href(page.path)}>{t("first")}</a>
                    </Button>
                  )}
                  {page.nextCursor && (
                    <Button asChild>
                      <a
                        href={href(
                          page.path,
                          Object.fromEntries(
                            Object.entries({
                              ...page.filters,
                              cursor: page.nextCursor,
                            })
                              .filter(([, v]) => v !== null && v !== "")
                              .map(([k, v]) => [k, String(v)]),
                          ),
                        )}
                      >
                        {t("next")}
                      </a>
                    </Button>
                  )}
                </div>
              </>
            )}
          </>
        )}
        <p
          id="browse-only"
          className="border-t border-border pt-6 text-sm text-muted-foreground"
        >
          {t("browseOnly")}
        </p>
      </main>
      <footer className="flex flex-wrap justify-between gap-4 border-t border-border p-6">
        <div className="grid gap-3">
          <TrocLogo height={26} />
          <p className="font-semibold">{t("canada")}</p>
          <p className="text-sm text-muted-foreground">{t("canadaCopy")}</p>
          <span className="text-sm">CAD · Canada · EN / FR</span>
        </div>
        <nav
          className="flex flex-wrap content-start gap-4"
          aria-label={t("navigation")}
        >
          <a href={href("/search")} className="underline">
            {t("shop")}
          </a>
          <a href={href("/sign-in")} className="underline">
            {t("account")}
          </a>
        </nav>
        <a href={`${base}/style-guide`} className="underline">
          {t("guide")}
        </a>
      </footer>
    </div>
  );
}
