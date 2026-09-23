import { createRoot } from "react-dom/client";
import { SellPageDetails } from "../SellPageDetails";
import { commerceConfig } from "../../../../../api-server/src/modules/commerce/config";
import { EditorialIntro } from "@workspace/troc-design-system/components/ui/editorial";
import { TrocLogo } from "@workspace/troc-design-system/components/ui/logo";
import "@workspace/troc-design-system/styles.css";
import "./harness.css";
const params = new URLSearchParams(location.search),
  locale = params.get("lang") === "fr" ? "fr" : "en",
  fr = locale === "fr";
document.documentElement.className =
  params.get("theme") === "light" ? "light" : "dark";
document.documentElement.lang = locale;
createRoot(document.getElementById("root")!).render(
  <>
    <header className="sell-harness-header">
      <TrocLogo />
      <p>
        {fr
          ? "Banc d’essai · sections complémentaires de la page Vendre · tarifs de la configuration démo"
          : "Presentation harness · additional Sell-page sections · rates from demo configuration"}
      </p>
    </header>
    <main className="sell-harness-main">
      <EditorialIntro
        level={1}
        eyebrow="TROC · CANADA"
        title={
          fr
            ? "Vos cartes. Un public canadien."
            : "Your cards. A Canadian audience."
        }
        description={
          fr
            ? "Pour les collectionneurs, les vendeurs en ligne et les boutiques locales."
            : "For individual collectors, online sellers and local hobby shops."
        }
      />
      <SellPageDetails
        locale={locale}
        fees={{ ...commerceConfig, mode: "demo" }}
        foundingHref={`http://127.0.0.1:4313/founding-sellers?lang=${locale}`}
        smartCartHref={`http://127.0.0.1:4313/smart-cart?lang=${locale}`}
      />
    </main>
  </>,
);
