import { useEffect, useState } from "react";
import { Button } from "@workspace/troc-design-system/components/ui/button";
import { SellPageDetails, type SellerFeePresentation } from "./SellPageDetails";
export default function LiveSellDetails({ locale }: { locale: "en" | "fr" }) {
  const [fees, setFees] = useState<SellerFeePresentation | null>(null),
    [error, setError] = useState(false),
    [retry, setRetry] = useState(0);
  useEffect(() => {
    const controller = new AbortController();
    setError(false);
    setFees(null);
    fetch(import.meta.env.BASE_URL + "api/public/seller-fees", {
      signal: AbortSignal.any([controller.signal, AbortSignal.timeout(10000)]),
    })
      .then(async (r) => {
        if (!r.ok) throw Error();
        const value = await r.json();
        if (
          value?.mode !== "demo" ||
          ![
            "commissionBps",
            "shippingCommissionBps",
            "promotedBps",
            "processingBps",
            "processingFixedCents",
          ].every(
            (k) =>
              Number.isSafeInteger(value[k]) &&
              value[k] >= 0 &&
              value[k] <= 10000,
          )
        )
          throw Error();
        if (!controller.signal.aborted) setFees(value);
      })
      .catch(() => {
        if (!controller.signal.aborted) setError(true);
      });
    return () => controller.abort();
  }, [retry]);
  const href = (path: string) =>
    import.meta.env.BASE_URL.replace(/\/$/, "") + path + "?lang=" + locale;
  if (!fees)
    return (
      <section
        aria-label={locale === "fr" ? "Détails vendeur" : "Seller details"}
      >
        <p role="status">
          {error
            ? locale === "fr"
              ? "Les détails des frais sont temporairement indisponibles."
              : "Fee details are temporarily unavailable."
            : locale === "fr"
              ? "Chargement des détails vendeur…"
              : "Loading seller details…"}
        </p>
        {error && (
          <Button variant="secondary" onClick={() => setRetry((n) => n + 1)}>
            {locale === "fr" ? "Réessayer" : "Try again"}
          </Button>
        )}{" "}
        <Button asChild>
          <a href={href("/founding-sellers")}>
            {locale === "fr" ? "Découvrir le programme" : "Explore the program"}
          </a>
        </Button>
      </section>
    );
  return (
    <SellPageDetails
      locale={locale}
      fees={fees}
      foundingHref={href("/founding-sellers")}
      smartCartHref={href("/smart-cart")}
    />
  );
}
