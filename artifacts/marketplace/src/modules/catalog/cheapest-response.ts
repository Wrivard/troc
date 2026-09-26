import type { CheapestOffer } from "@workspace/catalog";
const record = (value: unknown): value is Record<string, unknown> =>
  !!value && typeof value === "object" && !Array.isArray(value);
const id = (value: unknown) =>
  typeof value === "string" &&
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(value);
/** Validate every field consumed by the purchase/storage/feedback boundary; TypeScript alone cannot validate JSON. */
export function validateCheapestResponse(
  value: unknown,
  variantId: string | null,
): asserts value is CheapestOffer {
  if (!record(value) || !variantId || value.variantId !== variantId)
    throw new Error("invalid_offer");
  if (value.offer === null && value.seller === null) return;
  const offer = value.offer,
    seller = value.seller;
  if (
    !record(offer) ||
    !record(seller) ||
    !id(offer.id) ||
    !id(offer.sellerId) ||
    seller.id !== offer.sellerId ||
    offer.variantId !== variantId ||
    !Number.isSafeInteger(offer.quantity) ||
    Number(offer.quantity) <= 0 ||
    !Number.isSafeInteger(offer.cents) ||
    Number(offer.cents) < 0 ||
    typeof seller.name !== "string" ||
    !seller.name.trim() ||
    seller.name.length > 200 ||
    typeof seller.demo !== "boolean" ||
    typeof offer.demo !== "boolean"
  )
    throw new Error("invalid_offer");
}
