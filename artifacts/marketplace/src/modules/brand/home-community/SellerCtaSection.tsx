import { EditorialIcon } from "@workspace/troc-design-system/components/ui/editorial";
import artwork from "./assets/troc-card-saver.png";
import "./seller-cta.css";
export function SellerCtaSection({
  locale,
  href,
  demo,
}: {
  locale: "en" | "fr";
  href: (path: string) => string;
  demo: boolean;
}) {
  const c = (en: string, fr: string) => (locale === "fr" ? fr : en);
  return (
    <section
      className="troc-hc troc-hc-cta"
      aria-labelledby="troc-hc-cta-title"
    >
      <div className="troc-hc-cta-copy">
        <p className="troc-hc-eyebrow">
          {c("BUILD TROC WITH US", "BÂTISSONS TROC ENSEMBLE")}
        </p>
        <h2 id="troc-hc-cta-title">
          {c("Your cards. Your store.", "Vos cartes. Votre boutique.")}
          <br />
          <span>{c("On TROC.", "Sur TROC.")}</span>
        </h2>
        <p className="troc-hc-cta-description">
          {c(
            "A shared catalog. Prices in CAD. Combined shipping. Our goal: welcome 250 founding sellers to help build Canada’s card marketplace.",
            "Un catalogue commun. Des prix en CAD. La livraison regroupée. Notre objectif : accueillir 250 vendeurs fondateurs pour bâtir le marché canadien des cartes.",
          )}
        </p>
        <div className="troc-hc-cta-actions">
          <a className="troc-hc-cta-primary" href={href("/founding-sellers")}>
            {c("Become a founding seller", "Devenir vendeur fondateur")}
            <EditorialIcon name="arrow" />
          </a>
          <a className="troc-hc-cta-secondary" href={href("/sell")}>
            {c("Explore selling on TROC", "Découvrir la vente sur TROC")}
            <EditorialIcon name="arrow" />
          </a>
        </div>
        <ul className="troc-hc-cta-values">
          <li>
            <EditorialIcon name="store" />
            {c("Early seller community", "Communauté de vendeurs pionniers")}
          </li>
          <li>
            <EditorialIcon name="globe" />
            {c("Built in Canada", "Créé au Canada")}
          </li>
          <li>
            <EditorialIcon name="layers" />
            {c("Grow together", "Grandir ensemble")}
          </li>
        </ul>
      </div>
      <img
        className="troc-hc-cta-art"
        src={artwork}
        alt=""
        width={1254}
        height={1254}
        loading="lazy"
      />
      {demo && (
        <p className="troc-hc-cta-disclaimer">
          {c(
            "Demo marketplace: build a cart and compare shipping. Sign in for simulated checkout. No real charge.",
            "Marché de démonstration : créez un panier et comparez la livraison. Connectez-vous pour un paiement simulé. Aucun débit réel.",
          )}
        </p>
      )}
    </section>
  );
}
