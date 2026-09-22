import { ConditionBadge, GameBadge, LanguageBadge, SetBadge, VariantBadge } from "../../components/ui/marketplace-badges";
import { useMarketEconomicsMessages } from "../../lib/messages-market-economics";
import { DemoPanel, Guidelines, PageHeader, Row, Section, Stack } from "../parts";

export default function MarketplaceBadgesDemo() {
  const { tm } = useMarketEconomicsMessages();

  return (
    <>
      <PageHeader eyebrow={tm("eyebrow")} title={tm("cardBadgeTitle")} description={tm("cardBadgeIntro")} />

      <Section title={tm("conditionTitle")}>
        <DemoPanel>
          <Stack label={tm("standard")}>
            <Row>
              <ConditionBadge condition="NM" label={tm("condNm")} />
              <ConditionBadge condition="LP" label={tm("condLp")} />
              <ConditionBadge condition="MP" label={tm("condMp")} />
              <ConditionBadge condition="HP" label={tm("condHp")} />
              <ConditionBadge condition="DMG" label={tm("condDmg")} />
            </Row>
          </Stack>
          <Stack label={tm("compact")}>
            <Row>
              <ConditionBadge condition="NM" size="compact" label={tm("condNm")} />
              <ConditionBadge condition="LP" size="compact" label={tm("condLp")} />
              <ConditionBadge condition="MP" size="compact" label={tm("condMp")} />
              <ConditionBadge condition="HP" size="compact" label={tm("condHp")} />
              <ConditionBadge condition="DMG" size="compact" label={tm("condDmg")} />
            </Row>
          </Stack>
          <Stack label={tm("conditionSelectedTitle")}>
            <Row>
              <ConditionBadge condition="NM" selected label={tm("condNm")} />
              <ConditionBadge condition="LP" selected label={tm("condLp")} />
            </Row>
          </Stack>
        </DemoPanel>
      </Section>

      <Section title={tm("languageTitle")}>
        <DemoPanel>
          <Stack label={tm("standard")}>
            <Row>
              <LanguageBadge label={tm("langEnglish")} />
              <LanguageBadge label={tm("langFrench")} selected />
              <LanguageBadge label={tm("langJapanese")} />
            </Row>
          </Stack>
          <Stack label={tm("compact")}>
            <Row>
              <LanguageBadge size="compact" label={tm("langEnglish")} />
              <LanguageBadge size="compact" label={tm("langFrench")} />
            </Row>
          </Stack>
        </DemoPanel>
      </Section>

      <Section title={tm("gameTitle")}>
        <DemoPanel>
          <Row>
            <GameBadge label="Pokémon" selected />
            <GameBadge label="Magic: The Gathering" />
            <GameBadge label="Yu-Gi-Oh!" />
            <GameBadge label="One Piece" />
            <GameBadge label="Riftbound" />
          </Row>
        </DemoPanel>
      </Section>

      <Section title={tm("setTitle")}>
        <DemoPanel>
          <Stack label={tm("standard")}>
            <Row>
              <SetBadge label={tm("setValue")} />
              <VariantBadge label={tm("variantHolo")} />
              <VariantBadge label={tm("variantReverse")} />
              <VariantBadge label={tm("variantFirstEd")} selected />
            </Row>
          </Stack>
          <Stack label={tm("compact")}>
            <Row>
              <SetBadge size="compact" label={tm("setValue")} />
              <VariantBadge size="compact" label={tm("variantHolo")} />
              <VariantBadge size="compact" label={tm("variantReverse")} />
            </Row>
          </Stack>
          <p className="ds-helper" style={{ marginTop: 16 }}>{tm("demoOnly")}</p>
        </DemoPanel>
      </Section>

      <Guidelines items={[{ kind: "do", text: tm("cardBadgeDo") }, { kind: "dont", text: tm("cardBadgeDont") }]} />
    </>
  );
}
