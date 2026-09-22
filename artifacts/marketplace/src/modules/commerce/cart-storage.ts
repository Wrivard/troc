import type { CartLine } from "@workspace/commerce";
import { trackCommerce } from "./analytics";
const key = "troc.cart.v1";
export function readCart(): CartLine[] {
  try {
    const value: unknown = JSON.parse(localStorage.getItem(key) ?? "[]");
    return Array.isArray(value)
      ? value
          .filter(
            (v): v is CartLine =>
              !!v &&
              typeof v.listingId === "string" &&
              Number.isInteger(v.quantity) &&
              v.quantity > 0 &&
              v.quantity <= 100,
          )
          .slice(0, 100)
      : [];
  } catch {
    return [];
  }
}
export function writeCart(lines: CartLine[], trackChanges = false) {
  const before = readCart().reduce((n, l) => n + l.quantity, 0),
    after = lines.reduce((n, l) => n + l.quantity, 0);
  localStorage.setItem(key, JSON.stringify(lines));
  window.dispatchEvent(new Event("troc:cart"));
  if (trackChanges && after !== before)
    trackCommerce(after >= before ? "add_to_cart" : "remove_from_cart", {
      quantity: Math.abs(after - before),
      cards: after,
    });
}
export function addCart(listingId: string, quantity: number) {
  const lines = readCart();
  const old = lines.find((l) => l.listingId === listingId);
  if (old) old.quantity = Math.min(100, old.quantity + quantity);
  else lines.push({ listingId, quantity });
  if (lines.length > 100) throw new Error("cart_too_large");
  writeCart(lines, true);
}
