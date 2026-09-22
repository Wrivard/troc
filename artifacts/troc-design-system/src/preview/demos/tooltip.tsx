import { Button } from "../../components/ui/button";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "../../components/ui/tooltip";
import { usePreferences } from "../../hooks/use-preferences";
import { useOverlaysMessages } from "../../lib/messages-overlays";
import { DemoPanel, Guidelines, PageHeader, Section } from "../parts";

const sides = [
  { side: "top" as const, key: "tooltipTop" as const },
  { side: "right" as const, key: "tooltipRight" as const },
  { side: "bottom" as const, key: "tooltipBottom" as const },
  { side: "left" as const, key: "tooltipLeft" as const },
];

export default function TooltipDemo() {
  usePreferences();
  const { to } = useOverlaysMessages();

  return (
    <TooltipProvider delayDuration={200}>
      <PageHeader eyebrow={to("overlaysEyebrow")} title={to("tooltipTitle")} description={to("tooltipIntro")} />

      <Section title={to("tooltipPlacements")}>
        <DemoPanel>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 24, padding: "24px 8px" }}>
            {sides.map(({ side, key }) => (
              <Tooltip key={side}>
                <TooltipTrigger asChild>
                  <Button variant="outline">{to(key)}</Button>
                </TooltipTrigger>
                <TooltipContent side={side}>{to("tooltipPlacementBody", { side: to(key).toLowerCase() })}</TooltipContent>
              </Tooltip>
            ))}
          </div>
        </DemoPanel>
      </Section>

      <Section title={to("tooltipKeyboard")}>
        <DemoPanel>
          <div style={{ display: "flex", flexWrap: "wrap", alignItems: "center", gap: 16 }}>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button variant="ghost">{to("tooltipConditionTrigger")}</Button>
              </TooltipTrigger>
              <TooltipContent side="bottom">{to("tooltipConditionBody")}</TooltipContent>
            </Tooltip>
            <p className="ds-helper" style={{ margin: 0, maxWidth: 360 }}>{to("tooltipKeyboardHint")}</p>
          </div>
        </DemoPanel>
      </Section>

      <Guidelines items={[{ kind: "do", text: to("tooltipDo") }, { kind: "dont", text: to("tooltipDont") }]} />
    </TooltipProvider>
  );
}
