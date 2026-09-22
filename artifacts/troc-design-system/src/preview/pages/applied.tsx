import { useMemo, useState } from "react";
import { ShoppingCart } from "lucide-react";
import "../../../scripts/applied-examples.css";

import { SiteHeader, type SiteNavItem } from "../../components/ui/site-navigation";
import { type GlobalSearchSuggestion } from "../../components/ui/global-search";
import {
  CardImage,
  CardMetadata,
  CardTitle,
  ProductAvailability,
  ProductCard,
  ProductRow,
} from "../../components/ui/product-presentation";
import { LowestAvailable, ReferencePrice } from "../../components/ui/price";
import { ConditionBadge, GameBadge, LanguageBadge } from "../../components/ui/marketplace-badges";
import { FreeShippingProgress, SellerMinimumProgress } from "../../components/ui/marketplace-progress";
import { SellerLevelBadge, SellerRating } from "../../components/ui/seller-reputation";
import { Button } from "../../components/ui/button";
import { usePreferences } from "../../hooks/use-preferences";
import { useExamplesMessages } from "../../lib/messages-examples";
import { demoArtwork } from "../demo-assets";
import { DemoPanel, PageHeader, Section } from "../parts";

interface Offer {
  id: string;
  name: string;
  set: string;
  image: string | null;
  game: string;
  lang: string;
  condition: "NM" | "LP";
  conditionLabel: string;
  reference: number;
  lowest: number;
  sellers: number;
  stock: number;
}

export default function AppliedPage() {
  const { locale, setLocale, theme, setTheme } = usePreferences();
  const { te, sellersCount, available, cardAlt, minimumRemaining, freeShipRemaining } = useExamplesMessages();
  const priceLocale = locale === "fr" ? "fr" : "en";

  const [query, setQuery] = useState("");
  const [nav, setNav] = useState("shop");
  const [signedIn, setSignedIn] = useState(true);
  const [cartCount, setCartCount] = useState(2);
  const [cartSubtotal, setCartSubtotal] = useState(28.5);
  const [added, setAdded] = useState<string | null>(null);
  const [lastAction, setLastAction] = useState<string | null>(null);

  const offers: Offer[] = [
    { id: "charizard", name: te("cardCharizard"), set: te("setSV"), image: demoArtwork.charizard, game: te("gamePokemon"), lang: te("langBadgeEn"), condition: "NM", conditionLabel: te("condNM"), reference: 24.0, lowest: 18.5, sellers: 12, stock: 34 },
    { id: "pikachu", name: te("cardPikachu"), set: te("setSV198"), image: demoArtwork.pikachu, game: te("gamePokemon"), lang: te("langBadgeEn"), condition: "NM", conditionLabel: te("condNM"), reference: 3.2, lowest: 2.1, sellers: 20, stock: 120 },
    { id: "luffy", name: te("cardLuffy"), set: te("setOP"), image: demoArtwork.luffy, game: te("gameOnePiece"), lang: te("langBadgeEn"), condition: "LP", conditionLabel: te("condLP"), reference: 12.0, lowest: 9.75, sellers: 6, stock: 8 },
    { id: "lightning", name: te("cardLightning"), set: te("setMagic"), image: demoArtwork.lightningBolt, game: te("gameMagic"), lang: te("langBadgeFr"), condition: "LP", conditionLabel: te("condLP"), reference: 1.4, lowest: 0.85, sellers: 30, stock: 0 },
  ];

  const suggestions = useMemo<GlobalSearchSuggestion[]>(() => {
    const q = query.trim().toLowerCase();
    const source = q ? offers.filter((o) => o.name.toLowerCase().includes(q) || o.set.toLowerCase().includes(q)) : offers;
    return source.map((o) => ({ value: o.id, title: o.name, meta: o.set, group: o.game }));
    // offers is rebuilt each render from copy; deliberately keyed on query + locale.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [query, locale]);

  const results = useMemo(() => {
    const q = query.trim().toLowerCase();
    return q ? offers.filter((o) => o.name.toLowerCase().includes(q) || o.set.toLowerCase().includes(q)) : offers;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [query, locale]);

  const navItems: SiteNavItem[] = [
    { id: "shop", label: te("navShop"), current: nav === "shop", onSelect: () => { setNav("shop"); setLastAction(`${te("navShop")} ${te("clicked")}`); } },
    { id: "sell", label: te("navSell"), current: nav === "sell", onSelect: () => { setNav("sell"); setLastAction(`${te("navSell")} ${te("clicked")}`); } },
    { id: "collect", label: te("navCollect"), current: nav === "collect", onSelect: () => { setNav("collect"); setLastAction(`${te("navCollect")} ${te("clicked")}`); } },
  ];

  const localeOptions = [
    { value: "en" as const, code: "EN", label: te("langEn") },
    { value: "fr" as const, code: "FR", label: te("langFr") },
  ];
  const themeOptions = [
    { value: "dark" as const, label: te("themeDark") },
    { value: "light" as const, label: te("themeLight") },
  ];

  const addToCart = (offer: Offer) => {
    setCartCount((c) => c + 1);
    setCartSubtotal((s) => Math.round((s + offer.lowest) * 100) / 100);
    setAdded(offer.id);
    setLastAction(`${offer.name} — ${te("added")}`);
  };

  const priceSlot = (offer: Offer) => (
    <>
      <ReferencePrice amount={offer.reference} locale={priceLocale} label={te("refPrice")} size="sm" />
      <LowestAvailable amount={offer.stock > 0 ? offer.lowest : null} locale={priceLocale} label={te("lowest")} unavailableLabel={te("outOfStock")} />
    </>
  );

  const badgeSlot = (offer: Offer) => (
    <>
      <GameBadge label={offer.game} size="compact" />
      <ConditionBadge condition={offer.condition} label={offer.conditionLabel} size="compact" />
      <LanguageBadge label={offer.lang} size="compact" />
    </>
  );

  return <>
    <PageHeader eyebrow={te("appliedEyebrow")} title={te("appliedTitle")} description={te("appliedIntro")} />

    <Section title={te("appliedTitle")} description={te("boundedNote")}>
      <DemoPanel>
        <div className="ds-applied-vignette">
          <SiteHeader
            navItems={navItems}
            navLabel={te("navPrimary")}
            logoLabel={te("brandLabel")}
            search={{
              label: te("searchLabel"),
              placeholder: te("searchPlaceholder"),
              value: query,
              onValueChange: setQuery,
              suggestions,
              onSelect: (s) => setLastAction(`${te("selectedItem")}: ${s.title}`),
              onSubmit: (q) => setLastAction(q ? `${te("searchSubmit")}: ${q}` : te("searchSubmit")),
              emptyLabel: te("searchEmpty"),
              loadingLabel: te("searchLoading"),
              clearLabel: te("searchClear"),
              submitLabel: te("searchSubmit"),
            }}
            locale={{ value: locale, onValueChange: setLocale, options: localeOptions, groupLabel: te("language") }}
            theme={{ value: theme, onValueChange: setTheme, options: themeOptions, groupLabel: te("theme") }}
            account={signedIn ? { name: te("memberName"), initials: "AT" } : undefined}
            cartCount={cartCount}
            cartLabel={te("cart")}
            accountLabel={te("account")}
            signInLabel={te("signIn")}
            onCart={() => setLastAction(`${te("cart")} ${te("clicked")}`)}
            onAccount={() => setLastAction(`${te("account")} ${te("clicked")}`)}
            onSignIn={() => { setSignedIn(true); setLastAction(`${te("signIn")} ${te("clicked")}`); }}
          />

          <header className="ds-applied-hero">
            <p className="ds-applied-hero-eyebrow">{te("tagline")}</p>
            <h2 className="ds-applied-hero-title">{te("searchLine")}</h2>
            <ul className="ds-applied-hero-lines">
              <li>{te("shippingLine")}</li>
            </ul>
          </header>

          <div className="ds-applied-block">
            <header className="ds-applied-block-head">
              <h3>{te("featuredTitle")}</h3>
              <p>{te("featuredIntro")}</p>
            </header>
            <div className="ds-applied-grid">
              {offers.map((offer) => (
                <ProductCard
                  key={offer.id}
                  unavailable={offer.stock === 0}
                  image={<CardImage src={offer.image} alt={cardAlt(offer.name)} missingLabel={te("missingImage")} />}
                  title={<CardTitle>{offer.name}</CardTitle>}
                  metadata={<CardMetadata items={[offer.set]} />}
                  badges={badgeSlot(offer)}
                  price={priceSlot(offer)}
                  availability={
                    <ProductAvailability
                      sellersLabel={sellersCount(offer.sellers)}
                      stockLabel={offer.stock > 0 ? available(offer.stock) : te("outOfStock")}
                      outOfStock={offer.stock === 0}
                    />
                  }
                  actions={
                    <Button
                      size="sm"
                      variant={added === offer.id ? "secondary" : "primary"}
                      disabled={offer.stock === 0}
                      onClick={() => addToCart(offer)}
                    >
                      <ShoppingCart aria-hidden="true" />
                      {added === offer.id ? te("added") : te("addToCart")}
                    </Button>
                  }
                />
              ))}
            </div>
          </div>

          <div className="ds-applied-block">
            <header className="ds-applied-block-head">
              <h3>{te("resultsTitle")}</h3>
            </header>
            <div className="ds-applied-results">
              {results.map((offer) => (
                <ProductRow
                  key={offer.id}
                  unavailable={offer.stock === 0}
                  image={<CardImage src={offer.image} alt={cardAlt(offer.name)} missingLabel={te("missingImage")} />}
                  title={<CardTitle as="h4" size="sm">{offer.name}</CardTitle>}
                  metadata={<CardMetadata items={[offer.set, offer.game]} />}
                  badges={badgeSlot(offer)}
                  price={<LowestAvailable amount={offer.stock > 0 ? offer.lowest : null} locale={priceLocale} label={te("lowest")} unavailableLabel={te("outOfStock")} />}
                  availability={<ProductAvailability sellersLabel={sellersCount(offer.sellers)} />}
                  actions={
                    <Button size="sm" variant="outline" disabled={offer.stock === 0} onClick={() => addToCart(offer)}>
                      {te("addToCart")}
                    </Button>
                  }
                />
              ))}
            </div>
          </div>

          <div className="ds-applied-block">
            <header className="ds-applied-block-head">
              <h3>{te("cartTitle")}</h3>
              <p>{te("cartIntro")}</p>
            </header>
            <div className="ds-applied-cart">
              <div className="ds-applied-cart-list">
                <div className="ds-applied-cart-seller">
                  <span className="ds-applied-cart-seller-name">{te("sellerName")}</span>
                  <SellerLevelBadge tier="top" label={te("sellerTop")} />
                  <SellerRating value={4.9} count={1280} label={te("sellerRating")} locale={priceLocale} format="compact" />
                </div>
                <ProductRow
                  image={<CardImage src={demoArtwork.charizard} alt={cardAlt(te("cardCharizard"))} missingLabel={te("missingImage")} />}
                  title={<CardTitle as="h4" size="sm">{te("cardCharizard")}</CardTitle>}
                  metadata={<CardMetadata items={[te("setSV")]} />}
                  badges={<ConditionBadge condition="NM" label={te("condNM")} size="compact" />}
                  price={<LowestAvailable amount={18.5} locale={priceLocale} label={te("lowest")} />}
                />
                <ProductRow
                  image={<CardImage src={demoArtwork.pikachu} alt={cardAlt(te("cardPikachu"))} missingLabel={te("missingImage")} />}
                  title={<CardTitle as="h4" size="sm">{te("cardPikachu")}</CardTitle>}
                  metadata={<CardMetadata items={[te("setSV198")]} />}
                  badges={<ConditionBadge condition="NM" label={te("condNM")} size="compact" />}
                  price={<LowestAvailable amount={10.0} locale={priceLocale} label={te("lowest")} />}
                />
              </div>
              <div className="ds-applied-cart-rail">
                <SellerMinimumProgress
                  label={te("minimumLabel")}
                  locale={priceLocale}
                  current={cartSubtotal}
                  minimum={25}
                  reachedLabel={te("minimumReached")}
                  remainingLabel={(_, text) => minimumRemaining(text)}
                />
                <FreeShippingProgress
                  label={te("freeShipLabel")}
                  locale={priceLocale}
                  current={cartSubtotal}
                  threshold={50}
                  reachedLabel={te("freeShipReached")}
                  remainingLabel={(_, text) => freeShipRemaining(text)}
                />
              </div>
            </div>
          </div>

          <div className="ds-applied-status" role="status">
            <span>{te("lastAction")}: {lastAction ?? te("none")}</span>
            <span>{te("boundedNote")}</span>
          </div>
        </div>
      </DemoPanel>
    </Section>
  </>;
}
