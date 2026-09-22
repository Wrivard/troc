import { useEffect, useState } from "react";
import type { PublicPage } from "@workspace/catalog";
import { usePreferences } from "@workspace/troc-design-system/hooks/use-preferences";
import { Button } from "@workspace/troc-design-system/components/ui/button";
import { PublicMarketplace } from "./PublicMarketplace";
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
      <main className="mx-auto grid max-w-screen-xl gap-4 p-8">
        <h1>
          {
            catalogMessages[
              error === "notFound" ? "notFound" : error ? "failed" : "loading"
            ][locale === "en" ? 0 : 1]
          }
        </h1>
        {error && (
          <Button onClick={() => window.location.reload()}>
            {catalogMessages.retry[locale === "en" ? 0 : 1]}
          </Button>
        )}
        <a href={import.meta.env.BASE_URL}>
          {catalogMessages.home[locale === "en" ? 0 : 1]}
        </a>
      </main>
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
