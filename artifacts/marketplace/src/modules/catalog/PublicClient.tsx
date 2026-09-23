import { MarketplaceHeader, MarketplaceFooter } from "../brand/SiteChrome";
import { PremiumEmptyState } from "@workspace/troc-design-system/components/ui/marketplace-compositions";
import { useEffect, useState } from "react";
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
export function PublicClient({ path }: { path: string }) {
  const { locale, theme, setLocale, setTheme } = usePreferences();
  const [page, setPage] = useState<PublicPage | null>(
    window.__TROC_PAGE__ ?? null,
  );
  const [error, setError] = useState("");
  useEffect(() => {
    document.cookie = `troc_locale=${locale}; Path=/; SameSite=Lax; Max-Age=31536000`;
    document.cookie = `troc_theme=${theme}; Path=/; SameSite=Lax; Max-Age=31536000`;
  }, [locale, theme]);
  useEffect(() => {
    if (page && page.path === path && page.locale === locale) return;
    const controller = new AbortController();
    const params = new URLSearchParams(window.location.search);
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
      .then(setPage)
      .catch((e) => {
        if (e.name !== "AbortError") setError(e.message);
      });
    return () => controller.abort();
  }, [path, locale, page]);
  if (!page)
    return (
      <div className="min-h-screen bg-background text-foreground">
        <MarketplaceHeader
          locale={locale}
          searchDisabled={!error}
          theme={theme}
          onLocale={setLocale}
          onTheme={setTheme}
        />
        <main
          id="main-content"
          className="mx-auto grid min-h-[60vh] max-w-screen-xl content-start gap-6 px-4 py-12 md:px-8"
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
          ) : path === "/search" ? (
            <CatalogLoading locale={locale} />
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
    <PublicMarketplace
      page={{ ...page, locale }}
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
  );
}
