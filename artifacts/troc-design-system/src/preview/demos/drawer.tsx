import { useState } from "react";
import { Button } from "../../components/ui/button";
import { Chip, ChipGroup } from "../../components/ui/chips";
import {
  Drawer,
  DrawerClose,
  DrawerContent,
  DrawerDescription,
  DrawerFooter,
  DrawerHeader,
  DrawerTitle,
  DrawerTrigger,
} from "../../components/ui/drawer";
import { Switch } from "../../components/ui/selection-controls";
import { usePreferences } from "../../hooks/use-preferences";
import { useOverlaysMessages } from "../../lib/messages-overlays";
import { useControlsMessages } from "../../lib/messages-controls";
import { DemoPanel, games, Guidelines, PageHeader, Section } from "../parts";

const conditions = ["nearMint", "lightlyPlayed", "moderatelyPlayed"] as const;

export default function DrawerDemo() {
  usePreferences();
  const { to } = useOverlaysMessages();
  const { tc } = useControlsMessages();
  const [game, setGame] = useState("pokemon");
  const [condition, setCondition] = useState("nearMint");
  const [foilOnly, setFoilOnly] = useState(false);

  return (
    <>
      <PageHeader eyebrow={to("overlaysEyebrow")} title={to("drawerTitle")} description={to("drawerIntro")} />

      <Section title={to("drawerBottom")}>
        <DemoPanel>
          <Drawer direction="bottom">
            <DrawerTrigger asChild>
              <Button variant="outline">{to("drawerFiltersTrigger")}</Button>
            </DrawerTrigger>
            <DrawerContent side="bottom" closeLabel={to("close")}>
              <DrawerHeader>
                <DrawerTitle>{to("drawerFiltersHeading")}</DrawerTitle>
                <DrawerDescription>{to("drawerFiltersDescription")}</DrawerDescription>
              </DrawerHeader>

              <div className="ds-stack" style={{ gap: 16 }}>
                <div>
                  <h3 className="ds-small-heading">{to("drawerGame")}</h3>
                  <ChipGroup label={to("drawerGame")}>
                    {games.map((g) => (
                      <Chip key={g.value} selectable selected={game === g.value} onSelectedChange={() => setGame(g.value)}>
                        {g.label}
                      </Chip>
                    ))}
                  </ChipGroup>
                </div>
                <div>
                  <h3 className="ds-small-heading">{to("drawerCondition")}</h3>
                  <ChipGroup label={to("drawerCondition")}>
                    {conditions.map((key) => (
                      <Chip key={key} selectable selected={condition === key} onSelectedChange={() => setCondition(key)}>
                        {tc(key)}
                      </Chip>
                    ))}
                  </ChipGroup>
                </div>
                <label className="troc-choice">
                  <Switch checked={foilOnly} onCheckedChange={setFoilOnly} aria-label={to("drawerFoilOnly")} />
                  <span className="troc-choice-label">{to("drawerFoilOnly")}</span>
                </label>
              </div>

              <DrawerFooter>
                <DrawerClose asChild>
                  <Button variant="ghost">{to("cancel")}</Button>
                </DrawerClose>
                <DrawerClose asChild>
                  <Button>{to("drawerApply")}</Button>
                </DrawerClose>
              </DrawerFooter>
            </DrawerContent>
          </Drawer>
        </DemoPanel>
      </Section>

      <Section title={to("drawerSide")}>
        <DemoPanel>
          <Drawer direction="right">
            <DrawerTrigger asChild>
              <Button variant="outline">{to("drawerCartTrigger")}</Button>
            </DrawerTrigger>
            <DrawerContent side="right" closeLabel={to("close")}>
              <DrawerHeader>
                <DrawerTitle>{to("drawerCartHeading")}</DrawerTitle>
                <DrawerDescription>{to("drawerCartDescription")}</DrawerDescription>
              </DrawerHeader>
              <ChipGroup label={to("drawerCartHeading")}>
                <Chip game>{games[0].label}</Chip>
                <Chip game>{games[1].label}</Chip>
                <Chip game>{games[3].label}</Chip>
              </ChipGroup>
              <DrawerFooter>
                <DrawerClose asChild>
                  <Button variant="ghost">{to("close")}</Button>
                </DrawerClose>
                <Button>{to("drawerCheckout")}</Button>
              </DrawerFooter>
            </DrawerContent>
          </Drawer>
          <p className="ds-helper" style={{ marginTop: 16 }}>{to("demoOnly")}</p>
        </DemoPanel>
      </Section>

      <Guidelines items={[{ kind: "do", text: to("drawerDo") }, { kind: "dont", text: to("drawerDont") }]} />
    </>
  );
}
