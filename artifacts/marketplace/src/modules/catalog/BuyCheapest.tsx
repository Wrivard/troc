import { useEffect, useRef, useState } from "react";
import { validateCheapestResponse } from "./cheapest-response";
import { Button } from "@workspace/troc-design-system/components/ui/button";
import { api } from "../../api";
import { addCart } from "../commerce/cart-storage";
import { demoStoreBranding } from "../brand/demo-store-branding";

export function BuyCheapest({
  path,
  selection,
  locale,
  cartHref,
  available,
}: {
  path: string;
  selection: string;
  locale: "en" | "fr";
  cartHref: string;
  available: boolean;
}) {
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<{
    text: string;
    success: boolean;
  } | null>(null);
  const active = useRef(true),
    pending = useRef(false),
    revision = useRef(0);
  const c = (en: string, fr: string) => (locale === "fr" ? fr : en);
  useEffect(() => {
    active.current = true;
    const changed = () => {
      revision.current++;
    };
    window.addEventListener("troc:cart", changed);
    window.addEventListener("storage", changed);
    return () => {
      active.current = false;
      revision.current++;
      window.removeEventListener("troc:cart", changed);
      window.removeEventListener("storage", changed);
    };
  }, []);
  async function buy() {
    if (pending.current) return;
    pending.current = true;
    setBusy(true);
    setMessage(null);
    const version = revision.current;
    try {
      // Preserve malformed/denied storage rather than silently replacing it with an empty cart.
      const before = localStorage.getItem("troc.cart.v1");
      const cart: unknown = JSON.parse(before ?? "[]");
      const result = await api<unknown>("/catalog/cheapest", "POST", {
        path,
        selection,
        cart,
      });
      if (!active.current) return;
      if (
        version !== revision.current ||
        before !== localStorage.getItem("troc.cart.v1")
      )
        throw new Error("cart_changed");
      validateCheapestResponse(
        result,
        new URLSearchParams(selection).get("variantId"),
      );
      if (result.offer === null || result.seller === null) {
        setMessage({
          success: false,
          text: c(
            "No matching offer can add another card. Review your cart or filters.",
            "Aucune offre correspondante ne permet d’ajouter une carte. Vérifiez le panier ou les filtres.",
          ),
        });
        return;
      }
      const expected = new URLSearchParams(selection).get("variantId");
      if (
        result.variantId !== expected ||
        result.offer.variantId !== expected ||
        !Array.isArray(cart)
      )
        throw new Error("invalid_offer");
      const quantity =
        cart.find((line) => line.listingId === result.offer!.id)?.quantity ?? 0;
      if (
        quantity >= result.offer.quantity ||
        quantity >= 100 ||
        (cart.length >= 100 && quantity === 0)
      )
        throw new Error("unavailable_offer");
      addCart(result.offer.id, 1);
      const seller = demoStoreBranding(result.seller);
      const price = new Intl.NumberFormat(locale + "-CA", {
        style: "currency",
        currency: "CAD",
      }).format(result.offer.cents / 100);
      setMessage({
        success: true,
        text:
          c("Added 1 from ", "1 ajouté chez ") +
          seller.name +
          " · " +
          price +
          c(" before shipping.", " hors livraison."),
      });
    } catch {
      if (active.current)
        setMessage({
          success: false,
          text: c(
            "Could not add a card. Your cart may have changed or availability could not be checked. Try again.",
            "Impossible d’ajouter la carte. Le panier a peut-être changé ou la disponibilité n’a pas pu être vérifiée. Réessayez.",
          ),
        });
    } finally {
      pending.current = false;
      if (active.current) setBusy(false);
    }
  }
  return (
    <div>
      <Button
        disabled={!available || busy}
        onClick={() => void buy()}
        aria-busy={busy}
      >
        {busy
          ? c("Checking offers…", "Vérification des offres…")
          : c("Buy cheapest", "Acheter au meilleur prix")}
      </Button>
      <p role="status">
        {message?.text}
        {message?.success && (
          <>
            {" "}
            <a className="underline" href={cartHref}>
              {c("View cart", "Voir le panier")}
            </a>
          </>
        )}
      </p>
    </div>
  );
}
