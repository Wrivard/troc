import { useEffect, useState } from "react";
import type { Locale } from "@workspace/catalog";
import { SiteHeader } from "@workspace/troc-design-system/components/ui/site-navigation";
import { TrocLogo } from "@workspace/troc-design-system/components/ui/logo";
import { readCart } from "../commerce/cart-storage";

export type ChromeProps = {
  locale: Locale;
  theme: "dark" | "light";
  onLocale?: (locale: Locale) => void;
  onTheme?: (theme: "dark" | "light") => void;
  base?: string;
  searchDisabled?: boolean;
};

export function MarketplaceHeader({
  locale,
  theme,
  onLocale,
  onTheme,
  base = "",
  searchDisabled = false,
}: ChromeProps) {
  const fr = locale === "fr";
  const [query, setQuery] = useState("");
  const [count, setCount] = useState(0);
  useEffect(() => {
    const update = () =>
      setCount(readCart().reduce((n, line) => n + line.quantity, 0));
    update();
    window.addEventListener("troc:cart", update);
    return () => window.removeEventListener("troc:cart", update);
  }, []);
  const go = (path: string) =>
    window.location.assign(
      `${base}${path}${path.includes("?") ? "&" : "?"}lang=${locale}`,
    );
  return (
    <div className="print:hidden">
      <a className="troc-skip" href="#main-content">
        {fr ? "Aller au contenu" : "Skip to content"}
      </a>
      <SiteHeader
        compactMobile
        homeHref={`${base}/?lang=${locale}`}
        logoLabel="TROC"
        navLabel={fr ? "Navigation principale" : "Main navigation"}
        navItems={[
          {
            id: "shop",
            label: fr ? "Magasiner" : "Shop",
            href: `${base}/search?lang=${locale}`,
          },
          {
            id: "sell",
            label: fr ? "Vendre" : "Sell",
            href: `${base}/sell?lang=${locale}`,
          },
          {
            id: "collect",
            label: fr ? "Collectionner" : "Collect",
            href: `${base}/collection?lang=${locale}`,
          },
        ]}
        search={{
          mode: "plain",
          disabled: searchDisabled,
          label: fr ? "Rechercher dans le catalogue" : "Search the catalog",
          placeholder: fr ? "Cartes, extensions…" : "Cards, sets…",
          value: query,
          onValueChange: setQuery,
          suggestions: [],
          onSubmit: (q) => go(`/search?q=${encodeURIComponent(q)}`),
          loadingLabel: fr ? "Chargement" : "Loading",
          emptyLabel: fr ? "Rechercher" : "Search",
          clearLabel: fr ? "Effacer" : "Clear",
          submitLabel: fr ? "Rechercher" : "Search",
        }}
        locale={{
          value: locale,
          onValueChange: (value) => onLocale?.(value),
          groupLabel: fr ? "Langue" : "Language",
          options: [
            { value: "en", code: "EN", label: "English" },
            { value: "fr", code: "FR", label: "Français" },
          ],
        }}
        theme={{
          value: theme,
          onValueChange: (value) => onTheme?.(value),
          groupLabel: fr ? "Thème" : "Theme",
          options: [
            { value: "dark", label: "TROC Dark" },
            { value: "light", label: "TROC Light" },
          ],
        }}
        cartLabel={fr ? "Panier" : "Cart"}
        cartCount={count}
        onCart={() => go("/cart")}
        accountLabel={fr ? "Compte" : "Account"}
        signInLabel={fr ? "Connexion" : "Sign in"}
        onSignIn={() => go("/sign-in")}
      />
    </div>
  );
}

export function MarketplaceFooter({
  locale,
  base = "",
}: Pick<ChromeProps, "locale" | "base">) {
  const fr = locale === "fr";
  const groups = [
    {
      title: fr ? "Magasiner" : "Marketplace",
      links: [
        ["/search", fr ? "Toutes les cartes" : "Explore cards"],
        [
          "/search?max=99&sort=price",
          fr ? "Cartes à moins de 1 $" : "Cards under $1",
        ],
        ["/smart-cart", "Smart Cart"],
      ],
    },
    {
      title: fr ? "Vendre" : "For sellers",
      links: [
        ["/sell", fr ? "Vendre sur TROC" : "Sell on TROC"],
        ["/founding-sellers", fr ? "Vendeurs fondateurs" : "Founding sellers"],
        ["/seller/orders", fr ? "Commandes vendeur" : "Seller orders"],
      ],
    },
    {
      title: fr ? "Votre TROC" : "Your TROC",
      links: [
        ["/account", fr ? "Votre compte" : "Your account"],
        ["/account/orders", fr ? "Vos commandes" : "Your orders"],
        ["/collection", fr ? "Collection · à venir" : "Collection · planned"],
      ],
    },
    {
      title: fr ? "À propos" : "About TROC",
      links: [
        ["/about", fr ? "Notre histoire" : "Our story"],
        ["/help", fr ? "Centre d’aide" : "Help centre"],
        ["/condition-guide", fr ? "Guide d’état" : "Condition guide"],
        ["/developers", fr ? "Développeurs" : "Developers"],
      ],
    },
  ];
  return (
    <footer className="troc-footer-editorial text-card-foreground print:hidden">
      <div className="mx-auto grid max-w-screen-xl gap-10 px-4 py-16 md:px-8">
        <div className="troc-footer-masthead">
          <a href={`${base}/?lang=${locale}`} aria-label="TROC">
            <TrocLogo height={44} />
          </a>
          <p>
            {fr
              ? "Une carte pour compléter votre extension. Une boutique à découvrir. Votre passion, au bon endroit."
              : "A card to complete your set. A store to discover. Your hobby, in the right place."}
          </p>
        </div>
        <div className="grid gap-10 lg:grid-cols-[1.3fr_3fr]">
          <div className="grid content-start gap-4">
            <p className="max-w-xs text-lg font-semibold">
              {fr
                ? "D’ici. Pour les collectionneurs d’ici."
                : "Built here. For collectors here."}
            </p>
            <p className="text-sm text-muted-foreground">
              {fr
                ? "Le marché des cartes à collectionner au Canada."
                : "Canada’s trading card marketplace."}
            </p>
          </div>
          <div className="grid grid-cols-2 gap-8 md:grid-cols-4">
            {groups.map((group) => (
              <nav
                key={group.title}
                aria-label={group.title}
                className="grid content-start gap-3"
              >
                <h2 className="text-sm font-bold">{group.title}</h2>
                {group.links.map(([url, label]) => (
                  <a
                    className="text-sm text-muted-foreground hover:text-foreground hover:underline"
                    key={url}
                    href={`${base}${url}${url.includes("?") ? "&" : "?"}lang=${locale}`}
                  >
                    {label}
                  </a>
                ))}
              </nav>
            ))}
          </div>
        </div>
        <div className="troc-footer-note">
          <p>© {new Date().getUTCFullYear()} TROC · CAD · Canada · EN / FR</p>
          <a className="underline" href={`${base}/help?lang=${locale}#demo`}>
            {fr ? "À propos de cette démo" : "About this demo"}
          </a>
          <p className="w-full">
            {fr
              ? "Les visuels appartiennent à leurs éditeurs et artistes. Aucune affiliation n’est revendiquée. Aucun paiement réel dans cette démo."
              : "Card artwork belongs to its publishers and artists. No endorsement is implied. No real payments in this demo."}
          </p>
        </div>
      </div>
    </footer>
  );
}
