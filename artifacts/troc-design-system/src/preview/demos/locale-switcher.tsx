import { useState } from "react";
import { LocaleSwitcher, type LocaleValue } from "../../components/ui/locale-switcher";
import { usePreferences } from "../../hooks/use-preferences";
import { useNavigationMessages } from "../../lib/messages-navigation";
import { DemoPanel, Guidelines, PageHeader, Section } from "../parts";

export default function LocaleSwitcherDemo() {
  const { locale, setLocale } = usePreferences();
  const { tn } = useNavigationMessages();
  const [standalone, setStandalone] = useState<LocaleValue>("fr");

  const options = [
    { value: "en" as const, code: "EN", label: tn("localeEnglish") },
    { value: "fr" as const, code: "FR", label: tn("localeFrench") },
  ];

  return <>
    <PageHeader eyebrow={tn("brandNav")} title={tn("localeTitle")} description={tn("localeIntro")} />

    <Section title={tn("localeControlled")}><DemoPanel>
      <LocaleSwitcher
        value={locale}
        onValueChange={(next) => setLocale(next)}
        options={options}
        groupLabel={tn("localeGroup")}
      />
      <p className="ds-inline-status" role="status" style={{ marginTop: 16 }}>
        {tn("localeCurrent")}: {locale === "en" ? tn("localeEnglish") : tn("localeFrench")}
      </p>
    </DemoPanel></Section>

    <Section title={tn("localeStandalone")}><DemoPanel>
      <LocaleSwitcher
        value={standalone}
        onValueChange={setStandalone}
        options={options}
        groupLabel={tn("localeGroup")}
      />
      <p className="ds-inline-status" role="status" style={{ marginTop: 16 }}>
        {tn("localeCurrent")}: {standalone === "en" ? tn("localeEnglish") : tn("localeFrench")}
      </p>
      <p className="ds-helper" style={{ marginTop: 8 }}>{tn("demoOnly")}</p>
    </DemoPanel></Section>

    <Guidelines items={[{ kind: "do", text: tn("localeDo") }, { kind: "dont", text: tn("localeDont") }]} />
  </>;
}
