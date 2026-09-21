import { tokens } from "../../generated/tokens";
import { usePreferences } from "../../hooks/use-preferences";
import { DemoPanel, Guidelines, PageHeader, Section } from "../parts";

export default function LayoutPage() {
  const { t } = usePreferences();
  return <>
    <PageHeader eyebrow={t("layout")} title={t("spacing")} description={t("layoutIntro")} />
    <Section title={t("spaceScale")}><DemoPanel>
      {Object.entries(tokens.foundation.space).map(([step, size]) => <div className="ds-spacing-row" key={step}><code>space-{step}</code><div className="ds-spacing-bar" style={{ width: size }} /><span>{size}</span></div>)}
    </DemoPanel></Section>
    <Section title={t("containers")}><DemoPanel><div className="ds-stack">
      {Object.entries(tokens.foundation.container).map(([key, size]) => <div className="ds-token-row" key={key}><code>{key}</code><code>{size}</code></div>)}
    </div></DemoPanel></Section>
    <Section title={t("breakpoints")}><DemoPanel><div className="ds-grid-demo" aria-hidden="true">{Array.from({ length: 12 }, (_, index) => <div key={index} />)}</div>
      <div className="ds-layout-metadata">{Object.entries(tokens.foundation.breakpoint).map(([key, size]) => <span key={key}>{key} / {size}</span>)}</div>
    </DemoPanel></Section>
    <Section title={t("radius")}><DemoPanel><div className="ds-radius-grid">{["sm", "md", "lg", "xl"].map((size) => <div className="ds-radius-cell" key={size} style={{ borderRadius: `var(--radius-${size})`, boxShadow: size === "xl" ? "var(--shadow-sm)" : "none" }}><span>{size}</span></div>)}</div></DemoPanel></Section>
    <Section title={t("motion")} description={t("motionNote")}><DemoPanel><div className="ds-layout-metadata">
      {Object.entries(tokens.foundation.motion).filter(([key]) => key !== "easing").map(([key, value]) => <span key={key}>{key} / {value}</span>)}
    </div><div className="ds-layout-metadata">{Object.entries(tokens.foundation.z).map(([key, value]) => <span key={key}>z-{key} / {value}</span>)}</div></DemoPanel></Section>
    <Guidelines items={[{ kind: "do", text: t("layoutDo") }, { kind: "dont", text: t("layoutDont") }]} />
  </>;
}