import { useState } from "react";
import { RotateCcw } from "lucide-react";
import { CartItem, CartSellerGroup } from "../../components/ui/cart-seller-group";
import { CardImage, CardMetadata } from "../../components/ui/product-presentation";
import { PriceBlock, formatCad } from "../../components/ui/price";
import { SellerMinimumProgress, PromotionProgress } from "../../components/ui/marketplace-progress";
import { PromotionBadge } from "../../components/ui/promotion";
import { SellerBadge } from "../../components/ui/seller-badges";
import { SellerAvatar } from "../../components/ui/seller-storefront";
import { Button } from "../../components/ui/button";
import { usePreferences } from "../../hooks/use-preferences";
import { useCartMessages } from "../../lib/messages-cart";
import { DemoPanel, Guidelines, PageHeader, Section } from "../parts";

type Line = { id: string; title: string; meta: string; unit: number; qty: number; img?: string };

const SELLER_MINIMUM = 5;
const PROMO_TARGET = 5;
const COMBINED_SHIPPING = 3.99;

export default function CartSellerGroupDemo() {
  const { locale } = usePreferences();
  const { tc } = useCartMessages();

  const initial: Line[] = [
    { id: "charizard", title: tc("cardCharizard"), meta: tc("cardCharizardMeta"), unit: 1.42, qty: 1 },
    { id: "pikachu", title: tc("cardPikachu"), meta: tc("cardPikachuMeta"), unit: 0.99, qty: 1 },
    { id: "common", title: tc("cardCommon"), meta: tc("cardCommonMeta"), unit: 0.06, qty: 1 },
  ];
  const [lines, setLines] = useState<Line[]>(initial);

  const setQty = (id: string, qty: number) =>
    setLines((rows) => rows.map((r) => (r.id === id ? { ...r, qty } : r)));
  const remove = (id: string) => setLines((rows) => rows.filter((r) => r.id !== id));
  const reset = () => setLines(initial.map((r) => ({ ...r })));

  const subtotal = lines.reduce((sum, r) => sum + r.unit * r.qty, 0);
  const cardCount = lines.reduce((sum, r) => sum + r.qty, 0);

  return (
    <>
      <PageHeader eyebrow={tc("eyebrow")} title={tc("cartTitle")} description={tc("cartIntro")} />

      <Section title={tc("cartInteractiveTitle")} description={tc("cartInteractiveHelp")}>
        <DemoPanel>
          <div style={{ display: "flex", justifyContent: "flex-end", marginBottom: 12 }}>
            <Button variant="ghost" size="sm" onClick={reset}>
              <RotateCcw aria-hidden="true" /> {tc("reset")}
            </Button>
          </div>

          {lines.length === 0 ? (
            <p className="ds-helper">{tc("emptyCart")}</p>
          ) : (
            <CartSellerGroup
              sellerName={tc("sellerName")}
              sellerMeta={
                <>
                  <SellerAvatar name={tc("sellerName")} size="sm" />
                  <SellerBadge kind="verified-seller" label={tc("verifiedSeller")} size="compact" />
                </>
              }
              promotion={<PromotionBadge label={tc("promoBadge")} state={cardCount >= PROMO_TARGET ? "active" : "locked"} />}
              minimumProgress={
                <SellerMinimumProgress
                  label={tc("sellerMinimumLabel")}
                  locale={locale}
                  current={subtotal}
                  minimum={SELLER_MINIMUM}
                  remainingLabel={(_, remainingText) =>
                    locale === "en"
                      ? `Add ${remainingText} more from this seller`
                      : `Ajoutez ${remainingText} de plus chez ce vendeur`
                  }
                  reachedLabel={tc("sellerMinReached")}
                />
              }
              promotionProgress={
                <PromotionProgress
                  label={tc("promotionLabel")}
                  current={cardCount}
                  target={PROMO_TARGET}
                  valueLabel={(current, target) => (locale === "en" ? `${current} / ${target} cards` : `${current} / ${target} cartes`)}
                  remainingLabel={(remaining) =>
                    locale === "en"
                      ? `Add ${remaining} more cards to unlock 10% off`
                      : `Ajoutez ${remaining} cartes pour obtenir 10 % de rabais`
                  }
                  reachedLabel={tc("promoReached")}
                />
              }
              shippingLabel={tc("combinedShipping")}
              subtotalLabel={tc("sellerSubtotal")}
              subtotal={<PriceBlock amount={subtotal} locale={locale} size="default" />}
            >
              {lines.map((row) => (
                <CartItem
                  key={row.id}
                  image={<CardImage alt={row.title} missingLabel={tc("imageMissing")} />}
                  title={row.title}
                  metadata={<CardMetadata items={[row.meta]} />}
                  unitPrice={<PriceBlock amount={row.unit} locale={locale} size="sm" label={tc("unitPriceLabel")} />}
                  lineTotal={formatCad(row.unit * row.qty, locale)}
                  quantity={row.qty}
                  onQuantityChange={(v) => setQty(row.id, v)}
                  onRemove={() => remove(row.id)}
                  quantityLabel={`${tc("quantityLabel")} · ${row.title}`}
                  decrementLabel={tc("decrement")}
                  incrementLabel={tc("increment")}
                  removeLabel={`${tc("removeItem")} · ${row.title}`}
                  min={1}
                />
              ))}
            </CartSellerGroup>
          )}
          <p className="ds-helper" style={{ marginTop: 12 }}>{tc("demoOnly")}</p>
        </DemoPanel>
      </Section>

      <Section title={tc("states")}>
        <DemoPanel>
          <CartSellerGroup
            loading
            loadingLabel={tc("loading")}
            sellerName={tc("sellerName")}
            shippingLabel={tc("combinedShipping")}
          >
            <CartItem
              unavailable
              unavailableLabel={tc("itemUnavailable")}
              image={<CardImage alt={tc("cardCommon")} missingLabel={tc("imageMissing")} />}
              title={tc("cardCommon")}
              metadata={<CardMetadata items={[tc("cardCommonMeta")]} />}
              unitPrice={<PriceBlock amount={0.06} locale={locale} size="sm" label={tc("unitPriceLabel")} />}
              lineTotal={formatCad(0.06, locale)}
              quantity={1}
              quantityLabel={tc("quantityLabel")}
              decrementLabel={tc("decrement")}
              incrementLabel={tc("increment")}
              removeLabel={tc("removeItem")}
            />
          </CartSellerGroup>
        </DemoPanel>
      </Section>

      <Guidelines items={[{ kind: "do", text: tc("cartDo") }, { kind: "dont", text: tc("cartDont") }]} />
    </>
  );
}
