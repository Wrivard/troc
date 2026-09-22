import type { CatalogProvider } from "../providers/contracts";
import type { ImportRecord } from "@workspace/catalog";
import { sampleProducts, sampleSets } from "./sample/data";
/** Normalized cached sample -> existing authorized importer. Never calls external APIs. */
export class BoundedSampleCatalogProvider implements CatalogProvider {
  constructor(readonly id: "tcgdex" | "scryfall" | "ygoprodeck") {}
  async records({ cursor, limit }: { cursor?: string; limit: number }) {
    const offset = Number(cursor ?? 0);
    if (
      !Number.isSafeInteger(offset) ||
      offset < 0 ||
      !Number.isInteger(limit) ||
      limit < 1 ||
      limit > 200
    )
      throw new Error("invalid_page");
    const items: ImportRecord[] = sampleProducts
      .filter((p) => p.images?.[0]?.provenance.provider === this.id)
      .flatMap((p) =>
        p.variants.map((v) => {
          const set = sampleSets.find((s) => s.id === p.setId)!;
          const image = p.images![0];
          const game = {
            tcgdex: { key: "pokemon", name: { en: "Pokémon", fr: "Pokémon" } },
            scryfall: {
              key: "magic",
              name: { en: "Magic: The Gathering", fr: "Magic: The Gathering" },
            },
            ygoprodeck: {
              key: "yu-gi-oh",
              name: { en: "Yu-Gi-Oh!", fr: "Yu-Gi-Oh!" },
            },
          }[this.id];
          return {
            externalId:
              image.provenance.externalId + ":" + v.language + ":" + v.key,
            game,
            set: { key: set.slug, name: set.name, releasedOn: set.releasedOn },
            product: {
              key: image.provenance.externalId,
              name: p.name,
              type: p.type,
              aliases: p.aliases,
            },
            printing: {
              key: v.language,
              language: v.language,
              number: v.number,
              rarity: v.rarity,
              artist: v.artist,
            },
            variant: { key: v.key, attributes: v.attributes },
            image: null,
            images: (v.images ?? []).map((i, n) => ({
              externalId: image.provenance.externalId + ":" + n,
              side: i.side,
              scope: "variant" as const,
              sourceUrl: i.provenance.sourceUrl,
              license: i.provenance.license,
              width: i.width!,
              height: i.height!,
              sources: i.sources,
            })),
          };
        }),
      );
    return {
      items: items.slice(offset, offset + limit),
      nextCursor:
        offset + limit < items.length ? String(offset + limit) : undefined,
    };
  }
}
