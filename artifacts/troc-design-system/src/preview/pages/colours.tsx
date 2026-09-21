import { tokens } from "../../generated/tokens";
import { usePreferences } from "../../hooks/use-preferences";
import { Button } from "../../components/ui/button";
import { Input } from "../../components/ui/input";
import { DemoPanel, Field, Guidelines, PageHeader, Section } from "../parts";

export default function ColoursPage() {
  const { t, theme } = usePreferences();
  const palette = tokens.color[theme];
  return <>
    <PageHeader eyebrow={t("colours")} title={t("palette")} description={t("palettePageIntro")} />
    <Section title={t("corePalette")}>
      <div className="ds-core-colours">{(["primary", "secondary", "accent"] as const).map((role) => <div key={role}>
        <div className="ds-swatch" style={{ background: palette[role] }} />
        <div className="ds-swatch-caption"><strong>{t(role)}</strong><code>{palette[role]}</code></div>
      </div>)}</div>
    </Section>
    <Section title={t("themeComparison")}>
      <div className="ds-theme-examples">{(["dark", "light"] as const).map((mode) => <div className={`ds-theme-example ${mode}`} key={mode}>
        <h3>{t(mode)}</h3><p>{t("moreCards")}</p><Field id={`theme-${mode}`} label={t("name")}><Input id={`theme-${mode}`} placeholder={t("namePlaceholder")} /></Field>
        <Button style={{ marginTop: 20 }}>{t("primaryAction")}</Button>
      </div>)}</div>
    </Section>
    <Section title={t("semanticRoles")}>
      <div className="ds-token-list">{Object.entries(palette).map(([name, value]) => <div className="ds-token-row" key={name}>
        <span className="ds-token-dot" style={{ background: value }} /><code>{name}</code><code>{value}</code>
      </div>)}</div>
    </Section>
    <Section title={t("contrast")} description={t("contrastNote")}>
      <div className="ds-contrast-grid">
        <div className="ds-contrast" style={{ background: tokens.color.dark.primary, color: tokens.color.dark.primaryForeground }}><strong>Aa</strong><span>4.85 : 1 · AA</span></div>
        <div className="ds-contrast" style={{ background: tokens.color.dark.accent, color: tokens.color.dark.accentForeground }}><strong>Aa</strong><span>5.23 : 1 · AA</span></div>
      </div>
      <DemoPanel className="ds-status-note"><p className="ds-helper">{t("statusNote")}</p></DemoPanel>
    </Section>
    <Guidelines items={[{ kind: "do", text: t("paletteDo") }, { kind: "dont", text: t("paletteDont") }]} />
  </>;
}