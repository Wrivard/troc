import { useState } from "react";
import type { Product, Variant, Locale } from "@workspace/catalog";
import { CardImage } from "@workspace/troc-design-system/components/ui/product-presentation";
import { Button } from "@workspace/troc-design-system/components/ui/button";
import { imagesForVariant } from "./images";
export function CatalogArtwork({
  product,
  variant,
  locale,
  gallery = false,
}: {
  product: Product;
  variant?: Variant;
  locale: Locale;
  gallery?: boolean;
}) {
  const images = imagesForVariant(product, variant);
  const [index, setIndex] = useState(0);
  const image = images[index] ?? images[0];
  const side = (value: string) =>
    locale === "fr"
      ? ({ front: "Recto", back: "Verso", detail: "Détail" }[value] ?? value)
      : ({ front: "Front", back: "Back", detail: "Detail" }[value] ?? value);
  const label = image
    ? product.name[locale] + " — " + side(image.side)
    : product.name[locale];
  return (
    <div className="grid gap-3" data-catalog-artwork>
      <CardImage
        key={image?.id ?? "missing"}
        src={image?.url ?? product.imageUrl}
        srcSet={image?.sources
          .map((s) => s.url + " " + s.width + "w")
          .join(", ")}
        sizes={
          gallery
            ? "(min-width: 768px) 380px, 90vw"
            : "(min-width: 1280px) 280px, (min-width: 768px) 30vw, 45vw"
        }
        width={image?.width}
        height={image?.height}
        eager={gallery}
        alt={label}
        missingLabel={
          locale === "fr" ? "Visuel à venir" : "Artwork coming soon"
        }
      />
      {gallery && (
        <>
          {images.length > 1 && (
            <div className="flex flex-wrap gap-2">
              {images.map((entry, i) => (
                <Button
                  key={entry.id}
                  size="sm"
                  variant={index === i ? "primary" : "secondary"}
                  aria-pressed={index === i}
                  onClick={() => setIndex(i)}
                >
                  {side(entry.side)}{" "}
                  {images.filter((x) => x.side === entry.side).length > 1
                    ? i + 1
                    : ""}
                </Button>
              ))}
            </div>
          )}
          {image && (
            <>
              <a
                className="text-sm underline"
                href={image.url}
                target="_blank"
                rel="noreferrer"
              >
                {locale === "fr" ? "Voir le visuel complet" : "View full image"}
              </a>
              <p className="text-xs text-muted-foreground">
                {locale === "fr" ? "Visuel" : "Artwork"}:{" "}
                {image.provenance.provider}
              </p>
            </>
          )}
        </>
      )}
    </div>
  );
}
