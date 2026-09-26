import {homeOpening} from "./home-opening";
import { MarketplaceHeader, MarketplaceFooter } from "../brand/SiteChrome";
import { PremiumEmptyState } from "@workspace/troc-design-system/components/ui/marketplace-compositions";
import { useEffect, useRef, useState } from "react";
import type { PublicPage } from "@workspace/catalog";
import { usePreferences } from "@workspace/troc-design-system/hooks/use-preferences";
import { Button } from "@workspace/troc-design-system/components/ui/button";
import { PublicMarketplace } from "./PublicMarketplace";
import { CatalogLoading } from "./CatalogBrowse";
import { catalogMessages } from "./messages";
declare global {
  interface Window {
    __TROC_PAGE__?: PublicPage;
  }
}
export function PublicClient({ path, initialPage }: { path: string; initialPage?: PublicPage }) {
  const { locale, theme, setLocale, setTheme } = usePreferences();
  const [page, setPage] = useState<PublicPage | null>(
    initialPage ?? (typeof window !== "undefined" ? window.__TROC_PAGE__ : null) ?? null,
  );
  const [error, setError] = useState("");
  const [search, setSearch] = useState(typeof window !== "undefined" ? window.location.search : "");
  const [retry, setRetry] = useState(0);
  const [pending, setPending] = useState(false);
  const focusAfterLoad = useRef<string | null>(null);
  const loaded = useRef(page?.path === path && page.locale === locale ? path + search + locale : "");
  useEffect(() => {
    const change = () => {
      const state = window.history.state;
      if (typeof state?.trocCatalogFocus === "string" && (state.trocCatalogFocus === "catalog-page-size" || state.trocCatalogFocus.startsWith("catalog-filter-"))) {
        focusAfterLoad.current = state.trocCatalogFocus;
        const { trocCatalogFocus: _focus, ...rest } = state;
        window.history.replaceState(rest, "");
      }
      setSearch(window.location.search);
    };
    window.addEventListener("popstate", change);
    return () => window.removeEventListener("popstate", change);
  }, []);
  useEffect(() => {
    document.cookie = `troc_locale=${locale}; Path=/; SameSite=Lax; Max-Age=31536000`;
    document.cookie = `troc_theme=${theme}; Path=/; SameSite=Lax; Max-Age=31536000`;
  }, [locale, theme]);
  useEffect(() => {
    const key = path + search + locale;
    if (loaded.current === key && !retry) { setPending(false); setError(""); return; }
    setPending(true);
    setError("");
    const controller = new AbortController();
    const params = new URLSearchParams(search);
    params.set("path", path);
    params.set("lang", locale);
    fetch(`${import.meta.env.BASE_URL}api/catalog/page?${params}`, {
      signal: controller.signal,
    })
      .then(async (response) => {
        if (!response.ok)
          throw new Error(response.status === 404 ? "notFound" : "failed");
        return response.json() as Promise<PublicPage>;
      })
      .then((next) => {
        if (controller.signal.aborted) return;
        loaded.current = key;
        setPage(next);
        setPending(false);
      })
      .catch((e) => {
        if (!controller.signal.aborted) { setError(e.message); setPending(false); }
      });
    return () => controller.abort();
  }, [path, locale, search, retry]);
  useEffect(() => {
    if (!pending && !error && focusAfterLoad.current) {
      document.getElementById(focusAfterLoad.current)?.focus();
      focusAfterLoad.current = null;
    }
  }, [page, pending, error]);
  const displayPage = page ?? (path === "/" ? homeOpening(locale) : null);
  if (!displayPage)
    return (
      <div className="min-h-screen bg-background text-foreground">
        <MarketplaceHeader
          locale={locale}
          searchDisabled={!error}
          hideSearch={path === "/search"}
          theme={theme}
          onLocale={setLocale}
          onTheme={setTheme}
        />
        <main
          id="main-content"
          style={{minHeight:"calc(100svh - 80px)"}}
          className={`troc-marketplace-width mx-auto grid gap-8 px-4 pb-12 pt-6 md:px-8 ${path === "/search" ? "troc-search-page" : ""}`}
        >
          {error ? (
            <div role="alert">
              <PremiumEmptyState
                level={1}
                title={
                  locale === "fr"
                    ? error === "notFound"
                      ? "Page introuvable"
                      : "Catalogue indisponible"
                    : error === "notFound"
                      ? "Page not found"
                      : "Catalog unavailable"
                }
                description={
                  locale === "fr"
                    ? error === "notFound"
                      ? "Cette adresse ne mène à aucune page disponible. Retrouvez les cartes dans le catalogue."
                      : "Le catalogue est temporairement indisponible. Réessayez ou revenez à l’accueil."
                    : error === "notFound"
                      ? "This address does not lead to an available page. Find cards in the catalog."
                      : "The catalog is temporarily unavailable. Try again or return home."
                }
                actions={
                  <>
                    <Button onClick={() => window.location.reload()}>
                      {catalogMessages.retry[locale === "en" ? 0 : 1]}
                    </Button>
                    <Button asChild variant="secondary">
                      <a href={`${import.meta.env.BASE_URL}?lang=${locale}`}>
                        {catalogMessages.home[locale === "en" ? 0 : 1]}
                      </a>
                    </Button>
                  </>
                }
              />
            </div>
          ) : path === "/search" || path.startsWith("/product/") ? (
            <CatalogLoading locale={locale} kind={path.startsWith("/product/") ? "product" : "search"} />
          ) : (
            <div
              role="status"
              aria-live="polite"
              className="grid gap-4 border-l-2 border-border pl-4"
            >
              <h1 className="text-2xl font-semibold">
                {catalogMessages.loading[locale === "en" ? 0 : 1]}
              </h1>
              <p className="text-muted-foreground">
                {locale === "fr"
                  ? "Les cartes et les offres arrivent."
                  : "Loading cards and offers."}
              </p>
            </div>
          )}
        </main>
        <MarketplaceFooter locale={locale} />
      </div>
    );
  return (
    <div aria-busy={pending || !page} onClick={(event) => {
      if (path !== "/search" || event.defaultPrevented || event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
      const anchor = (event.target as Element).closest("a");
      if (!anchor || anchor.target || anchor.hasAttribute("download")) return;
      const url = new URL(anchor.href);
      if (url.origin !== window.location.origin || url.pathname !== window.location.pathname || url.hash || url.searchParams.get("lang") !== locale) return;
      event.preventDefault();
      window.history.pushState(window.history.state, "", url);
      window.dispatchEvent(new PopStateEvent("popstate"));
    }}>
    {(error || (page && pending)) && <div className="fixed bottom-4 left-1/2 z-50 -translate-x-1/2 rounded-xl border border-border bg-card px-5 py-3 shadow-lg" role={error ? "alert" : "status"}>
      {error ? (locale === "fr" ? (page ? "Impossible de charger les nouveaux résultats. Les résultats précédents restent affichés." : "Les cartes n’ont pas pu charger. Vous pouvez toujours explorer TROC.") : (page ? "New results could not load. Previous results are still displayed." : "Card data could not load. You can still explore TROC.")) : (locale === "fr" ? "Mise à jour des résultats…" : "Updating results…")}
      {error && <Button variant="outline" onClick={() => setRetry(v => v + 1)}>{catalogMessages.retry[locale === "en" ? 0 : 1]}</Button>}
    </div>}
    <PublicMarketplace
      key={path === "/" ? "home" : path === "/search" ? "search" : loaded.current}
      page={{ ...displayPage, locale }}
      theme={theme}
      base={import.meta.env.BASE_URL.replace(/\/$/, "")}
      onTheme={setTheme}
      onLocale={(value) => {
        setLocale(value);
        const url = new URL(window.location.href);
        url.searchParams.set("lang", value);
        window.location.assign(url.pathname + url.search);
      }}
    />
    </div>
  );
}
