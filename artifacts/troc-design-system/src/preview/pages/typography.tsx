import { tokens } from "../../generated/tokens";
import { usePreferences } from "../../hooks/use-preferences";
import { DemoPanel, PageHeader, Section } from "../parts";

export default function TypographyPage() {
  const { t, formatPrice } = usePreferences();
  return <>
    <PageHeader eyebrow={t("fonts")} title={t("typeScale")} description={t("fontPageIntro")} />
    <div className="ds-font-hero"><div className="ds-aa">Aa</div><div><h2>Plus Jakarta Sans</h2><p className="ds-helper">{t("licensed")}</p></div></div>
    <Section title="400 — 800"><div className="ds-font-weights">{(["regular", "medium", "semibold", "bold", "extraBold"] as const).map((key, index) => <span key={key} style={{ fontWeight: 400 + index * 100 }}>{t(key)}</span>)}</div></Section>
    <Section title={t("typeScale")}>
      {Object.entries(tokens.typeScale).map(([name, value]) => <div className="ds-type-row" key={name}>
        <code>{name}</code>
        <div className={`type-${name} ${name.includes("price") || name === "table" ? "ds-numbers" : ""}`}>
          {name.includes("price") ? `${formatPrice(name === "price-large" ? 24.87 : .06)} CAD`
            : name === "metadata" ? "Scarlet & Violet · 025/198 · NM · EN"
            : name === "table" ? `${formatPrice(.14)} / ${formatPrice(1.42)} / ${formatPrice(32.31)}`
            : name === "display" || name === "h1" ? t("builtHere")
            : name.startsWith("body") ? t("description")
            : name === "label" ? t("game") : name === "caption" ? t("demoOnly") : t("collectTrade")}
        </div><span>{Math.round(parseFloat(value.size) * 16)} / {value.weight}</span>
      </div>)}
    </Section>
    <Section title={t("numerals")} description={t("numeralsNote")}>
      <DemoPanel><div className="ds-number-grid ds-numbers">{[.06, .14, 1.42, 32.31].map((price) => <strong key={price}>{formatPrice(price)}</strong>)}</div><p className="ds-helper" style={{ marginTop: 22 }}>{t("demoOnly")}</p></DemoPanel>
    </Section>
  </>;
}