import { Download } from "lucide-react";
import { Button } from "../../components/ui/button";
import { usePreferences } from "../../hooks/use-preferences";
import { BrandImage, DemoPanel, Guidelines, PageHeader, Section } from "../parts";

export default function BrandPage() {
  const { t } = usePreferences();
  return <>
    <PageHeader eyebrow={t("brand")} title={t("identity")} description={t("brandIntro")} />
    <Section title={t("logoVariants")} description={t("logoOriginal")}>
      <div className="ds-logo-grid">
        <div className="ds-logo-tile dark"><BrandImage variant="dark" /><span>{t("onDark")}</span></div>
        <div className="ds-logo-tile light"><BrandImage variant="light" /><span>{t("onLight")}</span></div>
        <div className="ds-logo-tile dark"><BrandImage variant="mono" /><span>{t("mono")}</span></div>
        <div className="ds-logo-tile dark"><BrandImage variant="wordmark" /><span>{t("wordmark")}</span></div>
        <div className="ds-logo-tile dark is-compact"><BrandImage variant="leaf" /><span>{t("compact")}</span></div>
        <div className="ds-logo-tile light is-compact"><BrandImage variant="leaf" /><span>{t("onLight")}</span></div>
      </div>
      <p className="ds-notice">{t("provisional")}</p>
    </Section>
    <Section title={t("clearSpace")} description={t("clearSpaceNote")}>
      <DemoPanel><div className="ds-clearspace dark"><div><span>x</span><BrandImage variant="dark" /></div></div></DemoPanel>
    </Section>
    <Section title={t("minSize")} description={t("minSizeNote")}>
      <DemoPanel><div className="ds-flex-row dark" style={{ background: "var(--color-background)", padding: 20, borderRadius: "var(--radius-md)" }}><img alt="TROC" src={`${import.meta.env.BASE_URL}brand/troc-dark.png`} style={{ height: 24, width: "auto" }} /><code className="ds-helper">24 px</code></div></DemoPanel>
    </Section>
    <Guidelines items={[{ kind: "do", text: t("brandDo") }, { kind: "dont", text: t("brandDont") }]} />
    <Section title={t("primaryMessage")}><DemoPanel><p className="type-h2">{t("tagline")}</p><p className="ds-helper" style={{ marginTop: 16 }}>{t("collectTrade")}</p></DemoPanel></Section>
    <Section title={t("sourceBoard")}>
      <img className="ds-brand-source" alt={t("sourceBoard")} src={`${import.meta.env.BASE_URL}brand/locked-brand-direction.png`} loading="lazy" />
      <div className="ds-flex-row" style={{ marginTop: 24 }}><Button variant="outline" asChild><a href={`${import.meta.env.BASE_URL}brand/troc-supplied.png`} download="TROC-supplied-logo.png"><Download />{t("downloadLogo")}</a></Button></div>
    </Section>
  </>;
}