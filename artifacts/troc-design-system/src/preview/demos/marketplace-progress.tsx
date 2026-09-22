import { useState } from "react";
import { Minus, Plus, RotateCcw } from "lucide-react";
import { Button } from "../../components/ui/button";
import { FreeShippingProgress, PromotionProgress, SellerMinimumProgress } from "../../components/ui/marketplace-progress";
import { formatCad } from "../../components/ui/price";
import { usePreferences } from "../../hooks/use-preferences";
import { useMarketEconomicsMessages } from "../../lib/messages-market-economics";
import { DemoPanel, Guidelines, PageHeader, Section, Stack } from "../parts";

const CARD_PRICE = 1.19;
const SELLER_MIN = 5;
const FREE_SHIP = 50;
const PROMO_TARGET = 5;

export default function MarketplaceProgressDemo() {
  const { locale } = usePreferences();
  const { tm } = useMarketEconomicsMessages();
  const [cards, setCards] = useState(2);

  const subtotal = cards * CARD_PRICE;
  const freeShipSubtotal = 36.5 + subtotal;

  return (
    <>
      <PageHeader eyebrow={tm("eyebrow")} title={tm("marketProgressTitle")} description={tm("marketProgressIntro")} />

      {/* Required exact copy, held as a fixed reference example. */}
      <Section title={tm("sellerMinTitle")}>
        <DemoPanel>
          <SellerMinimumProgress
            label={tm("sellerMinLabel")}
            locale={locale}
            current={1.42}
            minimum={5}
            valueLabel={() => tm("sellerMinRefValue")}
            remainingLabel={() => tm("sellerMinRefRemaining")}
            reachedLabel={tm("sellerMinReachedHelp")}
          />
          <p className="ds-helper" style={{ marginTop: 12 }}>{tm("demoOnly")}</p>
        </DemoPanel>
      </Section>

      {/* Interactive Add-example controls drive zero / in-progress / complete. */}
      <Section title={tm("addExampleTitle")} description={tm("addExampleHelp")}>
        <DemoPanel>
          <div className="troc-market-progress-controls">
            <Button size="sm" variant="secondary" onClick={() => setCards((n) => n + 1)}>
              <Plus aria-hidden="true" /> {tm("addExampleAdd")}
            </Button>
            <Button size="sm" variant="outline" onClick={() => setCards((n) => Math.max(0, n - 1))} disabled={cards === 0}>
              <Minus aria-hidden="true" /> {tm("addExampleRemove")}
            </Button>
            <Button size="sm" variant="ghost" onClick={() => setCards(2)}>
              <RotateCcw aria-hidden="true" /> {tm("addExampleReset")}
            </Button>
            <span className="troc-market-progress-readout">
              {tm("cardsInCart")}: <strong>{cards}</strong> · {tm("cartSubtotal")}: <strong>{formatCad(subtotal, locale)}</strong>
            </span>
          </div>

          <div className="ds-form-grid" style={{ marginTop: 20 }}>
            <Stack label={tm("sellerMinTitle")}>
              <SellerMinimumProgress
                label={tm("sellerMinLabel")}
                locale={locale}
                current={subtotal}
                minimum={SELLER_MIN}
                remainingLabel={(_, remainingText) =>
                  locale === "en"
                    ? `Add ${remainingText} more from this seller`
                    : `Ajoutez ${remainingText} de plus chez ce vendeur`
                }
                reachedLabel={tm("sellerMinReachedHelp")}
              />
            </Stack>
            <Stack label={tm("freeShipTitle")}>
              <FreeShippingProgress
                label={tm("freeShipLabel")}
                locale={locale}
                current={freeShipSubtotal}
                threshold={FREE_SHIP}
                remainingLabel={(_, remainingText) =>
                  locale === "en"
                    ? `Add ${remainingText} for free shipping`
                    : `Ajoutez ${remainingText} pour la livraison gratuite`
                }
                reachedLabel={tm("freeShipReachedHelp")}
              />
            </Stack>
            <Stack label={tm("promoProgressTitle")}>
              <PromotionProgress
                label={tm("promoProgressLabel")}
                current={cards}
                target={PROMO_TARGET}
                valueLabel={(current, target) =>
                  locale === "en" ? `${current} / ${target} cards` : `${current} / ${target} cartes`
                }
                remainingLabel={(remaining) =>
                  locale === "en"
                    ? `Add ${remaining} more cards to unlock 10% off`
                    : `Ajoutez ${remaining} cartes pour obtenir 10 % de rabais`
                }
                reachedLabel={tm("promoProgressReachedHelp")}
              />
            </Stack>
          </div>
        </DemoPanel>
      </Section>

      {/* Explicit zero, complete, and unavailable states. */}
      <Section title={tm("states")}>
        <DemoPanel>
          <div className="ds-form-grid">
            <Stack label={tm("sellerMinZero")}>
              <SellerMinimumProgress
                label={tm("sellerMinLabel")}
                locale={locale}
                current={0}
                minimum={SELLER_MIN}
                remainingLabel={(_, remainingText) =>
                  locale === "en"
                    ? `Add ${remainingText} more from this seller`
                    : `Ajoutez ${remainingText} de plus chez ce vendeur`
                }
                reachedLabel={tm("sellerMinReachedHelp")}
              />
            </Stack>
            <Stack label={tm("sellerMinComplete")}>
              <SellerMinimumProgress
                label={tm("sellerMinLabel")}
                locale={locale}
                current={6.4}
                minimum={SELLER_MIN}
                reachedLabel={tm("sellerMinReachedHelp")}
              />
            </Stack>
            <Stack label={tm("promoProgressReachedHelp")}>
              <PromotionProgress
                label={tm("promoProgressLabel")}
                current={5}
                target={PROMO_TARGET}
                valueLabel={(current, target) =>
                  locale === "en" ? `${current} / ${target} cards` : `${current} / ${target} cartes`
                }
                reachedLabel={tm("promoProgressReachedHelp")}
              />
            </Stack>
            <Stack label={tm("unavailableProgressTitle")}>
              <FreeShippingProgress
                label={tm("unavailableProgressLabel")}
                locale={locale}
                current={0}
                threshold={FREE_SHIP}
                unavailable
                unavailableLabel={tm("unavailableProgressValue")}
                reachedLabel={tm("freeShipReachedHelp")}
              />
            </Stack>
          </div>
          <p className="ds-helper" style={{ marginTop: 16 }}>{tm("demoOnly")}</p>
        </DemoPanel>
      </Section>

      <Guidelines items={[{ kind: "do", text: tm("marketProgressDo") }, { kind: "dont", text: tm("marketProgressDont") }]} />
    </>
  );
}
