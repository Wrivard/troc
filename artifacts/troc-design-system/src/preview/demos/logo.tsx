import { TrocLogo } from "../../components/ui/logo";
import { usePreferences } from "../../hooks/use-preferences";
import { useNavigationMessages } from "../../lib/messages-navigation";
import { DemoPanel, Guidelines, PageHeader, Section } from "../parts";

export default function LogoDemo() {
  usePreferences();
  const { tn } = useNavigationMessages();
  return <>
    <PageHeader eyebrow={tn("brandNav")} title={tn("logoTitle")} description={tn("logoIntro")} />

    <Section title={tn("logoAuto")}><DemoPanel>
      <div className="ds-logo-tile"><TrocLogo variant="auto" height={40} label="TROC" /></div>
      <p className="ds-helper" style={{ marginTop: 16 }}>{tn("logoAutoNote")}</p>
    </DemoPanel></Section>

    <Section title={tn("variants")}><DemoPanel>
      <div style={{ display: "grid", gap: 16 }}>
        <div style={{ display: "flex", flexWrap: "wrap", gap: 16, alignItems: "stretch" }}>
          <div className="ds-logo-tile dark" style={{ background: "#0E0E0E", padding: 24, borderRadius: 12 }}>
            <TrocLogo variant="dark" height={34} label="TROC" />
            <p className="ds-helper" style={{ marginTop: 12, color: "#A3A3A3" }}>{tn("logoOnDark")}</p>
          </div>
          <div className="ds-logo-tile light" style={{ background: "#F4F4F4", padding: 24, borderRadius: 12 }}>
            <TrocLogo variant="light" height={34} label="TROC" />
            <p className="ds-helper" style={{ marginTop: 12, color: "#656565" }}>{tn("logoOnLight")}</p>
          </div>
        </div>
        <div style={{ display: "flex", flexWrap: "wrap", gap: 32, alignItems: "flex-end" }}>
          <div><TrocLogo variant="mono" height={30} label="TROC" /><p className="ds-helper" style={{ marginTop: 10 }}>{tn("logoMono")}</p></div>
          <div><TrocLogo variant="wordmark" height={30} label="TROC" /><p className="ds-helper" style={{ marginTop: 10 }}>{tn("logoWordmark")}</p></div>
          <div><TrocLogo variant="compact" height={34} label="TROC" /><p className="ds-helper" style={{ marginTop: 10 }}>{tn("logoCompact")}</p></div>
        </div>
      </div>
    </DemoPanel></Section>

    <Section title={tn("nestedDark") + " · " + tn("nestedLight")}><DemoPanel>
      <div style={{ display: "flex", flexWrap: "wrap", gap: 16 }}>
        <div className="dark" style={{ background: "#0E0E0E", padding: 24, borderRadius: 12 }}>
          <TrocLogo variant="auto" height={30} label="TROC" />
          <p className="ds-helper" style={{ marginTop: 12, color: "#A3A3A3" }}>{tn("nestedDark")}</p>
        </div>
        <div className="light" style={{ background: "#F4F4F4", padding: 24, borderRadius: 12 }}>
          <TrocLogo variant="auto" height={30} label="TROC" />
          <p className="ds-helper" style={{ marginTop: 12, color: "#656565" }}>{tn("nestedLight")}</p>
        </div>
      </div>
    </DemoPanel></Section>

    <Section title={tn("logoClearSpace") + " · " + tn("logoMinSize")}><DemoPanel>
      <div style={{ display: "flex", flexWrap: "wrap", gap: 32, alignItems: "flex-end" }}>
        <div>
          <div className="ds-clearspace" style={{ display: "inline-block", border: "1px dashed var(--border-strong)", borderRadius: 8 }}>
            <TrocLogo variant="auto" height={34} label="TROC" clearSpace />
          </div>
          <p className="ds-helper" style={{ marginTop: 12 }}>{tn("logoClearNote")}</p>
        </div>
        <div>
          <TrocLogo variant="auto" height={24} label="TROC" />
          <p className="ds-helper" style={{ marginTop: 12 }}>{tn("logoMinNote")}</p>
        </div>
      </div>
    </DemoPanel></Section>

    <Guidelines items={[{ kind: "do", text: tn("logoDo") }, { kind: "dont", text: tn("logoDont") }]} />
  </>;
}
