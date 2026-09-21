import { Keyboard, Accessibility, Contrast, MessageSquareWarning } from "lucide-react";
import { usePreferences } from "../../hooks/use-preferences";
import { messages } from "../../lib/messages";
import { DemoPanel, Guidelines, PageHeader, Section } from "../parts";

export function VoicePage() {
  const { t } = usePreferences();
  return <>
    <PageHeader eyebrow={t("content")} title={t("voice")} description={t("voiceIntro")} />
    <Section title={t("primaryMessage")}><div className="ds-copy-pair"><div lang="en-CA"><span>EN / CA</span><strong>{messages.tagline[0]}</strong></div><div lang="fr-CA"><span>FR / CA</span><strong>{messages.tagline[1]}</strong></div></div></Section>
    <Section title={t("supportingMessages")}>{(["collectTrade", "moreCards", "sellCards", "oneSearch"] as const).map((key) => <div className="ds-copy-pair" key={key}>
      <div lang="en-CA"><span>EN</span><strong>{messages[key][0]}</strong></div><div lang="fr-CA"><span>FR</span><strong>{messages[key][1]}</strong></div>
    </div>)}</Section>
    <p className="ds-notice">{t("languageNote")}</p>
    <Guidelines items={[{ kind: "do", text: t("voiceDo") }, { kind: "dont", text: t("voiceDont") }]} />
  </>;
}
export function AccessibilityPage() {
  const { t } = usePreferences();
  const principles = [
    { Icon: Keyboard, title: "keyboardTitle", body: "keyboardBody" },
    { Icon: Contrast, title: "contrastTitle", body: "contrastBody" },
    { Icon: Accessibility, title: "touchTitle", body: "touchBody" },
    { Icon: MessageSquareWarning, title: "errorsTitle", body: "errorsBody" },
  ] as const;
  return <>
    <PageHeader eyebrow={t("content")} title={t("accessibility")} description={t("a11yIntro")} />
    <Section title="WCAG AA"><div className="ds-accessibility-grid">{principles.map(({ Icon, title, body }) => <DemoPanel key={title}>
      <Icon size={24} strokeWidth={1.4} aria-hidden="true" /><h3>{t(title)}</h3><p>{t(body)}</p>
    </DemoPanel>)}</div></Section>
    <Section title={t("motion")}><DemoPanel><p className="ds-helper">{t("motionNote")}</p></DemoPanel></Section>
    <Section title={t("bilingual")}><DemoPanel><p className="ds-helper">{t("languageNote")}</p></DemoPanel></Section>
  </>;
}