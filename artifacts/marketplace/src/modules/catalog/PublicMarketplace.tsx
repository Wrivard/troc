import {
  Breadcrumb,
  BreadcrumbList,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@workspace/troc-design-system/components/ui/breadcrumbs";
import {
  MarketplaceProductCard,
  ProductPurchaseSummary,
  GameHero,
  StoreHero,
  ProductFacts,
  PremiumEmptyState,
} from "@workspace/troc-design-system/components/ui/marketplace-compositions";
import { ProductArtworkPanel } from "@workspace/troc-design-system/components/ui/interactive-card-stack";
import {
  EditorialIntro,
  EditorialCatalogGrid,
} from "@workspace/troc-design-system/components/ui/editorial";
import { useState, useEffect, lazy, Suspense } from "react";
import type { PublicPage, Locale, ProductResult } from "@workspace/catalog";
import {
  Chip,
  ChipGroup,
} from "@workspace/troc-design-system/components/ui/chips";
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
import { CardImage } from "@workspace/troc-design-system/components/ui/product-presentation";
import { CatalogArtwork } from "./CatalogArtwork";
import {
  PriceBlock,
  ReferencePrice,
  LowestAvailable,
} from "@workspace/troc-design-system/components/ui/price";
import { SellerOfferRow } from "@workspace/troc-design-system/components/ui/seller-offer";
import { SellerAvatar } from "@workspace/troc-design-system/components/ui/seller-storefront";
import { SellerBadge } from "@workspace/troc-design-system/components/ui/seller-badges";
import { ConditionBadge } from "@workspace/troc-design-system/components/ui/marketplace-badges";
const PriceHistory = lazy(() => import("./PriceHistory"));
import { catalogMessages, type CatalogMessage } from "./messages";
import { formatSourcePrice, productSelection } from "./presentation";
import { demoStoreBranding } from "../brand/demo-store-branding";
import { addCart } from "../commerce/cart-storage";
export interface PublicProps {
  page: PublicPage;
  theme?: "dark" | "light";
  base?: string;
  onLocale?: (locale: Locale) => void;
  onTheme?: (theme: "dark" | "light") => void;
}
export function PublicMarketplace({
  page: sourcePage,
  theme = "dark",
  base = "",
  onLocale,
  onTheme,
}: PublicProps) {
  const page = {
    ...sourcePage,
    sellers: sourcePage.sellers.map(demoStoreBranding),
    seller: sourcePage.seller
      ? demoStoreBranding(sourcePage.seller)
      : sourcePage.seller,
  };
  const locale = page.locale;
  const t = (key: CatalogMessage) =>
    catalogMessages[key][locale === "en" ? 0 : 1];
  const [quantities, setQuantities] = useState<Record<string, number>>({});
  const [filtersOpen, setFiltersOpen] = useState(true);
  useEffect(() => {
    setFiltersOpen(
      window.matchMedia("(min-width: 768px)").matches &&
        page.results.length > 0,
    );
  }, [page.results.length]);
  const [cartMessage, setCartMessage] = useState<{
    offerId: string;
    text: string;
    success: boolean;
  } | null>(null);
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
  const productGame = page.games.find((g) => g.id === product?.gameId);
  const productSet = page.sets.find((s) => s.id === product?.setId);
  const hasAvailableOffers = page.offers.some((offer) => offer.quantity > 0);
  const availableFrom = hasAvailableOffers
    ? (page.results[0]?.lowestCents ?? null)
    : null;
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
    <EditorialCatalogGrid>
      {items.map((result) => {
        const p = result.product;
        const set = page.sets.find((s) => s.id === p.setId);
        const selection = productSelection(p, page.filters);
        const productHref = href(`/product/${p.slug}`, selection.params);
        return (
          <MarketplaceProductCard
            key={p.id}
            href={productHref}
            name={p.name[locale]}
            image={
              <CatalogArtwork
                product={p}
                variant={selection.variant}
                locale={locale}
              />
            }
            metadata={[
              page.games.find((g) => g.id === p.gameId)?.name[locale],
              set?.name[locale],
              selection.variant?.number,
              selection.variant?.key &&
                (selection.variant.key in catalogMessages
                  ? t(selection.variant.key as CatalogMessage)
                  : selection.variant.key),
            ]
              .filter(Boolean)
              .join(" · ")}
            fromLabel={locale === "fr" ? "Dès" : "From"}
            price={
              result.lowestCents === null ? "—" : format(result.lowestCents)
            }
            availability={`${result.sellerCount} ${(locale === "fr" ? result.sellerCount <= 1 : result.sellerCount === 1) ? (locale === "fr" ? "vendeur" : "seller") : t("sellers")} · ${result.quantity} ${t("available")}`}
            reference={`${locale === "fr" ? "Référence" : "Reference"} ${result.referenceCents === null ? "—" : format(result.referenceCents)}`}
          />
        );
      })}
    </EditorialCatalogGrid>
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
  const activeFilters = Object.entries(page.filters).filter(
    ([key, value]) =>
      [
        "q",
        "game",
        "set",
        "type",
        "condition",
        "language",
        "variant",
        "rarity",
        "min",
        "max",
        "seller",
      ].includes(key) &&
      value !== null &&
      value !== "" &&
      !(key === "game" && (page.kind === "game" || page.kind === "set")) &&
      !(key === "set" && page.kind === "set"),
  );
  const appliedLabel = (key: string, value: unknown) => {
    if (key === "min" || key === "max")
      return `${key === "min" ? (locale === "fr" ? "Min." : "Min") : locale === "fr" ? "Max." : "Max"} ${format(Number(value))}`;
    if (key === "q") return `“${value}”`;
    if (key === "game")
      return (
        page.games.find((game) => game.slug === value)?.name[locale] ??
        String(value)
      );
    if (key === "set")
      return (
        page.sets.find((set) => set.slug === value)?.name[locale] ??
        String(value)
      );
    if (key === "seller")
      return (
        page.sellers.find(
          (seller) => seller.id === value || seller.slug === value,
        )?.name ?? String(value)
      );
    if (key === "language") return t(value === "en" ? "english" : "japanese");
    return String(value) in catalogMessages
      ? t(String(value) as CatalogMessage)
      : String(value);
  };
  const editFilters = () => {
    setFiltersOpen(true);
    requestAnimationFrame(() =>
      document
        .querySelector<HTMLInputElement>('.troc-quality-filter input[name="q"]')
        ?.focus(),
    );
  };
  const refinementFields = (
    <>
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
      {filter(
        "condition",
        "condition",
        page.filters.condition,
        ["NM", "LP", "MP", "HP", "DMG"].map((v) => ({
          value: v,
          label: v,
        })),
      )}
      <label className="grid gap-2">
        {t("max")}
        <Input
          type="number"
          min={0}
          step={1}
          name="max"
          defaultValue={page.filters.max ?? ""}
          aria-describedby="catalog-price-help"
        />
        <small
          id="catalog-price-help"
          className="text-xs text-muted-foreground"
        >
          {locale === "fr" ? "100 ¢ = 1 $ CAD" : "100¢ = $1 CAD"}
        </small>
      </label>
      <details
        className="sm:col-span-2 lg:col-span-4 border-t border-border pt-4"
        open={Boolean(
          page.filters.language ||
          page.filters.variant ||
          page.filters.rarity ||
          page.filters.min !== null,
        )}
      >
        <summary className="cursor-pointer text-sm font-semibold">
          {locale === "fr"
            ? "Langue, finition et autres critères"
            : "Language, finish and more filters"}
        </summary>
        <div className="grid gap-4 pt-4 sm:grid-cols-2 lg:grid-cols-4">
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
          <label className="grid gap-2">
            {t("min")}
            <Input
              type="number"
              min={0}
              step={1}
              name="min"
              defaultValue={page.filters.min ?? ""}
              aria-describedby="catalog-price-help"
            />
          </label>
        </div>
      </details>
    </>
  );
  const resultControls = (
    <>
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
    </>
  );
  const filterForm = (
    <form
      action={`${base}${page.path}`}
      className={`troc-quality-filter grid gap-4 sm:grid-cols-2 lg:grid-cols-4 ${page.kind === "search" ? "troc-search-filter-form" : ""}`}
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
      {page.kind === "search" ? (
        <>
          {resultControls}
          <details className="troc-search-more-filters">
            <summary>
              {locale === "fr"
                ? "Jeu, extension, état et autres filtres"
                : "Game, set, condition and more filters"}
            </summary>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4 pt-4">
              {refinementFields}
            </div>
          </details>
        </>
      ) : (
        <>
          {refinementFields}
          {resultControls}
        </>
      )}
    </form>
  );
  return (
    <div
      className={`min-h-screen bg-background text-foreground ${page.kind === "home" ? "troc-home-shell" : ""}`}
    >
      <MarketplaceHeader
        locale={locale}
        theme={theme}
        onLocale={onLocale}
        onTheme={onTheme}
        base={base}
      />
      <main
        id="main-content"
        className={`troc-marketplace-width mx-auto grid gap-8 px-4 pb-12 pt-6 md:px-8 ${page.kind === "home" ? "troc-home-page" : page.kind === "search" ? "troc-search-page" : page.seller ? "troc-store-page" : ""}`}
      >
        {page.demo && page.kind !== "home" && (
          <p
            className="border-l-2 border-border pl-3 text-xs leading-relaxed text-muted-foreground"
            role="note"
          >
            {t("demo")}
          </p>
        )}
        {product && (
          <Breadcrumb label={locale === "fr" ? "Fil d’Ariane" : "Breadcrumb"}>
            <BreadcrumbList>
              <BreadcrumbItem>
                <BreadcrumbLink href={href("/")}>{t("home")}</BreadcrumbLink>
              </BreadcrumbItem>
              {productGame && (
                <>
                  <BreadcrumbSeparator />
                  <BreadcrumbItem>
                    <BreadcrumbLink href={href(`/games/${productGame.slug}`)}>
                      {productGame.name[locale]}
                    </BreadcrumbLink>
                  </BreadcrumbItem>
                </>
              )}
              {productSet && (
                <>
                  <BreadcrumbSeparator />
                  <BreadcrumbItem>
                    <BreadcrumbLink href={href(`/sets/${productSet.slug}`)}>
                      {productSet.name[locale]}
                    </BreadcrumbLink>
                  </BreadcrumbItem>
                </>
              )}
              <BreadcrumbSeparator />
              <BreadcrumbItem>
                <BreadcrumbPage>{product.name[locale]}</BreadcrumbPage>
              </BreadcrumbItem>
            </BreadcrumbList>
          </Breadcrumb>
        )}
        {page.kind !== "home" && !product && (
          <nav
            aria-label={t("game")}
            className="troc-catalog-navigation flex flex-wrap gap-2"
          >
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
        {page.kind !== "home" &&
          page.kind !== "game" &&
          page.kind !== "set" &&
          page.kind !== "store" &&
          !product &&
          page.kind !== "search" && (
            <EditorialIntro
              level={1}
              className="troc-page-opening"
              eyebrow="TROC · CAD · CANADA"
              title={title}
              description={
                locale === "fr"
                  ? "La bonne carte. La bonne édition. Comparez les offres des vendeurs canadiens."
                  : "The right card. The right edition. Compare offers from Canadian sellers."
              }
            />
          )}
        {page.kind === "search" && (
          <header className="troc-search-heading">
            <h1>
              {locale === "fr" ? "Trouvez vos cartes" : "Find your cards"}
            </h1>
            <p>
              {page.filters.q
                ? `${locale === "fr" ? "Résultats pour" : "Results for"} “${page.filters.q}”`
                : locale === "fr"
                  ? "Comparez les offres en CAD."
                  : "Compare offers in CAD."}
            </p>
          </header>
        )}
        {(page.kind === "game" || page.kind === "set") && (
          <GameHero
            title={title}
            eyebrow={
              locale === "fr" ? "VOTRE PROCHAINE TROUVAILLE" : "YOUR NEXT FIND"
            }
            description={
              locale === "fr"
                ? "Complétez une extension, préparez votre prochain deck. Comparez les offres en CAD."
                : "Complete a set. Build your next deck. Compare offers in CAD."
            }
            cards={page.results
              .filter((r) => r.product.images?.length)
              .slice(0, 3)
              .map((r) => (
                <CatalogArtwork
                  key={r.product.id}
                  product={r.product}
                  variant={r.product.variants[0]}
                  locale={locale}
                />
              ))}
            shortcuts={
              page.kind === "game"
                ? page.sets
                    .filter((set) => set.gameId === currentGame?.id)
                    .slice(0, 8)
                    .map((set) => (
                      <a key={set.id} href={href("/sets/" + set.slug)}>
                        {set.name[locale]}
                      </a>
                    ))
                : undefined
            }
            action={
              <a className="troc-editorial-text-link" href="#catalog-results">
                {locale === "fr" ? "Parcourir les cartes ↓" : "Browse cards ↓"}
              </a>
            }
          />
        )}
        {page.kind === "home" ? (
          <HomeSections page={page} cards={cards} href={href} />
        ) : product ? (
          <>
            <div className="troc-product-decision">
              <aside className="troc-product-sticky">
                <ProductArtworkPanel>
                  <CatalogArtwork
                    key={selected?.id ?? product.id}
                    product={product}
                    variant={selected}
                    locale={locale}
                    gallery
                  />
                </ProductArtworkPanel>
              </aside>
              <div className="troc-product-decision-details">
                <EditorialIntro level={1} eyebrow="TROC · CAD" title={title} />

                <ProductPurchaseSummary
                  selection={
                    <div
                      className="troc-purchase-summary-options"
                      role="group"
                      aria-label={
                        locale === "fr"
                          ? "Langue et finition"
                          : "Language and finish"
                      }
                    >
                      {product.variants.map((v) => (
                        <Button asChild variant="secondary" key={v.id}>
                          <a
                            aria-current={
                              v.id === selected?.id ? "true" : undefined
                            }
                            href={href(page.path, { variantId: v.id })}
                          >
                            {t(v.language === "en" ? "english" : "japanese")} ·{" "}
                            {v.key in catalogMessages
                              ? t(v.key as CatalogMessage)
                              : v.key}
                          </a>
                        </Button>
                      ))}
                    </div>
                  }
                  printing={
                    <>
                      {selected && (
                        <>
                          {t(
                            selected.language === "en" ? "english" : "japanese",
                          )}{" "}
                          ·{" "}
                          {selected.key in catalogMessages
                            ? t(selected.key as CatalogMessage)
                            : selected.key}{" "}
                          ·{" "}
                        </>
                      )}
                      {
                        page.sets.find((set) => set.id === product.setId)?.name[
                          locale
                        ]
                      }{" "}
                      {selected?.number && ` · #${selected.number}`}
                    </>
                  }
                  price={
                    <LowestAvailable
                      amount={
                        availableFrom === null ? null : availableFrom / 100
                      }
                      locale={locale}
                      label={
                        locale === "fr"
                          ? "À partir de · CAD / carte"
                          : "From · CAD / card"
                      }
                    />
                  }
                  availability={
                    hasAvailableOffers
                      ? `${page.results[0]?.sellerCount ?? 0} ${(locale === "fr" ? (page.results[0]?.sellerCount ?? 0) <= 1 : page.results[0]?.sellerCount === 1) ? (locale === "fr" ? "vendeur" : "seller") : t("sellers")}`
                      : locale === "fr"
                        ? "Aucune offre disponible"
                        : "No available offers"
                  }
                  action={
                    <Button asChild>
                      <a
                        href="#seller-offers"
                        onClick={(event) => {
                          event.preventDefault();
                          const offers =
                            document.getElementById("seller-offers");
                          offers?.focus({ preventScroll: true });
                          offers?.scrollIntoView({ block: "start" });
                        }}
                      >
                        {hasAvailableOffers
                          ? locale === "fr"
                            ? "Choisir une offre"
                            : "View offers"
                          : locale === "fr"
                            ? "Vérifier les filtres"
                            : "Review filters"}
                      </a>
                    </Button>
                  }
                  note={
                    locale === "fr"
                      ? "Hors livraison. Livraison regroupée simulée au panier."
                      : "Shipping excluded. Combined shipping is simulated in your cart."
                  }
                />
                <section className="troc-product-summary grid content-start gap-6">
                  <ProductFacts
                    level={2}
                    title={
                      locale === "fr" ? "Identité de la carte" : "Card identity"
                    }
                    items={[
                      { label: t("game"), value: productGame?.name[locale] },
                      { label: t("set"), value: productSet?.name[locale] },
                      {
                        label: locale === "fr" ? "Numéro" : "Number",
                        value: selected?.number
                          ? `#${selected.number}`
                          : undefined,
                      },
                      {
                        label:
                          locale === "fr" ? "Type de produit" : "Product type",
                        value: t(product.type),
                      },
                    ]}
                  />
                  <ProductFacts
                    level={2}
                    title={
                      locale === "fr"
                        ? "Détails de l’impression"
                        : "Printing details"
                    }
                    items={[
                      {
                        label: t("rarity"),
                        value:
                          selected?.rarity &&
                          (selected.rarity in catalogMessages
                            ? t(selected.rarity as CatalogMessage)
                            : selected.rarity),
                      },
                      { label: t("artist"), value: selected?.artist },
                      ...Object.entries(selected?.attributes ?? {}).map(
                        ([key, value]) => ({
                          label:
                            key === "finish"
                              ? locale === "fr"
                                ? "Finition"
                                : "Finish"
                              : key,
                          value:
                            value in catalogMessages
                              ? t(value as CatalogMessage)
                              : value,
                        }),
                      ),
                    ]}
                  />
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
                </section>
                <section
                  id="seller-offers"
                  tabIndex={-1}
                  aria-label={t("offers")}
                  className="troc-offer-list grid gap-4"
                >
                  <EditorialIntro
                    compact
                    title={t("offers")}
                    eyebrow={
                      locale === "fr"
                        ? "CHOISISSEZ VOTRE VENDEUR"
                        : "CHOOSE YOUR SELLER"
                    }
                  />
                  <details className="troc-offer-controls">
                    <summary>
                      <span>
                        {locale === "fr"
                          ? "Trier et filtrer"
                          : "Sort and filter"}
                      </span>
                      <span className="text-sm text-muted-foreground">
                        {t(
                          page.offerSort === "quantity"
                            ? "quantityDescending"
                            : page.offerSort === "price_desc"
                              ? "priceDescending"
                              : "priceAscending",
                        )}
                        {" · "}
                        {product.type === "raw_single"
                          ? page.filters.condition ||
                            (locale === "fr"
                              ? "Tous les états"
                              : "All conditions")
                          : product.type === "graded_card"
                            ? page.selectedGrade || t("chooseGrade")
                            : t("sealed")}
                      </span>
                    </summary>
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
                      <Button type="submit" variant="secondary">
                        {t("apply")}
                      </Button>
                    </form>
                  </details>

                  {page.offers.length === 0 && (
                    <div className="grid gap-3">
                      <p>
                        {locale === "fr"
                          ? "Aucune offre ne correspond à cette édition et à vos filtres."
                          : "No offers match this printing and your filters."}
                      </p>
                      <a
                        className="underline"
                        href={href(page.path, {
                          variantId: page.selectedVariantId ?? "",
                        })}
                      >
                        {locale === "fr"
                          ? "Retirer les filtres d’offres"
                          : "Clear offer filters"}
                      </a>
                    </div>
                  )}
                  {page.offers.map((offer) => {
                    const seller = page.sellers.find(
                      (s) => s.id === offer.sellerId,
                    )!;
                    return (
                      <div className="grid gap-2" key={offer.id}>
                        <SellerOfferRow
                          sellerName={seller.name}
                          sellerHref={href(`/store/${seller.slug}`)}
                          location={`${seller.city}, ${seller.province}`}
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
                                label={
                                  (
                                    {
                                      NM: ["Near mint", "Presque neuf"],
                                      LP: ["Lightly played", "Légèrement joué"],
                                      MP: [
                                        "Moderately played",
                                        "Modérément joué",
                                      ],
                                      HP: ["Heavily played", "Très joué"],
                                      DMG: ["Damaged", "Endommagé"],
                                    } as const
                                  )[offer.condition][locale === "fr" ? 1 : 0]
                                }
                              />
                            ) : undefined
                          }
                          price={money(offer.cents, "offerPrice")}
                          shipping={`${t("minimum")}: ${seller.minimumCents ? format(seller.minimumCents) : t("none")} · ${t("handling")}: ${seller.handlingDays}`}
                          promotion={`${offer.quantity} ${t("available")}${offer.grade ? ` · ${t("grade")}: ${offer.grade}` : ""}`}
                          quantityLabel={`${t("quantity")} · ${seller.name}`}
                          quantityDecrementLabel={`${t("less")} · ${seller.name}`}
                          quantityIncrementLabel={`${t("more")} · ${seller.name}`}
                          unavailable={offer.quantity <= 0}
                          unavailableLabel={
                            locale === "fr" ? "Épuisé" : "Out of stock"
                          }
                          addToCartAccessibleLabel={`${locale === "fr" ? "Ajouter au panier" : "Add to cart"} · ${seller.name}`}
                          maxQuantity={offer.quantity}
                          quantity={quantities[offer.id] ?? 1}
                          onQuantityChange={(quantity) =>
                            setQuantities({
                              ...quantities,
                              [offer.id]: quantity,
                            })
                          }
                          addToCartLabel={
                            locale === "en"
                              ? "Add to cart"
                              : "Ajouter au panier"
                          }
                          onAddToCart={() => {
                            try {
                              addCart(offer.id, quantities[offer.id] ?? 1);
                              setCartMessage({
                                offerId: offer.id,
                                success: true,
                                text:
                                  locale === "en"
                                    ? `Added ${quantities[offer.id] ?? 1} from ${seller.name} to your cart.`
                                    : `${quantities[offer.id] ?? 1} ajouté(s) au panier chez ${seller.name}.`,
                              });
                            } catch {
                              setCartMessage({
                                offerId: offer.id,
                                success: false,
                                text:
                                  locale === "en"
                                    ? "Could not save your cart on this device. Please try again."
                                    : "Impossible d’enregistrer le panier sur cet appareil. Réessayez.",
                              });
                            }
                          }}
                        />
                        {cartMessage?.offerId === offer.id && (
                          <p className="troc-offer-feedback" role="status">
                            {cartMessage.text}{" "}
                            {cartMessage.success && (
                              <a className="underline" href={href("/cart")}>
                                {locale === "fr"
                                  ? "Voir le panier"
                                  : "View cart"}
                              </a>
                            )}
                          </p>
                        )}

                        {(offer.grade ||
                          offer.gradingCompany ||
                          offer.certificateNumber) && (
                          <p className="text-sm text-muted-foreground">
                            {offer.gradingCompany} {offer.grade}{" "}
                            {offer.certificateNumber
                              ? t("certificate") +
                                ": " +
                                offer.certificateNumber
                              : ""}{" "}
                            · {t("photo")}:{" "}
                            {offer.photos.length
                              ? offer.photos.length
                              : t("image")}
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
                  <nav
                    className="flex flex-wrap gap-4"
                    aria-label={t("offers")}
                  >
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
                  <p className="text-sm text-muted-foreground">
                    {t("shipping")}
                  </p>
                </section>
              </div>
            </div>
            <section className="troc-price-history grid gap-4">
              <EditorialIntro
                compact
                title={t("history")}
                eyebrow={
                  locale === "fr" ? "LE PRIX EN CONTEXTE" : "PRICE IN CONTEXT"
                }
              />
              <div className="troc-product-reference-context">
                {money(page.results[0]?.referenceCents ?? null, "reference")}
                {money(page.results[0]?.medianCents ?? null, "median")}
              </div>
              <p className="text-sm text-muted-foreground">
                {t("referenceBasis")}:{" "}
                {product.type === "raw_single"
                  ? page.filters.condition || "NM"
                  : product.type === "graded_card"
                    ? page.selectedGrade || t("chooseGrade")
                    : t("sealed")}
              </p>
              <p className="text-sm text-muted-foreground">
                {t("referenceNote")}
              </p>
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
                <StoreHero
                  name={page.seller.name}
                  eyebrow={
                    locale === "fr"
                      ? "BOUTIQUE CANADIENNE · DÉMO"
                      : "CANADIAN STORE · DEMO"
                  }
                  location={`${page.seller.city}, ${page.seller.province}`}
                  avatar={
                    <SellerAvatar
                      name={page.seller.name}
                      src={page.seller.logoUrl}
                    />
                  }
                  bannerSrc={page.seller.bannerUrl}
                  bannerFit={page.seller.demo ? "contain" : "cover"}
                  banner={
                    <div className="troc-store-cover-cards">
                      {page.results
                        .filter((r) => r.product.images?.length)
                        .slice(0, 3)
                        .map((r) => (
                          <CatalogArtwork
                            key={r.product.id}
                            product={r.product}
                            variant={r.product.variants[0]}
                            locale={locale}
                          />
                        ))}
                    </div>
                  }
                  badges={
                    page.seller.verifiedShop ? (
                      <SellerBadge
                        kind="verified-hobby-shop"
                        label={t("verifiedShop")}
                      />
                    ) : undefined
                  }
                  details={
                    locale === "fr"
                      ? "Aucun avis pour le moment"
                      : "No reviews yet"
                  }
                  actions={
                    <div className="grid gap-2">
                      <Button asChild>
                        <a
                          href="#catalog-results"
                          onClick={(event) => {
                            event.preventDefault();
                            setTab("shop");
                            requestAnimationFrame(() => {
                              const results =
                                document.getElementById("catalog-results");
                              results?.focus({ preventScroll: true });
                              results?.scrollIntoView({ block: "start" });
                            });
                          }}
                        >
                          {locale === "fr" ? "Voir les cartes" : "Browse cards"}
                        </a>
                      </Button>
                      <Button disabled variant="ghost">
                        {t("follow")}
                      </Button>
                    </div>
                  }
                />
                <nav
                  className="troc-store-tabs flex flex-wrap gap-2"
                  aria-label={t("store")}
                >
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
                {activeFilters.length > 0 && (
                  <ChipGroup
                    className="troc-applied-filters"
                    label={
                      locale === "fr" ? "Filtres appliqués" : "Applied filters"
                    }
                  >
                    {activeFilters.map(([key, value]) => (
                      <Chip
                        key={key}
                        removeLabel={`${locale === "fr" ? "Retirer" : "Remove"} ${appliedLabel(key, value)}`}
                        onRemove={() =>
                          go(
                            page.path,
                            Object.fromEntries(
                              Object.entries(page.filters)
                                .filter(
                                  ([name, val]) =>
                                    name !== key &&
                                    name !== "cursor" &&
                                    val !== null &&
                                    val !== "",
                                )
                                .map(([name, val]) => [name, String(val)]),
                            ),
                          )
                        }
                      >
                        {appliedLabel(key, value)}
                      </Chip>
                    ))}
                  </ChipGroup>
                )}
                <details
                  className="troc-catalog-filters"
                  open={filtersOpen}
                  onToggle={(event) => setFiltersOpen(event.currentTarget.open)}
                >
                  <summary className="cursor-pointer font-semibold">
                    {locale === "fr"
                      ? "Affiner les résultats"
                      : "Refine your results"}
                  </summary>
                  <div className="pt-4">{filterForm}</div>
                </details>
                <p
                  id="catalog-results"
                  tabIndex={-1}
                  className="text-sm text-muted-foreground"
                >
                  {page.results.length}{" "}
                  {locale === "fr"
                    ? `${page.results.length <= 1 ? "produit" : "produits"} sur cette page · prix en CAD`
                    : `${page.results.length === 1 ? "product" : "products"} on this page · prices in CAD`}
                </p>

                {page.results.length ? (
                  cards(
                    tab === "deals"
                      ? page.results.filter(
                          (r) => r.lowestCents !== null && r.lowestCents < 100,
                        )
                      : page.results,
                  )
                ) : (
                  <PremiumEmptyState
                    className="troc-search-empty"
                    title={
                      locale === "fr"
                        ? "Aucune carte trouvée"
                        : "No cards found"
                    }
                    description={
                      locale === "fr"
                        ? "Essayez un autre nom ou retirez quelques filtres pour découvrir plus de cartes."
                        : "Try another name or remove a few filters to discover more cards."
                    }
                    actions={
                      <>
                        <Button onClick={editFilters}>
                          {locale === "fr"
                            ? "Modifier la recherche"
                            : "Edit search"}
                        </Button>
                        <Button asChild variant="secondary">
                          <a href={href(page.path)}>{t("reset")}</a>
                        </Button>
                      </>
                    }
                  />
                )}
                {page.kind === "set" && page.results.length > 0 && (
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
                <div className="flex flex-wrap gap-3">
                  {page.filters.cursor && (
                    <Button asChild variant="secondary">
                      <a
                        href={href(
                          page.path,
                          Object.fromEntries(
                            Object.entries(page.filters)
                              .filter(
                                ([key, value]) =>
                                  key !== "cursor" &&
                                  value !== null &&
                                  value !== "",
                              )
                              .map(([key, value]) => [key, String(value)]),
                          ),
                        )}
                      >
                        {t("first")}
                      </a>
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
