import { useState } from "react";
import { ThemeSwitcher, type ThemeValue } from "../../components/ui/theme-switcher";
import { usePreferences } from "../../hooks/use-preferences";
import { useNavigationMessages } from "../../lib/messages-navigation";
import { DemoPanel, Guidelines, PageHeader, Section } from "../parts";

export default function ThemeSwitcherDemo() {
  const { theme, setTheme } = usePreferences();
  const { tn } = useNavigationMessages();
  const [standalone, setStandalone] = useState<ThemeValue>("dark");

  const options = [
    { value: "dark" as const, label: tn("themeDark") },
    { value: "light" as const, label: tn("themeLight") },
  ];

  return <>
    <PageHeader eyebrow={tn("brandNav")} title={tn("themeTitle")} description={tn("themeIntro")} />

    <Section title={tn("themeControlled")}><DemoPanel>
      <ThemeSwitcher
        value={theme}
        onValueChange={(next) => setTheme(next)}
        options={options}
        groupLabel={tn("themeGroup")}
      />
      <p className="ds-inline-status" role="status" style={{ marginTop: 16 }}>
        {tn("themeCurrent")}: {theme === "dark" ? tn("themeDark") : tn("themeLight")}
      </p>
    </DemoPanel></Section>

    <Section title={tn("themeIconOnly")}><DemoPanel>
      <ThemeSwitcher
        iconOnly
        value={theme}
        onValueChange={(next) => setTheme(next)}
        options={options}
        groupLabel={tn("themeGroup")}
      />
    </DemoPanel></Section>

    <Section title={tn("themeStandalone")}><DemoPanel>
      <ThemeSwitcher
        value={standalone}
        onValueChange={setStandalone}
        options={options}
        groupLabel={tn("themeGroup")}
      />
      <p className="ds-inline-status" role="status" style={{ marginTop: 16 }}>
        {tn("themeCurrent")}: {standalone === "dark" ? tn("themeDark") : tn("themeLight")}
      </p>
      <p className="ds-helper" style={{ marginTop: 8 }}>{tn("demoOnly")}</p>
    </DemoPanel></Section>

    <Guidelines items={[{ kind: "do", text: tn("themeDo") }, { kind: "dont", text: tn("themeDont") }]} />
  </>;
}
