import { useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../../components/ui/tabs";
import { usePreferences } from "../../hooks/use-preferences";
import { useControlsMessages, type ControlsMessageKey } from "../../lib/messages-controls";
import { DemoPanel, Guidelines, PageHeader, Section } from "../parts";

const overflowTabs: { value: string; key: ControlsMessageKey }[] = [
  { value: "all", key: "tabAll" },
  { value: "pokemon", key: "tabPokemon" },
  { value: "magic", key: "tabMagic" },
  { value: "yugioh", key: "tabYugioh" },
  { value: "onepiece", key: "tabOnePiece" },
  { value: "lorcana", key: "tabLorcana" },
];

export default function TabsDemo() {
  usePreferences();
  const { tc } = useControlsMessages();
  const [active, setActive] = useState("details");

  return <>
    <PageHeader eyebrow={tc("tabsEyebrow")} title={tc("tabsTitle")} description={tc("tabsIntro")} />

    <Section title={tc("uncontrolled")}><DemoPanel>
      <Tabs defaultValue="details">
        <TabsList aria-label={tc("tabsTitle")}>
          <TabsTrigger value="details">{tc("tabDetails")}</TabsTrigger>
          <TabsTrigger value="sellers">{tc("tabSellers")}<span className="troc-tab-count">7</span></TabsTrigger>
          <TabsTrigger value="history">{tc("tabHistory")}</TabsTrigger>
          <TabsTrigger value="grading" disabled>{tc("tabDisabled")}</TabsTrigger>
        </TabsList>
        <TabsContent value="details"><p className="ds-lead" style={{ margin: 0 }}>{tc("tabDetailsBody")}</p></TabsContent>
        <TabsContent value="sellers"><p className="ds-lead" style={{ margin: 0 }}>{tc("tabSellersBody")}</p></TabsContent>
        <TabsContent value="history"><p className="ds-lead" style={{ margin: 0 }}>{tc("tabHistoryBody")}</p></TabsContent>
      </Tabs>
      <p className="ds-helper" style={{ marginTop: 12 }}>{tc("keyboardHint")}</p>
    </DemoPanel></Section>

    <Section title={tc("controlled")}><DemoPanel>
      <Tabs value={active} onValueChange={setActive}>
        <TabsList aria-label={tc("controlled")}>
          <TabsTrigger value="details">{tc("tabDetails")}</TabsTrigger>
          <TabsTrigger value="sellers">{tc("tabSellers")}</TabsTrigger>
          <TabsTrigger value="history">{tc("tabHistory")}</TabsTrigger>
        </TabsList>
        <TabsContent value="details"><p className="ds-lead" style={{ margin: 0 }}>{tc("tabDetailsBody")}</p></TabsContent>
        <TabsContent value="sellers"><p className="ds-lead" style={{ margin: 0 }}>{tc("tabSellersBody")}</p></TabsContent>
        <TabsContent value="history"><p className="ds-lead" style={{ margin: 0 }}>{tc("tabHistoryBody")}</p></TabsContent>
      </Tabs>
      <p className="ds-inline-status" role="status">{tc("activeTab")}: {tc(active === "details" ? "tabDetails" : active === "sellers" ? "tabSellers" : "tabHistory")}</p>
    </DemoPanel></Section>

    <Section title={tc("overflow")}><DemoPanel>
      <Tabs defaultValue="all">
        <TabsList aria-label={tc("overflow")}>
          {overflowTabs.map((tab) => <TabsTrigger key={tab.value} value={tab.value}>{tc(tab.key)}</TabsTrigger>)}
        </TabsList>
        {overflowTabs.map((tab) => (
          <TabsContent key={tab.value} value={tab.value}><p className="ds-lead" style={{ margin: 0 }}>{tc(tab.key)} · {tc("tabPanelBody")}</p></TabsContent>
        ))}
      </Tabs>
    </DemoPanel></Section>

    <Guidelines items={[{ kind: "do", text: tc("tabsDo") }, { kind: "dont", text: tc("tabsDont") }]} />
  </>;
}
