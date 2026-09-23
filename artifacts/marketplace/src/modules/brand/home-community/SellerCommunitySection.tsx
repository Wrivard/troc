import type { ReactNode, CSSProperties } from "react";
import type { PublicPage, Product } from "@workspace/catalog";
import { EditorialIcon } from "@workspace/troc-design-system/components/ui/editorial";
import { SellerAvatar } from "@workspace/troc-design-system/components/ui/seller-storefront";
import { demoStoreFocalPoint } from "../demo-store-branding";
import "./seller-community.css";

function CommunityIntro({
  eyebrow,
  title,
  description,
}: {
  eyebrow: string;
  title: string;
  description: string;
}) {
  return (
    <header className="troc-hc-community-header">
      <p className="troc-hc-eyebrow">{eyebrow}</p>
      <h2 id="troc-hc-community-title">{title}</h2>
      <p>{description}</p>
    </header>
  );
}
function CommunitySellerCard({
  href,
  name,
  location,
  avatar,
  banner,
  thumbnails,
  typeLabel,
  detail,
  actionLabel,
  focalPoint,
}: {
  href: string;
  name: string;
  location: string;
  avatar: ReactNode;
  banner: ReactNode;
  thumbnails: ReactNode;
  typeLabel: string;
  detail: string;
  actionLabel: string;
  focalPoint: string;
}) {
  return (
    <a
      className="troc-hc-seller"
      href={href}
      aria-label={actionLabel + " — " + name}
    >
      <div
        className="troc-hc-seller-cover"
        style={{ "--hc-store-focal": focalPoint } as CSSProperties}
      >
        <div aria-hidden="true">{banner}</div>
        <span className="troc-hc-seller-location">
          <EditorialIcon name="pin" />
          {location}
        </span>
      </div>
      <div className="troc-hc-seller-body">
        <div className="troc-hc-seller-identity">
          {avatar}
          <div>
            <h3>{name}</h3>
            <p>{typeLabel}</p>
          </div>
        </div>
        <p className="troc-hc-seller-shipping">
          <EditorialIcon name="package" />
          {detail}
        </p>
        <div className="troc-hc-seller-samples" aria-hidden="true">
          {thumbnails}
        </div>
        <span className="troc-hc-seller-action">
          {actionLabel}
          <EditorialIcon name="arrow" />
        </span>
      </div>
    </a>
  );
}
export function SellerCommunitySection({
  page,
  href,
  art,
}: {
  page: Pick<PublicPage, "locale" | "sellers" | "results">;
  href: (path: string) => string;
  art: (product: Product) => ReactNode;
}) {
  const c = (en: string, fr: string) => (page.locale === "fr" ? fr : en);
  const products = page.results.filter((r) => r.product.images?.length);
  return (
    <section
      className="troc-hc troc-hc-community"
      aria-labelledby="troc-hc-community-title"
    >
      <CommunityIntro
        eyebrow={c(
          "THE PEOPLE BEHIND THE CARDS",
          "LES GENS DERRIÈRE LES CARTES",
        )}
        title={c("A hobby is better together.", "La passion se partage.")}
        description={c(
          "Collectors, online sellers and local hobby shops. Different stories. The same love for the cards.",
          "Collectionneurs, vendeurs en ligne et boutiques locales. Des histoires différentes. Le même amour des cartes.",
        )}
      />
      <div className="troc-hc-community-grid">
        {page.sellers.slice(0, 3).map((seller, i) => (
          <CommunitySellerCard
            key={seller.id}
            href={href(`/store/${seller.slug}`)}
            name={seller.name}
            focalPoint={demoStoreFocalPoint(seller)}
            location={`${seller.city}, ${seller.province}`}
            avatar={<SellerAvatar name={seller.name} src={seller.logoUrl} />}
            typeLabel={c("Canadian demo store", "Boutique canadienne fictive")}
            banner={
              seller.bannerUrl ? (
                <img src={seller.bannerUrl} alt="" loading="lazy" />
              ) : (
                products[i] && art(products[i].product)
              )
            }
            thumbnails={products.slice(i, i + 3).map((r) => (
              <div key={r.product.id}>{art(r.product)}</div>
            ))}
            detail={c(
              `Ships in ${seller.handlingDays} ${seller.handlingDays === 1 ? "day" : "days"} · Sample cards`,
              `Expédition en ${seller.handlingDays} ${seller.handlingDays === 1 ? "jour" : "jours"} · Exemples de cartes`,
            )}
            actionLabel={c("Explore store", "Explorer la boutique")}
          />
        ))}
      </div>
      <p className="troc-hc-community-note">
        {c(
          "Illustrative stores. No live seller activity or endorsement is implied.",
          "Boutiques fictives. Aucune activité réelle ni affiliation n’est revendiquée.",
        )}
      </p>
    </section>
  );
}
