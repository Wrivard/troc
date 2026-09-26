import { usePreferences } from "@workspace/troc-design-system/hooks/use-preferences";
import { MarketplaceHeader, MarketplaceFooter } from "../brand/SiteChrome";
export function SellerPlanned({ path }: { path: string }) {
  const { locale, theme, setLocale, setTheme } = usePreferences(),
    fr = locale === "fr";
  const names: Record<string, string[]> = {
    "/seller/messages": ["Messages", "Messages"],
    "/seller/payouts": ["Payouts", "Versements"],
    "/seller/analytics": ["Analytics", "Statistiques"],
    "/seller/promotions": ["Promotions", "Promotions"],
  };
  return (
    <>
      <MarketplaceHeader
        locale={locale}
        theme={theme}
        onLocale={setLocale}
        onTheme={setTheme}
      />
      <main id="main-content">
        <header className="seller-page-heading">
          <div>
            <h1>{names[path]?.[fr ? 1 : 0]}</h1>
            <p>
              {fr
                ? "Cette section sera développée dans une prochaine étape."
                : "This section will be developed in a later step."}
            </p>
          </div>
        </header>
        <section className="settings-panel">
          <h2>{fr ? "La suite du Seller Hub" : "More of your Seller Hub"}</h2>
          <p>
            {fr
              ? "Les pages Vue d’ensemble, Inventaire et Paramètres sont prêtes pour votre revue."
              : "Overview, Inventory and Settings are ready for your review."}
          </p>
          <a
            href={
              (path === "/seller/messages"
                ? "/seller/orders"
                : "/seller/dashboard") +
              "?lang=" +
              locale
            }
          >
            {fr ? "Continuer dans votre espace" : "Continue in your workspace"}{" "}
            →
          </a>
        </section>
      </main>
      <MarketplaceFooter locale={locale} />
    </>
  );
}
