import { useMemo, useState } from "react";
import { Home, Layers, Search as SearchIcon, ShoppingCart, User } from "lucide-react";
import { SiteHeader, MobileNavigation, type SiteNavItem } from "../../components/ui/site-navigation";
import { TrocLogo } from "../../components/ui/logo";
import { GlobalSearch, type GlobalSearchSuggestion } from "../../components/ui/global-search";
import { Button } from "../../components/ui/button";
import { usePreferences } from "../../hooks/use-preferences";
import { useNavigationMessages } from "../../lib/messages-navigation";
import { DemoPanel, Guidelines, PageHeader, Section } from "../parts";

const catalog: GlobalSearchSuggestion[] = [
  { value: "charizard", title: "Charizard ex · 199/165", meta: "Scarlet & Violet" },
  { value: "pikachu", title: "Pikachu · 025/198", meta: "Scarlet & Violet" },
  { value: "luffy", title: "Monkey D. Luffy · OP05-119", meta: "One Piece" },
  { value: "lightning", title: "Lightning Bolt · M11", meta: "Magic" },
];

export default function SiteNavigationDemo() {
  const { locale, setLocale, theme, setTheme } = usePreferences();
  const { tn } = useNavigationMessages();
  const [query, setQuery] = useState("");
  const [mobileQuery, setMobileQuery] = useState("");
  const [nav, setNav] = useState("shop");
  const [mobileNav, setMobileNav] = useState("home");
  const [signedIn, setSignedIn] = useState(false);
  const [cart, setCart] = useState(2);
  const [sellLoading, setSellLoading] = useState(false);
  const [collectDisabled, setCollectDisabled] = useState(true);
  const [lastAction, setLastAction] = useState<string | null>(null);

  const suggestions = useMemo(() => {
    const q = query.trim().toLowerCase();
    return (q ? catalog.filter((c) => c.title.toLowerCase().includes(q)) : catalog);
  }, [query]);
  const mobileSuggestions = useMemo(() => {
    const q = mobileQuery.trim().toLowerCase();
    return (q ? catalog.filter((c) => c.title.toLowerCase().includes(q)) : catalog);
  }, [mobileQuery]);

  const localeOptions = [
    { value: "en" as const, code: "EN", label: tn("localeEnglish") },
    { value: "fr" as const, code: "FR", label: tn("localeFrench") },
  ];
  const themeOptions = [
    { value: "dark" as const, label: tn("themeDark") },
    { value: "light" as const, label: tn("themeLight") },
  ];

  const navItems: SiteNavItem[] = [
    { id: "shop", label: tn("navShop"), current: nav === "shop", onSelect: () => { setNav("shop"); setLastAction(`${tn("navShop")} ${tn("navClicked")}`); } },
    { id: "sell", label: tn("navSell"), current: nav === "sell", loading: sellLoading, onSelect: () => { setNav("sell"); setLastAction(`${tn("navSell")} ${tn("navClicked")}`); } },
    { id: "collect", label: tn("navCollect"), current: nav === "collect", disabled: collectDisabled, onSelect: () => { setNav("collect"); setLastAction(`${tn("navCollect")} ${tn("navClicked")}`); } },
  ];

  const searchProps = {
    label: tn("searchLabel"),
    placeholder: tn("searchPlaceholder"),
    value: query,
    onValueChange: setQuery,
    suggestions,
    onSelect: (s: GlobalSearchSuggestion) => setLastAction(`${tn("searchSelected")}: ${s.title}`),
    loadingLabel: tn("searchLoading"),
    emptyLabel: tn("searchEmpty"),
    clearLabel: tn("searchClear"),
    submitLabel: tn("searchSubmit"),
  };

  return <>
    <PageHeader eyebrow={tn("brandNav")} title={tn("navTitle")} description={tn("navIntro")} />

    <Section title={tn("navDesktop")}><DemoPanel>
      <div className="troc-nav-frame">
        <SiteHeader
          navItems={navItems}
          navLabel={tn("navPrimary")}
          logoLabel={tn("navBrandLabel")}
          search={searchProps}
          locale={{ value: locale, onValueChange: setLocale, options: localeOptions, groupLabel: tn("localeGroup") }}
          theme={{ value: theme, onValueChange: setTheme, options: themeOptions, groupLabel: tn("themeGroup") }}
          account={signedIn ? { name: tn("navMemberName"), initials: "AT" } : undefined}
          cartCount={cart}
          cartLabel={tn("navCart")}
          accountLabel={tn("navAccount")}
          signInLabel={tn("navSignIn")}
          onCart={() => { setCart((c) => c + 1); setLastAction(`${tn("navCart")} ${tn("navClicked")}`); }}
          onAccount={() => setLastAction(`${tn("navAccount")} ${tn("navClicked")}`)}
          onSignIn={() => { setSignedIn(true); setLastAction(`${tn("navSignIn")} ${tn("navClicked")}`); }}
        />
        <div className="troc-nav-frame-body">{tn("navFrameNote")}</div>
      </div>
      <div style={{ display: "flex", flexWrap: "wrap", gap: 12, alignItems: "center", marginTop: 16 }}>
        <Button variant="outline" size="sm" aria-pressed={signedIn} onClick={() => setSignedIn((s) => !s)}>
          {signedIn ? tn("navSignedInAs") : tn("navSignIn")} · {tn("navToggleAccount")}
        </Button>
        <Button variant="outline" size="sm" aria-pressed={sellLoading} onClick={() => setSellLoading((v) => !v)}>
          {tn("navToggleLoading")}
        </Button>
        <Button variant="outline" size="sm" aria-pressed={collectDisabled} onClick={() => setCollectDisabled((v) => !v)}>
          {tn("navToggleDisabled")}
        </Button>
      </div>
      <p className="ds-helper" style={{ marginTop: 8 }}>{tn("navItemStatesNote")}</p>
      <p className="ds-inline-status" role="status" style={{ marginTop: 12 }}>
        {tn("navLastAction")}: {lastAction ?? tn("navNone")}
      </p>
      <p className="ds-helper" style={{ marginTop: 4 }}>{tn("demoOnly")}</p>
    </DemoPanel></Section>

    <Section title={tn("navMobile")}><DemoPanel>
      <div className="troc-nav-frame troc-nav-frame--phone">
        <div className="troc-mobile-topbar">
          <div className="troc-site-header-brand"><TrocLogo variant="auto" height={24} label={tn("navBrandLabel")} /></div>
          <Button variant="ghost" size="icon" className="troc-site-cart" aria-label={`${tn("navCart")} (${cart})`} onClick={() => setCart((c) => c + 1)}>
            <ShoppingCart aria-hidden="true" />
            {cart > 0 && <span className="troc-site-cart-count" aria-hidden="true">{cart}</span>}
          </Button>
          <div className="troc-mobile-topbar-search">
            <GlobalSearch
              label={tn("searchLabel")}
              placeholder={tn("navSearch")}
              value={mobileQuery}
              onValueChange={setMobileQuery}
              suggestions={mobileSuggestions}
              onSelect={(s) => setLastAction(`${tn("searchSelected")}: ${s.title}`)}
              loadingLabel={tn("searchLoading")}
              emptyLabel={tn("searchEmpty")}
              clearLabel={tn("searchClear")}
              submitLabel={tn("searchSubmit")}
            />
          </div>
        </div>
        <div className="troc-nav-frame-body">{tn("navFrameNote")}</div>
        <MobileNavigation
          label={tn("navBottom")}
          items={[
            { id: "home", label: tn("navHome"), icon: <Home aria-hidden="true" />, current: mobileNav === "home", onSelect: () => setMobileNav("home") },
            { id: "search", label: tn("navSearch"), icon: <SearchIcon aria-hidden="true" />, current: mobileNav === "search", onSelect: () => setMobileNav("search") },
            { id: "collect", label: tn("navCollect"), icon: <Layers aria-hidden="true" />, current: mobileNav === "collect", onSelect: () => setMobileNav("collect") },
            { id: "cart", label: tn("navCart"), icon: <ShoppingCart aria-hidden="true" />, count: cart, current: mobileNav === "cart", onSelect: () => setMobileNav("cart") },
            { id: "account", label: tn("navAccount"), icon: <User aria-hidden="true" />, current: mobileNav === "account", onSelect: () => setMobileNav("account") },
          ]}
        />
      </div>
    </DemoPanel></Section>

    <Guidelines items={[{ kind: "do", text: tn("navDo") }, { kind: "dont", text: tn("navDont") }]} />
  </>;
}
