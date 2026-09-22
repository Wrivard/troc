import { useMemo, useRef, useState } from "react";
import { Home, Layers, Search as SearchIcon, ShoppingCart, User } from "lucide-react";
import "../../../scripts/applied-examples.css";

import { MobileNavigation } from "../../components/ui/site-navigation";
import { GlobalSearch, type GlobalSearchSuggestion } from "../../components/ui/global-search";
import { TrocLogo } from "../../components/ui/logo";
import { Button } from "../../components/ui/button";
import {
  CardImage,
  CardMetadata,
  CardTitle,
  ProductAvailability,
  ProductRow,
} from "../../components/ui/product-presentation";
import { LowestAvailable } from "../../components/ui/price";
import { ConditionBadge, GameBadge } from "../../components/ui/marketplace-badges";
import { FreeShippingProgress } from "../../components/ui/marketplace-progress";
import { usePreferences } from "../../hooks/use-preferences";
import { useExamplesMessages } from "../../lib/messages-examples";
import { demoArtwork } from "../demo-assets";
import { DemoPanel, PageHeader, Section } from "../parts";

export default function MobilePage() {
  const { t, locale } = usePreferences();
  const { te, sellersCount, cardAlt, freeShipRemaining } = useExamplesMessages();
  const priceLocale = locale === "fr" ? "fr" : "en";

  const [query, setQuery] = useState("");
  const [mobileNav, setMobileNav] = useState("home");
  const [cart, setCart] = useState(3);
  const [cartSubtotal, setCartSubtotal] = useState(31.25);
  const [lastAction, setLastAction] = useState<string | null>(null);
  // Ref to the actual bounded phone GlobalSearch input so the bottom-nav
  // Search focuses/opens the real field instead of only toggling styling.
  const searchInputRef = useRef<HTMLInputElement>(null);

  const handleCart = () => {
    setMobileNav("cart");
    setLastAction(`${te("cart")} ${te("clicked")}`);
  };
  const handleSearchNav = () => {
    setMobileNav("search");
    searchInputRef.current?.focus();
  };

  const catalog: GlobalSearchSuggestion[] = [
    { value: "charizard", title: te("cardCharizard"), meta: te("setSV") },
    { value: "pikachu", title: te("cardPikachu"), meta: te("setSV198") },
    { value: "luffy", title: te("cardLuffy"), meta: te("setOP") },
  ];
  const suggestions = useMemo(() => {
    const q = query.trim().toLowerCase();
    return q ? catalog.filter((c) => c.title.toLowerCase().includes(q)) : catalog;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [query, locale]);

  const bottomItems = [
    { id: "home", label: te("navHome"), icon: <Home aria-hidden="true" />, current: mobileNav === "home", onSelect: () => setMobileNav("home") },
    { id: "search", label: te("navSearch"), icon: <SearchIcon aria-hidden="true" />, current: mobileNav === "search", onSelect: handleSearchNav },
    { id: "collect", label: te("navCollect"), icon: <Layers aria-hidden="true" />, current: mobileNav === "collect", onSelect: () => setMobileNav("collect") },
    { id: "cart", label: te("cart"), icon: <ShoppingCart aria-hidden="true" />, count: cart, current: mobileNav === "cart", onSelect: handleCart },
    { id: "account", label: te("account"), icon: <User aria-hidden="true" />, current: mobileNav === "account", onSelect: () => setMobileNav("account") },
  ];

  const addToCart = (name: string, amount: number) => {
    setCart((c) => c + 1);
    setCartSubtotal((s) => Math.round((s + amount) * 100) / 100);
    setLastAction(`${name} — ${te("added")}`);
  };

  return <>
    <PageHeader eyebrow={t("layout")} title={te("mobileVignetteTitle")} description={te("mobileVignetteIntro")} />

    <Section title={te("mobileGuidanceTitle")}>
      <DemoPanel>
        <ul className="ds-applied-hero-lines" style={{ margin: 0 }}>
          <li>{te("breakpointCompact")}</li>
          <li>{te("breakpointWide")}</li>
        </ul>
      </DemoPanel>
    </Section>

    <Section title={te("mobileVignetteTitle")} description={te("boundedNote")}>
      <DemoPanel>
        <div className="ds-applied-phones">
          <div className="ds-applied-phone">
            <div className="troc-nav-frame troc-nav-frame--phone">
              <div className="troc-mobile-topbar">
                <div className="troc-site-header-brand">
                  <TrocLogo variant="auto" height={24} label={te("brandLabel")} />
                </div>
                <Button variant="ghost" size="icon" className="troc-site-cart" aria-label={`${te("cart")} (${cart})`} onClick={handleCart}>
                  <ShoppingCart aria-hidden="true" />
                  {cart > 0 && <span className="troc-site-cart-count" aria-hidden="true">{cart}</span>}
                </Button>
                <div className="troc-mobile-topbar-search">
                  <GlobalSearch
                    ref={searchInputRef}
                    label={te("searchLabel")}
                    placeholder={te("searchPlaceholder")}
                    value={query}
                    onValueChange={setQuery}
                    suggestions={suggestions}
                    onSelect={(s) => setLastAction(`${te("selectedItem")}: ${s.title}`)}
                    emptyLabel={te("searchEmpty")}
                    loadingLabel={te("searchLoading")}
                    clearLabel={te("searchClear")}
                    submitLabel={te("searchSubmit")}
                  />
                </div>
              </div>

              <div className="troc-nav-frame-body">
                <FreeShippingProgress
                  label={te("freeShipLabel")}
                  locale={priceLocale}
                  size="compact"
                  current={cartSubtotal}
                  threshold={50}
                  reachedLabel={te("freeShipReached")}
                  remainingLabel={(_, text) => freeShipRemaining(text)}
                />
                <ProductRow
                  image={<CardImage src={demoArtwork.charizard} alt={cardAlt(te("cardCharizard"))} missingLabel={te("missingImage")} />}
                  title={<CardTitle as="h3" size="sm">{te("cardCharizard")}</CardTitle>}
                  metadata={<CardMetadata items={[te("setSV")]} />}
                  badges={<><GameBadge label={te("gamePokemon")} size="compact" /><ConditionBadge condition="NM" label={te("condNM")} size="compact" /></>}
                  price={<LowestAvailable amount={18.5} locale={priceLocale} label={te("lowest")} />}
                  availability={<ProductAvailability sellersLabel={sellersCount(12)} />}
                  actions={<Button size="sm" variant="primary" onClick={() => addToCart(te("cardCharizard"), 18.5)}>{te("addToCart")}</Button>}
                />
                <ProductRow
                  image={<CardImage src={demoArtwork.luffy} alt={cardAlt(te("cardLuffy"))} missingLabel={te("missingImage")} />}
                  title={<CardTitle as="h3" size="sm">{te("cardLuffy")}</CardTitle>}
                  metadata={<CardMetadata items={[te("setOP")]} />}
                  badges={<><GameBadge label={te("gameOnePiece")} size="compact" /><ConditionBadge condition="LP" label={te("condLP")} size="compact" /></>}
                  price={<LowestAvailable amount={9.75} locale={priceLocale} label={te("lowest")} />}
                  availability={<ProductAvailability sellersLabel={sellersCount(6)} />}
                  actions={<Button size="sm" variant="outline" onClick={() => addToCart(te("cardLuffy"), 9.75)}>{te("addToCart")}</Button>}
                />
              </div>

              <MobileNavigation label={te("bottomNav")} items={bottomItems} />
            </div>
            <p className="ds-applied-phone-caption">{te("boundedNote")}</p>
          </div>
        </div>
        <p className="ds-applied-status" role="status" style={{ paddingInline: 0 }}>
          {te("lastAction")}: {lastAction ?? te("none")}
        </p>
      </DemoPanel>
    </Section>
  </>;
}
