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
  const identity =
    seller.demo && Object.hasOwn(branding, seller.id)
      ? branding[seller.id]
      : undefined;
  if (!identity) return seller;
  const assets = `${import.meta.env.BASE_URL}demo-store-branding/${identity.asset}`;
  return {
    ...seller,
    name: identity.name,
    logoUrl: `${assets}-avatar.webp`,
    bannerUrl: `${assets}-cover.webp`,
  };
}

/** Display-only crop positions, scoped to the approved demo identities. */
export function demoStoreFocalPoint(seller: Seller): string {
  if (!seller.demo || !Object.hasOwn(branding, seller.id)) return "50% 50%";
  return branding[seller.id].asset === "cardforge" ? "50% 0%" : "50% 50%";
}

/** Quote display only: never infer a real or mixed seller group from cart-level demo status. */
export function commerceSellerName(group: {
  seller: { id: string; name: string };
  lines: readonly { listing: { demo: boolean } }[];
}): string {
  return group.lines.length > 0 &&
    group.lines.every((line) => line.listing.demo === true) &&
    Object.hasOwn(branding, group.seller.id)
    ? branding[group.seller.id].name
    : group.seller.name;
}
