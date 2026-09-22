import { useState } from "react";
import { SellerOfferRow } from "../../components/ui/seller-offer";
import { PriceBlock } from "../../components/ui/price";
import { SellerBadge } from "../../components/ui/seller-badges";
import { ConditionBadge } from "../../components/ui/marketplace-badges";
import { PromotionBadge } from "../../components/ui/promotion";
import { usePreferences } from "../../hooks/use-preferences";
import { useMarketCardMessages } from "../../lib/messages-market-cards";
import { DemoPanel, Guidelines, PageHeader, Section, Stack } from "../parts";

export default function SellerOfferDemo() {
  const { locale } = usePreferences();
  const { ts } = useMarketCardMessages();
  const [added, setAdded] = useState<string | null>(null);
  // Local simulated pending state — no real cart, network, or transaction.
  const [pending, setPending] = useState(false);

  const simulateAdd = (id: string) => {
    setAdded(null);
    setPending(true);
    window.setTimeout(() => {
      setPending(false);
      setAdded(id);
    }, 1400);
  };

  const common = {
    quantityLabel: ts("soQuantityLabel"),
    quantityDecrementLabel: ts("soDecrement"),
    quantityIncrementLabel: ts("soIncrement"),
    addToCartLabel: ts("soAddToCart"),
    ratingLabel: ts("soRatingLabel"),
    locale,
  };

  return (
    <>
      <PageHeader eyebrow={ts("eyebrow")} title={ts("soTitle")} description={ts("soIntro")} />

      <Section title={ts("soDefault")}>
        <DemoPanel>
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            <SellerOfferRow
              {...common}
              sellerName={ts("soSellerName")}
              verification={<SellerBadge kind="verified-seller" label={ts("soVerified")} size="compact" />}
              ratingValue={4.8}
              ratingCount={1240}
              condition={<ConditionBadge condition="NM" label={ts("soConditionNM")} size="compact" />}
              price={<PriceBlock amount={18.4} locale={locale} label={ts("soPriceLabel")} />}
              shipping={ts("soShipping")}
              promotion={<PromotionBadge state="active" label={ts("soPromotion")} />}
              defaultQuantity={1}
              loading={pending}
              loadingLabel={ts("soAddingLabel")}
              onAddToCart={() => simulateAdd("a")}
            />
            <SellerOfferRow
              {...common}
              sellerName={ts("soSellerName2")}
              verification={<SellerBadge kind="verified-hobby-shop" label={ts("soHobbyShop")} size="compact" />}
              ratingValue={4.6}
              ratingCount={318}
              condition={<ConditionBadge condition="LP" label={ts("soConditionLP")} size="compact" />}
              price={<PriceBlock amount={17.25} locale={locale} label={ts("soPriceLabel")} />}
              shipping={ts("soShippingFree")}
              defaultQuantity={2}
              onAddToCart={() => setAdded("b")}
            />
          </div>
          {pending ? (
            <p className="ds-helper" role="status" style={{ marginTop: 12 }}>{ts("soAddingLabel")}</p>
          ) : added ? (
            <p className="ds-helper" role="status" style={{ marginTop: 12 }}>{ts("soAddedToast")}</p>
          ) : null}
          <p className="ds-helper" style={{ marginTop: 8 }}>{ts("demoOnly")}</p>
        </DemoPanel>
      </Section>

      <Section title={ts("states")}>
        <DemoPanel>
          <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
            <Stack label={ts("soSelected")}>
              <SellerOfferRow
                {...common}
                selected
                sellerName={ts("soSellerName3")}
                verification={<SellerBadge kind="top-seller" label={ts("soTopSeller")} size="compact" />}
                ratingValue={4.9}
                ratingCount={2040}
                condition={<ConditionBadge condition="NM" label={ts("soConditionNM")} size="compact" />}
                price={<PriceBlock amount={19.0} locale={locale} label={ts("soPriceLabel")} />}
                shipping={ts("soShipping")}
                promotion={<PromotionBadge state="eligible" label={ts("soPromotion")} />}
                onAddToCart={() => setAdded("c")}
              />
            </Stack>
            <Stack label={ts("soUnavailable")}>
              <SellerOfferRow
                {...common}
                unavailable
                unavailableLabel={ts("soUnavailable")}
                sellerName={ts("soSellerName")}
                verification={<SellerBadge kind="verified-seller" label={ts("soVerified")} size="compact" />}
                ratingValue={4.8}
                ratingCount={1240}
                condition={<ConditionBadge condition="NM" label={ts("soConditionNM")} size="compact" />}
                price={<PriceBlock amount={null} locale={locale} label={ts("soPriceLabel")} unavailableLabel={ts("soUnavailable")} />}
                shipping={ts("soShipping")}
              />
            </Stack>
            <Stack label={ts("soPending")}>
              <SellerOfferRow
                {...common}
                loading
                loadingLabel={ts("soAddingLabel")}
                sellerName={ts("soSellerName")}
                verification={<SellerBadge kind="verified-seller" label={ts("soVerified")} size="compact" />}
                ratingValue={4.8}
                ratingCount={1240}
                condition={<ConditionBadge condition="NM" label={ts("soConditionNM")} size="compact" />}
                price={<PriceBlock amount={18.4} locale={locale} label={ts("soPriceLabel")} />}
                shipping={ts("soShipping")}
                promotion={<PromotionBadge state="active" label={ts("soPromotion")} />}
              />
            </Stack>
            <Stack label={ts("soDisabled")}>
              <SellerOfferRow
                {...common}
                disabled
                sellerName={ts("soSellerName2")}
                verification={<SellerBadge kind="verified-hobby-shop" label={ts("soHobbyShop")} size="compact" />}
                ratingValue={null}
                ratingLabel={ts("soRatingLabel")}
                condition={<ConditionBadge condition="NM" label={ts("soConditionNM")} size="compact" />}
                price={<PriceBlock amount={17.25} locale={locale} label={ts("soPriceLabel")} />}
                shipping={ts("soShippingFree")}
              />
            </Stack>
          </div>
          <p className="ds-helper" style={{ marginTop: 12 }}>{ts("soStackedNote")}</p>
        </DemoPanel>
      </Section>

      <Guidelines items={[{ kind: "do", text: ts("soDo") }, { kind: "dont", text: ts("soDont") }]} />
    </>
  );
}
