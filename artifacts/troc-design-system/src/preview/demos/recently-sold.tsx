import { RecentlySoldItem } from "../../components/ui/recently-sold";
import { PriceBlock } from "../../components/ui/price";
import { usePreferences } from "../../hooks/use-preferences";
import { useMarketCardMessages } from "../../lib/messages-market-cards";
import { demoArtwork } from "../demo-assets";
import { DemoPanel, Guidelines, PageHeader, Section, Stack } from "../parts";

export default function RecentlySoldDemo() {
  const { locale } = usePreferences();
  const { ts } = useMarketCardMessages();

  return (
    <>
      <PageHeader eyebrow={ts("eyebrow")} title={ts("rsTitle")} description={ts("rsIntro")} />

      <Section title={ts("rsListLabel")}>
        <DemoPanel>
          <ul aria-label={ts("rsListLabel")} style={{ listStyle: "none", margin: 0, padding: 0, display: "flex", flexDirection: "column", gap: 8, maxWidth: 420 }}>
            <li>
              <RecentlySoldItem
                href="#"
                imageSrc={demoArtwork.charizard}
                imageAlt={ts("cardCharizardTitle")}
                imageMissingLabel={ts("imageMissing")}
                title={ts("cardCharizardTitle")}
                price={<PriceBlock amount={18.4} locale={locale} size="sm" />}
                priceLabel={ts("rsSoldFor")}
                timestamp={ts("rsTime2m")}
              />
            </li>
            <li>
              <RecentlySoldItem
                href="#"
                imageSrc={demoArtwork.pikachu}
                imageAlt={ts("cardPikachuTitle")}
                imageMissingLabel={ts("imageMissing")}
                title={ts("cardPikachuTitle")}
                price={<PriceBlock amount={6.75} locale={locale} size="sm" />}
                priceLabel={ts("rsSoldFor")}
                timestamp={ts("rsTime18m")}
              />
            </li>
            <li>
              <RecentlySoldItem
                href="#"
                imageSrc={demoArtwork.lightningBolt}
                imageAlt={ts("cardBoltTitle")}
                imageMissingLabel={ts("imageMissing")}
                title={ts("cardBoltTitle")}
                price={<PriceBlock amount={0.06} locale={locale} size="sm" />}
                priceLabel={ts("rsSoldFor")}
                timestamp={ts("rsTime1h")}
              />
            </li>
            <li>
              <RecentlySoldItem
                href="#"
                imageSrc={demoArtwork.luffy}
                imageAlt={ts("cardLuffyTitle")}
                imageMissingLabel={ts("imageMissing")}
                title={ts("cardLuffyTitle")}
                price={<PriceBlock amount={3.2} locale={locale} size="sm" />}
                priceLabel={ts("rsSoldFor")}
                timestamp={ts("rsTimeYesterday")}
              />
            </li>
          </ul>
          <p className="ds-helper" style={{ marginTop: 12 }}>{ts("rsNote")}</p>
        </DemoPanel>
      </Section>

      <Section title={ts("states")}>
        <DemoPanel>
          <div style={{ display: "flex", flexDirection: "column", gap: 16, maxWidth: 420 }}>
            <Stack label={ts("loading")}>
              <RecentlySoldItem
                loading
                imageSrc=""
                imageAlt={ts("cardCharizardTitle")}
                imageMissingLabel={ts("imageMissing")}
                title={ts("loadingLabel")}
                price=""
                priceLabel={ts("rsSoldFor")}
                timestamp={ts("rsTime2m")}
              />
            </Stack>
            <Stack label={ts("imageMissing")}>
              <RecentlySoldItem
                imageSrc={null}
                imageAlt={ts("cardBoltTitle")}
                imageMissingLabel={ts("imageMissing")}
                title={ts("cardBoltTitle")}
                price={<PriceBlock amount={0.06} locale={locale} size="sm" />}
                priceLabel={ts("rsSoldFor")}
                timestamp={ts("rsTime1h")}
              />
            </Stack>
            <Stack label={ts("ppFocus")}>
              <RecentlySoldItem
                href="#"
                previewState="focus"
                imageSrc={demoArtwork.pikachu}
                imageAlt={ts("cardPikachuTitle")}
                imageMissingLabel={ts("imageMissing")}
                title={ts("cardPikachuTitle")}
                price={<PriceBlock amount={6.75} locale={locale} size="sm" />}
                priceLabel={ts("rsSoldFor")}
                timestamp={ts("rsTime18m")}
              />
            </Stack>
          </div>
        </DemoPanel>
      </Section>

      <Guidelines items={[{ kind: "do", text: ts("rsDo") }, { kind: "dont", text: ts("rsDont") }]} />
    </>
  );
}
