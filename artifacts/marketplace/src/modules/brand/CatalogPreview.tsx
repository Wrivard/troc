import { useEffect, useState } from "react";
import type { PublicPage, Locale } from "@workspace/catalog";
import { demoStoreBranding, demoStoreFocalPoint } from "./demo-store-branding";
import "./sell-store-preview.css";
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
  kind: "binder" | "store" | "want-list";
}) {
  const [page, setPage] = useState<PublicPage | null>(null);
  const [failedBannerUrl, setFailedBannerUrl] = useState<string>();
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
  const previewSet = page?.sets.find((set) => set.name.en === "151");
  const products =
    page?.results
      .filter(
        (r) =>
          r.product.images?.length &&
          (kind !== "binder" || r.product.setId === previewSet?.id),
      )
      .slice(0, 4) ?? [];
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
    const originalSeller = page?.sellers[0];
    const seller = originalSeller
      ? demoStoreBranding(originalSeller)
      : undefined;
    return (
      <div
        className="troc-seller-landing-preview"
        onErrorCapture={(event) => {
          const target = event.target;
          if (
            seller?.bannerUrl &&
            target instanceof HTMLImageElement &&
            target.getAttribute("src") === seller?.bannerUrl
          )
            setFailedBannerUrl(seller.bannerUrl);
        }}
      >
        <StoreHero
          level={2}
          name={seller?.name ?? "TROC"}
          eyebrow={
            fr ? "APERÇU DE BOUTIQUE · DÉMO" : "STOREFRONT PREVIEW · DEMO"
          }
          location={seller ? `${seller.city}, ${seller.province}` : "Canada"}
          avatar={
            <SellerAvatar name={seller?.name ?? "TROC"} src={seller?.logoUrl} />
          }
          bannerSrc={
            seller?.bannerUrl === failedBannerUrl
              ? undefined
              : seller?.bannerUrl
          }
          focalPoint={seller ? demoStoreFocalPoint(seller) : "50% 50%"}
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
  if (kind === "want-list") {
    return (
      <section className="troc-preview-binder">
        <div className="troc-preview-binder-copy">
          <p className="troc-editorial-eyebrow">
            {fr ? "EXEMPLE DE LISTE · À VENIR" : "EXAMPLE WANT LIST · PLANNED"}
          </p>
          <h2>
            {fr
              ? "Les cartes que vous recherchez"
              : "The cards you’re looking for"}
          </h2>
          <p>
            {fr
              ? "Une quantité, une langue, un état et un budget pour chaque carte recherchée."
              : "A quantity, language, condition and budget for each card you want."}
          </p>
          <p>
            {fr
              ? "À venir : comparer les offres compatibles et les vendeurs qui proposent plusieurs cartes de votre liste."
              : "Planned: compare matching offers and sellers carrying several cards on your list."}
          </p>
          <p className="text-sm">
            {fr
              ? "Exemple uniquement. Aucune liste n’est enregistrée et aucune alerte n’est activée."
              : "Example only. No list is saved and no alerts are enabled."}
          </p>
        </div>
        <div className="grid gap-4">
          {products.slice(0, 3).map(({ product }) => (
            <div
              key={product.id}
              className="flex items-center gap-4 border-b border-border pb-4"
            >
              <div className="w-16 shrink-0">
                <CatalogArtwork
                  product={product}
                  variant={product.variants[0]}
                  locale={locale}
                />
              </div>
              <div className="grid gap-1">
                <h3 className="font-semibold">{product.name[locale]}</h3>
                <p className="text-sm text-muted-foreground">
                  {
                    page?.sets.find((set) => set.id === product.setId)?.name[
                      locale
                    ]
                  }{" "}
                  · {product.variants[0]?.number}
                </p>
                <p className="text-sm">
                  {fr
                    ? "1 exemplaire recherché · exemple"
                    : "1 copy wanted · example"}
                </p>
              </div>
            </div>
          ))}
        </div>
      </section>
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
