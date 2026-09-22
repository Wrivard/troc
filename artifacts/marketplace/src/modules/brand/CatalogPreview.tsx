import { useEffect, useState } from "react";
import type { PublicPage, Locale } from "@workspace/catalog";
import { CatalogArtwork } from "../catalog/CatalogArtwork";
import { StoreHero } from "@workspace/troc-design-system/components/ui/marketplace-compositions";
import { SellerAvatar } from "@workspace/troc-design-system/components/ui/seller-storefront";
import { Button } from "@workspace/troc-design-system/components/ui/button";
import { EditorialIcon } from "@workspace/troc-design-system/components/ui/editorial";
/** Existing bounded demo catalog only. This does not create collection or seller state. */
export function CatalogPreview({
  locale,
  kind,
}: {
  locale: Locale;
  kind: "binder" | "store";
}) {
  const [page, setPage] = useState<PublicPage | null>(null);
  const fr = locale === "fr";
  useEffect(() => {
    const controller = new AbortController();
    fetch(
      `/api/catalog/page?path=${encodeURIComponent("/games/pokemon")}&lang=${locale}`,
      { signal: controller.signal },
    )
      .then((r) => (r.ok ? r.json() : null))
      .then(setPage)
      .catch(() => {});
    return () => controller.abort();
  }, [locale]);
  const products =
    page?.results.filter((r) => r.product.images?.length).slice(0, 4) ?? [];
  const art = (i: number) =>
    products[i] ? (
      <CatalogArtwork
        product={products[i].product}
        variant={products[i].product.variants[0]}
        locale={locale}
      />
    ) : (
      <span className="troc-card-back">
        <EditorialIcon name="layers" />
      </span>
    );
  if (kind === "store") {
    const seller = page?.sellers[0];
    return (
      <div className="troc-seller-landing-preview">
        <StoreHero
          level={2}
          name={seller?.name ?? "TROC"}
          eyebrow={
            fr ? "APERÇU DE BOUTIQUE · DÉMO" : "STOREFRONT PREVIEW · DEMO"
          }
          location={seller ? `${seller.city}, ${seller.province}` : "Canada"}
          avatar={<SellerAvatar name={seller?.name ?? "TROC"} />}
          banner={
            <div className="troc-store-cover-cards">
              {[0, 1, 2].map((i) => (
                <div key={i}>{art(i)}</div>
              ))}
            </div>
          }
          details={
            fr
              ? "Vos cartes. Votre identité. Un public canadien."
              : "Your cards. Your identity. A Canadian audience."
          }
        />
        {seller && (
          <a
            className="troc-editorial-text-link"
            href={`/store/${seller.slug}?lang=${locale}`}
          >
            {fr
              ? "Explorer la boutique de démonstration"
              : "Explore the demo store"}
            <EditorialIcon name="arrow" />
          </a>
        )}
      </div>
    );
  }
  return (
    <section className="troc-preview-binder">
      <div className="troc-preview-binder-copy">
        <p className="troc-editorial-eyebrow">
          {fr
            ? "APERÇU ILLUSTRATIF · À VENIR"
            : "ILLUSTRATIVE PREVIEW · PLANNED"}
        </p>
        <h2>Pokémon 151</h2>
        <strong>162 / 207</strong>
        <progress
          value={162}
          max={207}
          aria-label={
            fr
              ? "Progression fictive de la collection"
              : "Illustrative collection progress"
          }
        />
        <p>
          {fr
            ? "78 % dans cet exemple · 45 cartes manquantes"
            : "78% in this example · 45 cards missing"}
        </p>
        <Button disabled variant="secondary">
          {fr
            ? "Trouver les cartes manquantes · à venir"
            : "Find missing cards · planned"}
        </Button>
        <p className="text-sm">
          {fr
            ? "Exemple visuel uniquement. Aucune carte possédée ni progression n’est enregistrée."
            : "Visual example only. No ownership or collection progress is recorded."}
        </p>
      </div>
      <div className="troc-preview-binder-grid" aria-hidden="true">
        {[0, 1, 2, 3].map((i) => (
          <div key={i}>{art(i)}</div>
        ))}
        <span className="troc-card-back" />
        <span className="troc-card-back" />
      </div>
    </section>
  );
}
