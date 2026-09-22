import { CollectionProgressCard } from "../../components/ui/collection-progress";
import { CardImage } from "../../components/ui/product-presentation";
import { useMarketCardMessages } from "../../lib/messages-market-cards";
import { demoArtwork } from "../demo-assets";
import { DemoPanel, Guidelines, PageHeader, Section, Stack } from "../parts";

export default function CollectionProgressDemo() {
  const { ts } = useMarketCardMessages();

  const value = (n: number, total: number) => ts("cpCardsOwned").replace("{n}", String(n)).replace("{total}", String(total));

  return (
    <>
      <PageHeader eyebrow={ts("eyebrow")} title={ts("cpTitle")} description={ts("cpIntro")} />

      <Section title={ts("cpFull")}>
        <DemoPanel>
          <div className="ds-form-grid">
            <CollectionProgressCard
              title={ts("cpSetTitle")}
              subtitle={ts("cpSetSubtitle")}
              current={42}
              total={165}
              progressLabel={ts("cpProgressLabel")}
              valueLabel={value(42, 165)}
              thumbnail={<CardImage src={demoArtwork.pikachu} alt={ts("cardPikachuTitle")} missingLabel={ts("imageMissing")} />}
            />
            <CollectionProgressCard
              title={ts("cpCompleteTitle")}
              subtitle={ts("cpSetSubtitle")}
              current={120}
              total={120}
              progressLabel={ts("cpProgressLabel")}
              valueLabel={ts("cpCompleteValue")}
              completeLabel={ts("cpComplete")}
              thumbnail={<CardImage src={demoArtwork.luffy} alt={ts("cardLuffyTitle")} missingLabel={ts("imageMissing")} />}
            />
          </div>
          <p className="ds-helper" style={{ marginTop: 16 }}>{ts("demoOnly")}</p>
        </DemoPanel>
      </Section>

      <Section title={ts("states")}>
        <DemoPanel>
          <div className="ds-form-grid">
            <Stack label={ts("cpEmptyState")}>
              <CollectionProgressCard
                title={ts("cpEmptyTitle")}
                current={0}
                total={249}
                progressLabel={ts("cpProgressLabel")}
                valueLabel={ts("cpEmptyValue")}
                emptyLabel={ts("cpEmpty")}
              />
            </Stack>
            <Stack label={ts("cpCompact")}>
              <CollectionProgressCard
                compact
                title={ts("cpSetTitle")}
                subtitle={ts("cpSetSubtitle")}
                current={42}
                total={165}
                progressLabel={ts("cpProgressLabel")}
                valueLabel={value(42, 165)}
              />
            </Stack>
            <Stack label={ts("loading")}>
              <CollectionProgressCard
                loading
                loadingLabel={ts("cpLoadingLabel")}
                title={ts("cpSetTitle")}
                current={0}
                total={165}
                progressLabel={ts("cpProgressLabel")}
                valueLabel={value(0, 165)}
              />
            </Stack>
          </div>
        </DemoPanel>
      </Section>

      <Guidelines items={[{ kind: "do", text: ts("cpDo") }, { kind: "dont", text: ts("cpDont") }]} />
    </>
  );
}
