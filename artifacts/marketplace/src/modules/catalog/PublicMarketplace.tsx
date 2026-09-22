import { useState, lazy, Suspense } from "react";
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
import { MarketplaceHeader, MarketplaceFooter } from "../brand/SiteChrome";
import { HomeSections } from "../brand/HomeSections";
import {
  ProductCard,
  CardImage,
  CardTitle,
  CardMetadata,
  ProductAvailability,
} from "@workspace/troc-design-system/components/ui/product-presentation";
import { CatalogArtwork } from "./CatalogArtwork";
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
const PriceHistory = lazy(() => import("./PriceHistory"));
import { catalogMessages, type CatalogMessage } from "./messages";
import { formatSourcePrice, productSelection } from "./presentation";
import { addCart } from "../commerce/cart-storage";
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
  const [quantities, setQuantities] = useState<Record<string, number>>({});
  const [cartMessage, setCartMessage] = useState("");
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
    <div className="grid grid-cols-2 gap-3 md:grid-cols-3 md:gap-6 xl:grid-cols-4">
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
      className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4"
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
      <MarketplaceHeader
        locale={locale}
        theme={theme}
        onLocale={onLocale}
        onTheme={onTheme}
        base={base}
      />
      <main
        id="main-content"
        className="mx-auto grid max-w-screen-xl gap-8 px-4 pb-12 pt-6 md:px-8"
      >
        {cartMessage && (
          <p role="status">
            {cartMessage}{" "}
            <a className="underline" href={href("/cart")}>
              {t("cart")}
            </a>
          </p>
        )}
        {page.demo && (
          <p
            className="border-l-2 border-border pl-3 text-xs leading-relaxed text-muted-foreground"
            role="note"
          >
            {t("demo")}
          </p>
        )}
        {page.kind !== "home" && (
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
        )}
        {page.kind !== "home" && (
          <header className="grid gap-3">
            <h1 className="text-3xl font-bold tracking-tight md:text-4xl">
              {title}
            </h1>
            {page.kind === "search" && (
              <p className="max-w-2xl text-muted-foreground">
                {locale === "fr"
                  ? "Trouvez la bonne édition. Comparez les offres. Tous les prix en dollars canadiens."
                  : "Find the right edition. Compare the offers. Every price in CAD."}
              </p>
            )}
            {(page.kind === "game" || page.kind === "set") && (
              <p className="max-w-2xl text-muted-foreground">
                {locale === "fr"
                  ? "Explorez les cartes, repérez vos prochaines trouvailles et comparez les offres des vendeurs."
                  : "Explore the cards, find your next additions and compare seller offers."}
              </p>
            )}
          </header>
        )}
        {page.kind === "home" ? (
          <HomeSections page={page} cards={cards} href={href} />
        ) : product ? (
          <>
            <section className="grid items-start gap-8 md:grid-cols-3 md:gap-12">
              <div className="rounded-lg bg-card p-6 md:p-8">
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
                  {money(page.results[0]?.lowestCents ?? null, "lowest")}
                  {money(page.results[0]?.referenceCents ?? null, "reference")}
                  {money(page.results[0]?.medianCents ?? null, "median")}
                </div>
                <ProductAvailability
                  sellersLabel={`${page.results[0]?.sellerCount ?? 0} ${t("sellers")}`}
                  stockLabel={`${page.results[0]?.quantity ?? 0} ${t("available")}`}
                />
                <p className="text-sm text-muted-foreground">
                  {t("referenceNote")}
                </p>
                <details className="text-sm text-muted-foreground">
                  <summary className="cursor-pointer">
                    {locale === "fr"
                      ? "Outils de collection · à venir"
                      : "Collector tools · planned"}
                  </summary>{" "}
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
                  <a className="underline" href={href("/condition-guide")}>
                    {locale === "fr"
                      ? "Comprendre l’état des cartes"
                      : "Understand card conditions"}
                  </a>
                </details>
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
                      price={money(offer.cents, "offerPrice")}
                      shipping={`${t("minimum")}: ${seller.minimumCents ? format(seller.minimumCents) : t("none")} · ${t("handling")}: ${seller.handlingDays}`}
                      promotion={`${offer.quantity} ${t("available")}${offer.grade ? ` · ${t("grade")}: ${offer.grade}` : ""}`}
                      quantityLabel={t("quantity")}
                      quantityDecrementLabel={t("less")}
                      quantityIncrementLabel={t("more")}
                      maxQuantity={offer.quantity}
                      quantity={quantities[offer.id] ?? 1}
                      onQuantityChange={(quantity) =>
                        setQuantities({ ...quantities, [offer.id]: quantity })
                      }
                      addToCartLabel={
                        locale === "en" ? "Add to cart" : "Ajouter au panier"
                      }
                      onAddToCart={() => {
                        try {
                          addCart(offer.id, quantities[offer.id] ?? 1);
                          setCartMessage(
                            locale === "en"
                              ? "Added to your cart."
                              : "Ajouté à votre panier.",
                          );
                        } catch {
                          setCartMessage(
                            locale === "en"
                              ? "Could not save your cart on this device."
                              : "Impossible d’enregistrer le panier sur cet appareil.",
                          );
                        }
                      }}
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
              <Suspense fallback={<p>{t("loading")}</p>}>
                <PriceHistory prices={page.prices} locale={locale} />
              </Suspense>
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
                      · {t("minimum")}:{" "}
                      {page.seller.minimumCents
                        ? format(page.seller.minimumCents)
                        : t("none")}
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
                <div className="flex flex-wrap gap-6 border-y border-border py-4 text-sm">
                  <p>
                    {t("handling")}: {page.seller.handlingDays}
                  </p>
                  <p>
                    {t("minimum")}:{" "}
                    {page.seller.minimumCents
                      ? format(page.seller.minimumCents)
                      : t("none")}
                  </p>
                  <p>
                    {locale === "fr"
                      ? "Livraison regroupée par vendeur"
                      : "Combined shipping per seller"}
                  </p>
                </div>
              </>
            )}
            {page.seller && tab === "about" ? (
              <section className="grid max-w-2xl gap-4 rounded-lg bg-card p-6">
                <h2 className="text-xl font-semibold">{t("about")}</h2>
                <p className="leading-relaxed text-muted-foreground">
                  {page.seller.story[locale]}
                </p>
                <p className="text-sm">
                  {page.seller.city}, {page.seller.province} · Canada
                </p>
              </section>
            ) : page.seller && tab === "reviews" ? (
              <div className="rounded-lg bg-card p-8 text-muted-foreground">
                {t("noReviews")}
              </div>
            ) : (
              <>
                <details
                  className="rounded-lg border border-border bg-card p-4"
                  open={page.kind === "search" || Boolean(page.filters.q)}
                >
                  <summary className="cursor-pointer font-semibold">
                    {locale === "fr"
                      ? "Affiner les résultats"
                      : "Refine your results"}
                  </summary>
                  <div className="pt-4">{filterForm}</div>
                </details>
                <p className="text-sm text-muted-foreground">
                  {page.results.length}{" "}
                  {locale === "fr"
                    ? "produits sur cette page · prix en CAD"
                    : "products on this page · prices in CAD"}
                </p>
                {page.kind === "game" && (
                  <section className="grid gap-4">
                    <h2 className="text-xl font-semibold">{t("sets")}</h2>
                    <div className="flex flex-wrap gap-2">
                      {page.sets
                        .filter((s) => s.gameId === currentGame?.id)
                        .slice(0, 8)
                        .map((s) => (
                          <Button key={s.id} asChild variant="secondary">
                            <a href={href("/sets/" + s.slug)}>
                              {s.name[locale]}
                            </a>
                          </Button>
                        ))}
                    </div>
                  </section>
                )}
                {page.kind === "set" && (
                  <div className="grid gap-2 border-l-2 border-border pl-4">
                    <h2 className="text-lg font-semibold">{t("binder")}</h2>
                    <p>{t("owned")}</p>
                    <a className="text-sm underline" href={href("/collection")}>
                      {locale === "fr"
                        ? "Découvrir les outils de collection prévus"
                        : "Explore planned collection tools"}
                    </a>
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
                  <div
                    role="status"
                    className="grid justify-items-start gap-4 rounded-lg bg-card p-8"
                  >
                    <h2 className="text-xl font-semibold">{t("empty")}</h2>
                    <p className="text-muted-foreground">
                      {locale === "fr"
                        ? "Essayez un autre nom de carte ou retirez quelques filtres."
                        : "Try another card name or remove a few filters."}
                    </p>
                    <Button asChild variant="secondary">
                      <a href={href(page.path)}>{t("reset")}</a>
                    </Button>
                  </div>
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
      <MarketplaceFooter locale={locale} base={base} />
    </div>
  );
}
