import type { Seller } from "@workspace/catalog";

// Explicit demo-only display assignment approved in ACTIVE-OWNERSHIP.md.
// Canonical seller IDs, slugs and every commerce field remain unchanged.
const branding: Record<string, { name: string; asset: string }> = {
  "00000000-0000-4000-8006-000000000000": {
    name: "Card Forge TCG",
    asset: "cardforge",
  },
  "00000000-0000-4000-8006-000000000001": {
    name: "Piko Trading Cards",
    asset: "pikocards",
  },
  "00000000-0000-4000-8006-000000000002": {
    name: "The Playground",
    asset: "theplayground",
  },
};
export function demoStoreBranding(seller: Seller): Seller {
  const identity = seller.demo ? branding[seller.id] : undefined;
  if (!identity) return seller;
  const assets = `${import.meta.env.BASE_URL}demo-store-branding/${identity.asset}`;
  return {
    ...seller,
    name: identity.name,
    logoUrl: `${assets}-avatar.webp`,
    bannerUrl: `${assets}-cover.webp`,
  };
}
