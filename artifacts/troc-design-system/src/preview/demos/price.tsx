import { LowestAvailable, PriceBlock, ReferencePrice, SalePrice } from "../../components/ui/price";
import { usePreferences } from "../../hooks/use-preferences";
import { useMarketEconomicsMessages } from "../../lib/messages-market-economics";
import { DemoPanel, Guidelines, PageHeader, Row, Section, Stack } from "../parts";

export default function PriceDemo() {
  const { locale } = usePreferences();
  const { tm } = useMarketEconomicsMessages();

  return (
    <>
      <PageHeader eyebrow={tm("eyebrow")} title={tm("priceTitle")} description={tm("priceIntro")} />

      <Section title={tm("priceLargeTitle")}>
        <DemoPanel>
          <Row>
            <Stack label={tm("priceLarge")}>
              <PriceBlock amount={129.99} locale={locale} size="lg" />
            </Stack>
            <Stack label={tm("priceDefault")}>
              <PriceBlock amount={12.4} locale={locale} size="default" />
            </Stack>
            <Stack label={tm("priceSmall")}>
              <PriceBlock amount={12.4} locale={locale} size="sm" />
            </Stack>
          </Row>
        </DemoPanel>
      </Section>

      <Section title={tm("referenceTitle")}>
        <DemoPanel>
          <Row>
            <Stack label={tm("referenceLabel")}>
              <ReferencePrice amount={14.5} locale={locale} label={tm("referenceLabel")} />
            </Stack>
            <Stack label={tm("lowestLabel")}>
              <LowestAvailable amount={9.87} locale={locale} label={tm("lowestLabel")} />
            </Stack>
          </Row>
        </DemoPanel>
      </Section>

      <Section title={tm("saleTitle")}>
        <DemoPanel>
          <Row>
            <Stack label={tm("saleLabel")}>
              <SalePrice amount={8.99} previousAmount={12.4} locale={locale} label={tm("saleLabel")} wasLabel={tm("saleWas")} />
            </Stack>
            <Stack label={tm("priceLarge")}>
              <SalePrice amount={8.99} previousAmount={12.4} locale={locale} size="lg" wasLabel={tm("saleWas")} />
            </Stack>
          </Row>
        </DemoPanel>
      </Section>

      <Section title={tm("subDollarTitle")}>
        <DemoPanel>
          <Row>
            <Stack label={tm("lowestLabel")}>
              <LowestAvailable amount={0.42} locale={locale} label={tm("lowestLabel")} />
            </Stack>
            <Stack label={tm("priceSmall")}>
              <PriceBlock amount={0.19} locale={locale} size="sm" />
            </Stack>
            <Stack label={tm("saleLabel")}>
              <SalePrice amount={0.35} previousAmount={0.99} locale={locale} wasLabel={tm("saleWas")} />
            </Stack>
          </Row>
          <p className="ds-helper" style={{ marginTop: 12 }}>{tm("subDollarNote")}</p>
        </DemoPanel>
      </Section>

      <Section title={tm("unavailableTitle")}>
        <DemoPanel>
          <Row>
            <Stack label={tm("unavailableLabel")}>
              <PriceBlock amount={null} locale={locale} unavailableLabel={tm("unavailableLabel")} />
            </Stack>
            <Stack label={tm("lowestLabel")}>
              <LowestAvailable amount={null} locale={locale} label={tm("lowestLabel")} unavailableLabel={tm("unavailableLabel")} />
            </Stack>
          </Row>
        </DemoPanel>
      </Section>

      <Section title={tm("denseRowTitle")}>
        <DemoPanel>
          <div className="troc-price-dense-row">
            <div style={{ minWidth: 0 }}>
              <p style={{ margin: 0, fontWeight: 600 }}>{tm("denseCard")}</p>
              <p className="ds-helper" style={{ margin: 0 }}>{tm("denseMeta")}</p>
            </div>
            <ReferencePrice amount={14.5} locale={locale} label={tm("referenceLabel")} />
            <LowestAvailable amount={9.87} locale={locale} label={tm("lowestLabel")} />
          </div>
          <p className="ds-helper" style={{ marginTop: 16 }}>{tm("demoOnly")}</p>
        </DemoPanel>
      </Section>

      <Guidelines items={[{ kind: "do", text: tm("priceDo") }, { kind: "dont", text: tm("priceDont") }]} />
    </>
  );
}
