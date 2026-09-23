import { createRoot } from "react-dom/client";
import { useMemo, useState } from "react";
import {
  GlobalSearchPresentation,
  type SearchPresentationGroup,
} from "../GlobalSearchPresentation";
import { TrocLogo } from "@workspace/troc-design-system/components/ui/logo";
import { Button } from "@workspace/troc-design-system/components/ui/button";
import "@workspace/troc-design-system/styles.css";
import fixtures from "./fixtures.json";
import "./harness.css";
function Harness() {
  const params = new URLSearchParams(location.search);
  const locale = params.get("lang") === "fr" ? "fr" : "en";
  const fr = locale === "fr";
  const [query, setQuery] = useState(params.get("q") ?? "BP02-EN179");
  const [state, setState] = useState("results");
  const [last, setLast] = useState("");
  const [theme, setTheme] = useState(
    params.get("theme") === "light" ? "light" : "dark",
  );
  document.documentElement.className = theme;
  document.documentElement.lang = locale;
  const url = (path: string, values: Record<string, string> = {}) =>
    `http://127.0.0.1:4313${path}?${new URLSearchParams({ lang: locale, ...values })}`;
  const groups = useMemo<SearchPresentationGroup[]>(
    () => [
      {
        kind: "cards",
        seeAllHref: url("/search", { q: query }),
        results: fixtures.card.map((result) => ({
          id: result.product.id,
          href: url(`/product/${result.product.slug}`, {
            variantId: result.product.variants[0].id,
          }),
          title: result.product.name[locale],
          subtitle: fixtures.games.find(
            (game) => game.id === result.product.gameId,
          )?.name[locale],
          detail: `${result.product.variants[0].number} · ${result.product.variants[0].rarity}`,
          imageUrl:
            result.product.variants[0].images?.[0]?.url ??
            result.product.imageUrl,
          lowestCents: result.lowestCents,
          sellerCount: result.sellerCount,
        })),
      },
      {
        kind: "sets",
        results: fixtures.sets.map((set) => ({
          id: set.id,
          title: set.name[locale],
          href: url(`/sets/${set.slug}`),
          subtitle: fixtures.games.find((game) => game.id === set.gameId)?.name[
            locale
          ],
        })),
      },
      {
        kind: "products",
        seeAllHref: url("/search", { type: "sealed" }),
        results: fixtures.products.map((result) => ({
          id: result.product.id,
          title: result.product.name[locale],
          href: url(`/product/${result.product.slug}`),
          subtitle: fr
            ? "Produit scellé de démonstration"
            : "Demo sealed product",
          imageUrl: result.product.imageUrl,
          lowestCents: result.lowestCents,
          sellerCount: result.sellerCount,
        })),
      },
      {
        kind: "sellers",
        results: fixtures.sellers.map((seller) => ({
          id: seller.id,
          title: seller.name,
          subtitle: `${seller.city}, ${seller.province}`,
          detail: fr
            ? "Vendeur fictif de démonstration"
            : "Fictional demo seller",
          href: url(`/store/${seller.slug}`),
          imageUrl: seller.logoUrl,
        })),
      },
    ],
    [query, locale],
  );
  return (
    <>
      <header className="search-harness-header">
        <a href="http://127.0.0.1:4313/" aria-label="TROC">
          <TrocLogo />
        </a>
        <div className="search-harness-field">
          <GlobalSearchPresentation
            locale={locale}
            query={query}
            groups={state === "empty" ? [] : groups}
            loading={state === "loading"}
            error={
              state === "error"
                ? fr
                  ? "Réessayez ou ouvrez le catalogue complet."
                  : "Try again or open the full catalog."
                : null
            }
            searchAllHref={url("/search", { q: query })}
            onQueryChange={setQuery}
            onNavigate={
              params.has("navigate") ? undefined : (href) => setLast(href)
            }
          />
        </div>
        <a href="#harness-controls">{fr ? "Démo" : "Demo"}</a>
      </header>
      <main className="search-harness-main">
        <h1>
          {fr ? "Banc d’essai de la recherche" : "Search presentation harness"}
        </h1>
        <p>
          {fr
            ? "Présentation isolée. Lignes fixes du catalogue de démonstration approuvé; la saisie ne filtre pas ces exemples. Prix, vendeurs et stocks fictifs. Aucun achat."
            : "Isolated presentation. Fixed rows from the approved demo catalog; typing does not filter these examples. Fictional prices, sellers and inventory. No purchases."}
        </p>
        <div id="harness-controls" className="search-harness-controls">
          {["results", "loading", "empty", "error"].map((value) => (
            <Button
              key={value}
              variant="secondary"
              onClick={() => setState(value)}
            >
              {value}
            </Button>
          ))}
          <Button
            variant="secondary"
            onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
          >
            {theme}
          </Button>
          <a href={`?lang=${fr ? "en" : "fr"}`}>
            {fr ? "English" : "Français"}
          </a>
        </div>
        <output data-last-navigation>{last}</output>
        <p>
          {fr
            ? "Les liens pointent vers les routes locales réelles. Par défaut, le banc d’essai affiche la destination sans quitter cette page."
            : "Links point to real local routes. By default, the harness displays the destination without leaving this page."}
        </p>
      </main>
    </>
  );
}
createRoot(document.getElementById("root")!).render(<Harness />);
