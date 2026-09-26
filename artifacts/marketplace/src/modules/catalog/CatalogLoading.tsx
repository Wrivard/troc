import { useEffect, useState } from "react";
import type { Locale } from "@workspace/catalog";
import { Skeleton } from "@workspace/troc-design-system/components/ui/skeleton";
import { catalogMessages } from "./messages";
import "./catalog-browse.css";
/** Reserve the same responsive columns and artwork frames as the resolved route. */
export function CatalogLoading({
  locale,
  kind = "search",
}: {
  locale: Locale;
  kind?: "search" | "product";
}) {
  const fr = locale === "fr";
  const [view, setView] = useState("large");
  useEffect(() => {
    try {
      const saved = localStorage.getItem("troc.catalog.view");
      if (saved && ["large", "compact", "list"].includes(saved)) setView(saved);
    } catch {
      /* Optional preference. */
    }
  }, []);
  const line = (width: string, height = 16) => (
    <Skeleton style={{ width, height }} />
  );
  return (
    <>
      <span className="sr-only" role="status">
        {catalogMessages.loading[fr ? 1 : 0]}
      </span>
      {import.meta.env.DEV && (
        <p
          className="border-l-2 border-border pl-3 text-xs leading-relaxed text-muted-foreground"
          role="note"
        >
          {catalogMessages.demo[fr ? 1 : 0]}
        </p>
      )}
      {kind === "search" ? (
        <>
          <header className="troc-search-heading">
            <h1>{fr ? "Trouvez vos cartes" : "Find your cards"}</h1>
            <p>
              {fr ? "Comparez les offres en CAD." : "Compare offers in CAD."}
            </p>
          </header>
          <div
            className="troc-browse troc-browse-loading"
            data-view={view}
            aria-hidden="true"
          >
            <div className="troc-browse-toolbar">
              <Skeleton className="troc-loading-search" />
              <div className="troc-browse-tools">
                <Skeleton style={{ width: 140, height: 44 }} />
                <Skeleton style={{ width: 132, height: 44 }} />
              </div>
            </div>
            <div className="troc-browse-layout">
              <aside className="troc-loading-filters">
                <div className="troc-browse-filter-heading">
                  {line("45%", 22)}
                </div>
                {Array.from({ length: 6 }, (_, i) => (
                  <div className="troc-browse-group" key={i}>
                    {line("65%", 18)}
                    {i === 0 && (
                      <div className="troc-loading-options">
                        {Array.from({ length: 6 }, (_, j) => (
                          <div key={j}>
                            {line("18px", 18)}
                            {line("65%", 14)}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
              </aside>
              <section className="troc-browse-results">
                <div className="troc-browse-results-heading">
                  {line("160px", 16)}
                  <Skeleton style={{ width: 140, height: 44 }} />
                </div>
                <div className="troc-editorial-catalog">
                  {Array.from({ length: 8 }, (_, i) => (
                    <article className="troc-market-card" key={i}>
                      <div className="troc-market-card-art">
                        <Skeleton className="troc-loading-card-image" style={{ width: "100%" }} />
                      </div>
                      <div className="troc-market-card-copy grid">
                        <h3>{line("80%", 18)}</h3>
                        <div className="troc-market-card-meta">
                          {line("95%", 14)}
                          {line("65%", 14)}
                        </div>
                        <div className="troc-market-card-price">
                          {line("20%", 10)}
                          {line("45%", 29)}
                        </div>
                        <div className="troc-market-card-availability">
                          {line("75%", 14)}
                          <Skeleton style={{ width: 28, height: 28 }} />
                        </div>
                        <div className="troc-market-card-reference">
                          {line("40%", 14)}
                        </div>
                      </div>
                    </article>
                  ))}
                </div>
              </section>
            </div>
          </div>
        </>
      ) : (
        <>
          <div className="troc-loading-breadcrumb" aria-hidden="true">
            {line("45%", 24)}
          </div>
          <div
            className="troc-product-decision troc-product-loading"
            aria-hidden="true"
          >
            <aside className="troc-product-sticky">
              <div className="troc-artwork-panel">
                <div data-catalog-artwork className="grid gap-3">
                  <Skeleton className="troc-loading-product-image" />
                  {line("45%", 20)}
                  {line("30%", 16)}
                </div>
              </div>
            </aside>
            <div className="troc-product-decision-details">
              <div className="troc-editorial-intro">
                {line("25%", 12)}
                {line("85%", 48)}
              </div>
              <div className="troc-purchase-summary troc-loading-summary">
                {line("75%", 20)}
                {line("55%", 28)}
                <Skeleton style={{ height: 44 }} />
                <Skeleton style={{ height: 44 }} />
                {line("65%", 14)}
              </div>
              <div className="troc-loading-summary">
                {line("35%", 20)}
                {Array.from({ length: 3 }, (_, i) => (
                  <Skeleton key={i} style={{ height: 76 }} />
                ))}
              </div>
            </div>
          </div>
        </>
      )}
    </>
  );
}
