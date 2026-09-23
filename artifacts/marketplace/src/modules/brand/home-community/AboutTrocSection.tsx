import type { ReactNode } from "react";
import { EditorialIcon } from "@workspace/troc-design-system/components/ui/editorial";
import "./about-troc.css";

function AboutFeatures({
  items,
}: {
  items: { id: string; icon: ReactNode; title: string; description: string }[];
}) {
  return (
    <div className="troc-hc-about-features">
      {items.map((item) => (
        <article key={item.id}>
          <span className="troc-hc-feature-icon">{item.icon}</span>
          <h3>{item.title}</h3>
          <p>{item.description}</p>
        </article>
      ))}
    </div>
  );
}

export function AboutTrocSection({
  locale,
  href,
}: {
  locale: "en" | "fr";
  href: (path: string) => string;
}) {
  const c = (en: string, fr: string) => (locale === "fr" ? fr : en);
  return (
    <section
      className="troc-hc troc-hc-about"
      aria-labelledby="troc-hc-about-title"
    >
      <div className="troc-hc-about-story">
        <p className="troc-hc-eyebrow">{c("ABOUT TROC", "À PROPOS DE TROC")}</p>
        <h2 id="troc-hc-about-title">
          {c(
            "A home for the way we collect.",
            "Une place pour notre façon de collectionner.",
          )}
        </h2>
        <p>
          {c(
            "TROC starts with a simple idea: finding a card in Canada should make sense for the whole order, even when the card costs just a few cents.",
            "TROC part d’une idée simple : trouver une carte au Canada devrait avoir du sens pour la commande entière, même quand la carte ne coûte que quelques sous.",
          )}
        </p>
        <p>
          {c(
            "We’re building a marketplace that brings collectors, independent sellers and local shops together around the details that matter: the right card, a clear price and the cost of getting it home.",
            "Nous bâtissons un marché qui réunit collectionneurs, vendeurs indépendants et boutiques autour de l’essentiel : la bonne carte, un prix clair et le coût pour la recevoir.",
          )}
        </p>
        <a className="troc-hc-text-link" href={href("/about")}>
          {c("Discover the idea behind TROC", "Découvrir l’idée derrière TROC")}
          <EditorialIcon name="arrow" />
        </a>
      </div>
      <AboutFeatures
        items={[
          {
            id: "canada",
            icon: <EditorialIcon name="globe" />,
            title: c("Canada-first", "Pensé pour le Canada"),
            description: c(
              "A Canadian starting point for a worldwide hobby. Find offers from sellers here, with shipping and seller minimums visible before you decide.",
              "Un point de départ canadien pour une passion mondiale. Retrouvez des offres de vendeurs d’ici, avec la livraison et les minimums visibles avant de choisir.",
            ),
          },
          {
            id: "cad",
            icon: <EditorialIcon name="coin" />,
            title: c("All in CAD", "Tout en CAD"),
            description: c(
              "Compare in the currency you use. Card prices and order estimates are shown in Canadian dollars, so the complete cost is easier to understand.",
              "Comparez dans votre devise. Les prix des cartes et les estimations de commande sont en dollars canadiens, pour mieux comprendre le coût complet.",
            ),
          },
          {
            id: "languages",
            icon: <EditorialIcon name="language" />,
            title: c("English & français", "Français & English"),
            description: c(
              "Choose the language that feels natural, from discovering cards to reviewing your basket. Card language stays a separate choice, because the printing matters too.",
              "Choisissez la langue qui vous convient, de la découverte au panier. La langue de la carte reste un choix distinct : l’impression compte aussi.",
            ),
          },
          {
            id: "singles",
            icon: <EditorialIcon name="layers" />,
            title: c("Every single matters", "Chaque carte compte"),
            description: c(
              "The common that completes a set deserves a place beside the chase card. TROC is built around buying several cards and combining shipping from the same seller.",
              "La commune qui complète une extension a sa place à côté de la carte convoitée. TROC est pensé pour acheter plusieurs cartes et regrouper la livraison d’un même vendeur.",
            ),
          },
        ]}
      />
    </section>
  );
}
