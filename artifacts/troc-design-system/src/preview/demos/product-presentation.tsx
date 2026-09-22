import {
  CardImage,
  CardMetadata,
  CardTitle,
  ProductAvailability,
  ProductCard,
  ProductRow,
} from "../../components/ui/product-presentation";
import { LowestAvailable, ReferencePrice } from "../../components/ui/price";
import {
  ConditionBadge,
  GameBadge,
  LanguageBadge,
  SetBadge,
  VariantBadge,
} from "../../components/ui/marketplace-badges";
import { Button } from "../../components/ui/button";
import { usePreferences } from "../../hooks/use-preferences";
import { useMarketCardMessages } from "../../lib/messages-market-cards";
import { demoArtwork } from "../demo-assets";
import { DemoPanel, Guidelines, PageHeader, Section, Stack } from "../parts";

function Prices({ reference, lowest, refLabel, lowLabel, locale }: {
  reference: number; lowest: number; refLabel: string; lowLabel: string; locale: "en" | "fr";
}) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
      <ReferencePrice amount={reference} locale={locale} label={refLabel} />
      <LowestAvailable amount={lowest} locale={locale} label={lowLabel} />
    </div>
  );
}

export default function ProductPresentationDemo() {
  const { locale } = usePreferences();
  const { ts } = useMarketCardMessages();

  return (
    <>
      <PageHeader eyebrow={ts("eyebrow")} title={ts("ppTitle")} description={ts("ppIntro")} />

      <Section title={ts("ppTileTitle")}>
        <DemoPanel>
          <div className="ds-form-grid">
            <ProductCard
              image={<CardImage src={demoArtwork.charizard} alt={ts("cardCharizardTitle")} missingLabel={ts("imageMissing")} />}
              title={<CardTitle>{ts("cardCharizardTitle")}</CardTitle>}
              metadata={<CardMetadata items={[ts("cardCharizardMeta")]} />}
              badges={
                <>
                  <ConditionBadge condition="NM" label={ts("ppConditionNM")} size="compact" />
                  <LanguageBadge label={ts("ppLangEN")} size="compact" />
                  <GameBadge label={ts("ppGamePokemon")} size="compact" />
                  <SetBadge label="151" size="compact" />
                  <VariantBadge label={ts("cardCharizardMeta")} size="compact" />
                </>
              }
              price={<Prices reference={24.0} lowest={18.4} refLabel={ts("ppReferenceLabel")} lowLabel={ts("ppLowestLabel")} locale={locale} />}
              availability={<ProductAvailability sellersLabel={ts("ppSellersMany").replace("{n}", "12")} stockLabel={ts("ppInStock").replace("{n}", "34")} />}
              actions={<Button variant="secondary">{ts("ppView")}</Button>}
            />
            <ProductCard
              image={<CardImage src={demoArtwork.pikachu} alt={ts("cardPikachuTitle")} missingLabel={ts("imageMissing")} />}
              title={<CardTitle>{ts("cardPikachuTitle")}</CardTitle>}
              metadata={<CardMetadata items={[ts("cardPikachuMeta")]} />}
              badges={
                <>
                  <ConditionBadge condition="NM" label={ts("ppConditionNM")} size="compact" />
                  <LanguageBadge label={ts("ppLangEN")} size="compact" />
                  <GameBadge label={ts("ppGamePokemon")} size="compact" />
                </>
              }
              price={<Prices reference={9.5} lowest={6.75} refLabel={ts("ppReferenceLabel")} lowLabel={ts("ppLowestLabel")} locale={locale} />}
              availability={<ProductAvailability sellersLabel={ts("ppSellersMany").replace("{n}", "8")} stockLabel={ts("ppInStock").replace("{n}", "21")} />}
              actions={<Button variant="secondary">{ts("ppView")}</Button>}
            />
            <ProductCard
              image={<CardImage src={demoArtwork.lightningBolt} alt={ts("cardBoltTitle")} missingLabel={ts("imageMissing")} />}
              title={<CardTitle>{ts("cardBoltTitle")}</CardTitle>}
              metadata={<CardMetadata items={[ts("cardBoltMeta")]} />}
              badges={
                <>
                  <ConditionBadge condition="NM" label={ts("ppConditionNM")} size="compact" />
                  <LanguageBadge label={ts("ppLangEN")} size="compact" />
                  <GameBadge label={ts("ppGameMagic")} size="compact" />
                </>
              }
              price={<Prices reference={0.15} lowest={0.06} refLabel={ts("ppReferenceLabel")} lowLabel={ts("ppLowestLabel")} locale={locale} />}
              availability={<ProductAvailability sellersLabel={ts("ppSellersMany").replace("{n}", "40")} stockLabel={ts("ppInStock").replace("{n}", "500")} />}
              actions={<Button variant="secondary">{ts("ppView")}</Button>}
            />
          </div>
          <p className="ds-helper" style={{ marginTop: 16 }}>{ts("demoOnly")}</p>
        </DemoPanel>
      </Section>

      <Section title={ts("ppRowTitle")}>
        <DemoPanel>
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            <ProductRow
              image={<CardImage src={demoArtwork.charizard} alt={ts("cardCharizardTitle")} missingLabel={ts("imageMissing")} />}
              title={<CardTitle as="h3" size="sm">{ts("cardCharizardTitle")}</CardTitle>}
              metadata={<CardMetadata items={[ts("cardCharizardMeta")]} />}
              badges={
                <>
                  <ConditionBadge condition="NM" label={ts("ppConditionNM")} size="compact" />
                  <GameBadge label={ts("ppGamePokemon")} size="compact" />
                </>
              }
              price={<Prices reference={24.0} lowest={18.4} refLabel={ts("ppReferenceLabel")} lowLabel={ts("ppLowestLabel")} locale={locale} />}
              availability={<ProductAvailability sellersLabel={ts("ppSellersMany").replace("{n}", "12")} stockLabel={ts("ppInStock").replace("{n}", "34")} />}
              actions={<Button variant="secondary" size="sm">{ts("ppView")}</Button>}
            />
            <ProductRow
              selected
              image={<CardImage src={demoArtwork.luffy} alt={ts("cardLuffyTitle")} missingLabel={ts("imageMissing")} />}
              title={<CardTitle as="h3" size="sm">{ts("cardLuffyTitle")}</CardTitle>}
              metadata={<CardMetadata items={[ts("cardLuffyMeta")]} />}
              badges={
                <>
                  <ConditionBadge condition="LP" label={ts("ppConditionNM")} size="compact" selected />
                  <GameBadge label={ts("ppGameOnePiece")} size="compact" />
                </>
              }
              price={<Prices reference={5.0} lowest={3.2} refLabel={ts("ppReferenceLabel")} lowLabel={ts("ppLowestLabel")} locale={locale} />}
              availability={<ProductAvailability sellersLabel={ts("ppSellersMany").replace("{n}", "5")} stockLabel={ts("ppInStock").replace("{n}", "9")} />}
              actions={<Button variant="secondary" size="sm">{ts("ppView")}</Button>}
            />
          </div>
        </DemoPanel>
      </Section>

      <Section title={ts("ppStatesTitle")}>
        <DemoPanel>
          <div className="ds-form-grid">
            <Stack label={ts("ppHover")}>
              <ProductCard
                previewState="hover"
                image={<CardImage src={demoArtwork.pikachu} alt={ts("cardPikachuTitle")} missingLabel={ts("imageMissing")} />}
                title={<CardTitle>{ts("cardPikachuTitle")}</CardTitle>}
                metadata={<CardMetadata items={[ts("cardPikachuMeta")]} />}
                price={<Prices reference={9.5} lowest={6.75} refLabel={ts("ppReferenceLabel")} lowLabel={ts("ppLowestLabel")} locale={locale} />}
                actions={<Button variant="secondary" size="sm">{ts("ppView")}</Button>}
              />
            </Stack>
            <Stack label={ts("ppFocus")}>
              <ProductCard
                previewState="focus"
                image={<CardImage src={demoArtwork.pikachu} alt={ts("cardPikachuTitle")} missingLabel={ts("imageMissing")} />}
                title={<CardTitle>{ts("cardPikachuTitle")}</CardTitle>}
                metadata={<CardMetadata items={[ts("cardPikachuMeta")]} />}
                price={<Prices reference={9.5} lowest={6.75} refLabel={ts("ppReferenceLabel")} lowLabel={ts("ppLowestLabel")} locale={locale} />}
                actions={<Button variant="secondary" size="sm">{ts("ppView")}</Button>}
              />
            </Stack>
            <Stack label={ts("ppSelectedState")}>
              <ProductCard
                selected
                image={<CardImage src={demoArtwork.pikachu} alt={ts("cardPikachuTitle")} missingLabel={ts("imageMissing")} />}
                title={<CardTitle>{ts("cardPikachuTitle")}</CardTitle>}
                metadata={<CardMetadata items={[ts("cardPikachuMeta")]} />}
                badges={<ConditionBadge condition="NM" label={ts("ppConditionNM")} size="compact" selected />}
                price={<Prices reference={9.5} lowest={6.75} refLabel={ts("ppReferenceLabel")} lowLabel={ts("ppLowestLabel")} locale={locale} />}
                actions={<Button variant="secondary" size="sm">{ts("ppView")}</Button>}
              />
            </Stack>
            <Stack label={ts("ppLoading")}>
              <ProductCard
                aria-busy="true"
                image={<CardImage loading src="" alt={ts("cardPikachuTitle")} missingLabel={ts("imageMissing")} />}
                title={<CardTitle>{ts("loadingLabel")}</CardTitle>}
              />
            </Stack>
            <Stack label={ts("ppMissing")}>
              <ProductCard
                image={<CardImage src={null} alt={ts("cardBoltTitle")} missingLabel={ts("imageMissing")} />}
                title={<CardTitle>{ts("cardBoltTitle")}</CardTitle>}
                metadata={<CardMetadata items={[ts("cardBoltMeta")]} />}
                price={<Prices reference={0.15} lowest={0.06} refLabel={ts("ppReferenceLabel")} lowLabel={ts("ppLowestLabel")} locale={locale} />}
                actions={<Button variant="secondary" size="sm">{ts("ppView")}</Button>}
              />
            </Stack>
            <Stack label={ts("ppOut")}>
              <ProductCard
                unavailable
                image={<CardImage src={demoArtwork.luffy} alt={ts("cardLuffyTitle")} missingLabel={ts("imageMissing")} />}
                title={<CardTitle>{ts("cardLuffyTitle")}</CardTitle>}
                metadata={<CardMetadata items={[ts("cardLuffyMeta")]} />}
                price={<LowestAvailable amount={null} locale={locale} label={ts("ppLowestLabel")} unavailableLabel={ts("ppOutOfStock")} />}
                availability={<ProductAvailability stockLabel={ts("ppOutOfStock")} outOfStock />}
              />
            </Stack>
          </div>
        </DemoPanel>
      </Section>

      <Section title={locale === "fr" ? "Images adaptatives" : "Responsive artwork"}>
        <DemoPanel><div className="ds-form-grid">
          <CardImage src={demoArtwork.charizard} srcSet={demoArtwork.charizard + " 600w"} sizes="240px" width={600} height={825} alt={ts("cardCharizardTitle")} missingLabel={ts("imageMissing")} />
          <CardImage loading alt={ts("cardPikachuTitle")} missingLabel={ts("imageMissing")} />
          <CardImage alt={ts("cardBoltTitle")} missingLabel={ts("imageMissing")} />
        </div></DemoPanel>
      </Section>
      <Guidelines items={[{ kind: "do", text: ts("ppDo") }, { kind: "dont", text: ts("ppDont") }]} />
    </>
  );
}
