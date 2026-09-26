import { createRoot } from "react-dom/client";
import { SmartCartCollectionExercise } from "../SmartCartCollectionExercise";
import { SmartCartFeaturePage } from "../../smart-cart-feature/SmartCartFeaturePage";
import { SmartCartDemo } from "../../SmartCartDemo";
import { TrocLogo } from "@workspace/troc-design-system/components/ui/logo";
import fixtures from "./fixtures.json";
import "@workspace/troc-design-system/styles.css";
import "./harness.css";
const params = new URLSearchParams(location.search),
  locale = params.get("lang") === "fr" ? "fr" : "en";
document.documentElement.className =
  params.get("theme") === "light" ? "light" : "dark";
document.documentElement.lang = locale;
const catalogHref = `http://127.0.0.1:4313/search?lang=${locale}`,
  cartHref = `http://127.0.0.1:4313/cart?lang=${locale}`;
createRoot(document.getElementById("root")!).render(
  <>
    <header className="smart-education-harness-header">
      <TrocLogo />
      <span>
        {locale === "fr"
          ? "Banc d’essai · exercices simulés"
          : "Presentation harness · simulated exercises"}
      </span>
    </header>
    <main className="smart-education-harness-main">
      <SmartCartFeaturePage
        locale={locale}
        catalogHref={catalogHref}
        cartHref={cartHref}
        comparisonDemo={
          <SmartCartDemo locale={locale} catalogHref={catalogHref} />
        }
        collectionExercise={
          <SmartCartCollectionExercise
            locale={locale}
            setTitle={fixtures.setTitle[locale]}
            cards={fixtures.cards.map((card) => ({
              ...card,
              name: card.name[locale],
            }))}
          />
        }
      />
    </main>
  </>,
);
