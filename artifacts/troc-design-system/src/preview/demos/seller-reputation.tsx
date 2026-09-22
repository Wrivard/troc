import { Award, Crown, Gauge, MapPin, Sparkles, Store, Timer, TrendingUp } from "lucide-react";
import {
  SellerLevelBadge,
  SellerPlanBadge,
  SellerRating,
  SellerStat,
  SellerStats,
} from "../../components/ui/seller-reputation";
import { usePreferences } from "../../hooks/use-preferences";
import { useSellerFoundationMessages } from "../../lib/messages-seller-foundations";
import { DemoPanel, Guidelines, PageHeader, Row, Section, Stack } from "../parts";

export default function SellerReputationDemo() {
  const { locale } = usePreferences();
  const { ts } = useSellerFoundationMessages();

  return (
    <>
      <PageHeader eyebrow={ts("eyebrow")} title={ts("sellerTitle")} description={ts("sellerIntro")} />

      <Section title={ts("ratingTitle")}>
        <DemoPanel>
          <div className="ds-form-grid">
            <Stack label={ts("ratingFull")}>
              <SellerRating value={4.8} count={1240} label={ts("ratingLabel")} locale={locale} />
            </Stack>
            <Stack label={ts("ratingCompact")}>
              <SellerRating value={4.8} count={1240} format="compact" label={ts("ratingLabel")} locale={locale} />
            </Stack>
            <Stack label={ts("unrated")}>
              <SellerRating value={null} label={ts("ratingUnrated")} locale={locale} />
            </Stack>
            <Stack label={ts("loading")}>
              <SellerRating value={null} loading label={ts("ratingLoading")} locale={locale} />
            </Stack>
          </div>
          <p className="ds-helper" style={{ marginTop: 16 }}>{ts("demoOnly")}</p>
        </DemoPanel>
      </Section>

      <Section title={ts("statsTitle")}>
        <DemoPanel>
          <SellerStats>
            <SellerStat icon={<MapPin />} label={ts("statShipsFrom")} value={ts("statShipsFromValue")} />
            <SellerStat icon={<TrendingUp />} label={ts("statSales")} value={ts("statSalesValue")} />
            <SellerStat icon={<Timer />} label={ts("statResponse")} value={ts("statResponseValue")} />
            <SellerStat icon={<Gauge />} label={ts("statOnTime")} value={ts("statOnTimeValue")} />
            <SellerStat icon={<Award />} label={ts("statSales")} value={ts("statUnavailable")} />
          </SellerStats>
        </DemoPanel>
      </Section>

      <Section title={ts("levelTitle")}>
        <DemoPanel>
          <Row>
            <SellerLevelBadge tier="new" label={ts("levelNew")} />
            <SellerLevelBadge tier="established" label={ts("levelEstablished")} />
            <SellerLevelBadge tier="top" icon={<Crown aria-hidden="true" />} label={ts("levelTop")} />
            <SellerLevelBadge tier="founding" icon={<Sparkles aria-hidden="true" />} label={ts("levelFounding")} />
          </Row>
        </DemoPanel>
      </Section>

      <Section title={ts("planTitle")}>
        <DemoPanel>
          <Row>
            <SellerPlanBadge label={ts("planStandard")} />
            <SellerPlanBadge featured icon={<Store aria-hidden="true" />} label={ts("planHobbyShop")} />
          </Row>
          <p className="ds-helper" style={{ marginTop: 12 }}>{ts("planNote")}</p>
        </DemoPanel>
      </Section>

      <Guidelines items={[{ kind: "do", text: ts("sellerDo") }, { kind: "dont", text: ts("sellerDont") }]} />
    </>
  );
}
