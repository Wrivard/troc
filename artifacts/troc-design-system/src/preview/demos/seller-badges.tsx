import { SellerBadge } from "../../components/ui/seller-badges";
import { useMarketEconomicsMessages } from "../../lib/messages-market-economics";
import { DemoPanel, Guidelines, PageHeader, Row, Section, Stack } from "../parts";

export default function SellerBadgesDemo() {
  const { tm } = useMarketEconomicsMessages();

  const badges = [
    { kind: "verified-seller" as const, label: tm("sbVerifiedSeller"), meaning: tm("sbVerifiedSellerMeaning") },
    { kind: "verified-hobby-shop" as const, label: tm("sbVerifiedHobby"), meaning: tm("sbVerifiedHobbyMeaning") },
    { kind: "top-seller" as const, label: tm("sbTopSeller"), meaning: tm("sbTopSellerMeaning") },
    { kind: "founding-seller" as const, label: tm("sbFounding"), meaning: tm("sbFoundingMeaning") },
    { kind: "sponsored" as const, label: tm("sbSponsored"), meaning: tm("sbSponsoredMeaning") },
  ];

  return (
    <>
      <PageHeader eyebrow={tm("eyebrow")} title={tm("sellerBadgeTitle")} description={tm("sellerBadgeIntro")} />

      <Section title={tm("variants")}>
        <DemoPanel>
          <Stack label={tm("standard")}>
            <Row>
              {badges.map((b) => (
                <SellerBadge key={b.kind} kind={b.kind} label={b.label} />
              ))}
            </Row>
          </Stack>
          <Stack label={tm("compact")}>
            <Row>
              {badges.map((b) => (
                <SellerBadge key={b.kind} kind={b.kind} size="compact" label={b.label} />
              ))}
            </Row>
          </Stack>
        </DemoPanel>
      </Section>

      <Section title={tm("sbMeaningTitle")}>
        <DemoPanel>
          <dl className="troc-seller-badge-legend">
            {badges.map((b) => (
              <div key={b.kind} className="troc-seller-badge-legend-row">
                <dt><SellerBadge kind={b.kind} label={b.label} /></dt>
                <dd>{b.meaning}</dd>
              </div>
            ))}
          </dl>
          <p className="ds-helper" style={{ marginTop: 16 }}>{tm("demoOnly")}</p>
        </DemoPanel>
      </Section>

      <Guidelines items={[{ kind: "do", text: tm("sellerBadgeDo") }, { kind: "dont", text: tm("sellerBadgeDont") }]} />
    </>
  );
}
