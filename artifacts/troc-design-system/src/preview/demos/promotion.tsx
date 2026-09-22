import { Tag } from "lucide-react";
import { PromotionBadge, PromotionCard } from "../../components/ui/promotion";
import { PromotionProgress } from "../../components/ui/marketplace-progress";
import { useMarketEconomicsMessages } from "../../lib/messages-market-economics";
import { DemoPanel, Guidelines, PageHeader, Row, Section, Stack } from "../parts";

export default function PromotionDemo() {
  const { tm } = useMarketEconomicsMessages();

  return (
    <>
      <PageHeader eyebrow={tm("eyebrow")} title={tm("promotionTitle")} description={tm("promotionIntro")} />

      <Section title={tm("promoBadgeTitle")}>
        <DemoPanel>
          <Row>
            <PromotionBadge label={tm("promoBadgeActive")} state="active" stateLabel={tm("promoActive")} icon={<Tag aria-hidden="true" />} />
            <PromotionBadge label={tm("promoBadgeEligible")} state="eligible" stateLabel={tm("promoEligible")} />
            <PromotionBadge label={tm("promoBadgeLocked")} state="locked" stateLabel={tm("promoLocked")} />
            <PromotionBadge label={tm("promoBadgeExpired")} state="expired" stateLabel={tm("promoExpired")} />
          </Row>
        </DemoPanel>
      </Section>

      <Section title={tm("promoCardTitle")}>
        <DemoPanel>
          <div className="ds-form-grid">
            <Stack label={tm("promoActive")}>
              <PromotionCard
                icon={<Tag />}
                heading={tm("promoCardHeading")}
                terms={tm("promoCardTerms")}
                state="active"
                stateBadgeLabel={tm("promoActive")}
                statusLabel={tm("promoCardActive")}
                action={{ label: tm("promoActionApplied") }}
              />
            </Stack>
            <Stack label={tm("promoEligible")}>
              <PromotionCard
                icon={<Tag />}
                heading={tm("promoCardHeading")}
                terms={tm("promoCardTerms")}
                state="eligible"
                stateBadgeLabel={tm("promoEligible")}
                statusLabel={tm("promoCardEligible")}
                action={{ label: tm("promoAction") }}
              />
            </Stack>
            <Stack label={tm("promoLocked")}>
              <PromotionCard
                icon={<Tag />}
                heading={tm("promoCardHeading")}
                terms={tm("promoCardTerms")}
                state="locked"
                stateBadgeLabel={tm("promoLocked")}
                statusLabel={tm("promoCardLocked")}
                progress={
                  <PromotionProgress
                    label={tm("promoProgressLabel")}
                    current={2}
                    target={5}
                    valueLabel={(current, target) => `${current} / ${target}`}
                    remainingLabel={() => tm("promoCardLocked")}
                    reachedLabel={tm("promoProgressReachedHelp")}
                  />
                }
                action={{ label: tm("promoAction") }}
              />
            </Stack>
            <Stack label={tm("promoExpired")}>
              <PromotionCard
                icon={<Tag />}
                heading={tm("promoCardHeading")}
                terms={tm("promoCardTerms")}
                state="expired"
                stateBadgeLabel={tm("promoExpired")}
                statusLabel={tm("promoCardExpired")}
                action={{ label: tm("promoAction") }}
              />
            </Stack>
          </div>
          <p className="ds-helper" style={{ marginTop: 16 }}>{tm("demoOnly")}</p>
        </DemoPanel>
      </Section>

      <Guidelines items={[{ kind: "do", text: tm("promotionDo") }, { kind: "dont", text: tm("promotionDont") }]} />
    </>
  );
}
