import { useState } from "react";
import { Button } from "../../components/ui/button";
import { Chip, ChipGroup } from "../../components/ui/chips";
import { usePreferences } from "../../hooks/use-preferences";
import { useControlsMessages, type ControlsMessageKey } from "../../lib/messages-controls";
import { DemoPanel, games, Guidelines, PageHeader, Section } from "../parts";

const filterKeys: ControlsMessageKey[] = ["foil", "graded", "firstEdition", "sealed"];

export default function ChipsDemo() {
  usePreferences();
  const { tc } = useControlsMessages();
  const [selected, setSelected] = useState<Record<string, boolean>>({ foil: true });
  const [removable, setRemovable] = useState<string[]>(["foil", "graded", "firstEdition"]);
  const [selectedGames, setSelectedGames] = useState<string[]>(["pokemon"]);

  const toggleGame = (value: string) =>
    setSelectedGames((prev) => (prev.includes(value) ? prev.filter((v) => v !== value) : [...prev, value]));

  return <>
    <PageHeader eyebrow={tc("chipsEyebrow")} title={tc("chipsTitle")} description={tc("chipsIntro")} />

    <Section title={tc("staticChips")}><DemoPanel>
      <ChipGroup label={tc("staticChips")}>
        <Chip>{tc("nearMint")}</Chip>
        <Chip game>{tc("foil")}</Chip>
        <Chip aria-disabled="true">{tc("disabledOption")}</Chip>
      </ChipGroup>
    </DemoPanel></Section>

    <Section title={tc("filterChips")}><DemoPanel>
      <ChipGroup label={tc("filterChips")}>
        {filterKeys.map((key) => (
          <Chip key={key} selectable selected={!!selected[key]} onSelectedChange={(value) => setSelected((prev) => ({ ...prev, [key]: value }))}>
            {tc(key)}
          </Chip>
        ))}
        <Chip selectable disabled>{tc("disabledOption")}</Chip>
      </ChipGroup>
      <p className="ds-inline-status" role="status">{tc("selectedGames")}: {filterKeys.filter((k) => selected[k]).map((k) => tc(k)).join(", ") || tc("none")}</p>
    </DemoPanel></Section>

    <Section title={tc("removableChips")}><DemoPanel>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 12 }}>
        <span className="ds-small-heading">{tc("activeFilters")}</span>
        {removable.length > 0 && <Button variant="ghost" size="sm" onClick={() => setRemovable([])}>{tc("resetFilters")}</Button>}
      </div>
      <div aria-live="polite" style={{ marginTop: 8 }}>
        {removable.length === 0 ? (
          <p className="ds-helper">{tc("noFilters")}</p>
        ) : (
          <ChipGroup label={tc("activeFilters")}>
            {removable.map((key) => (
              <Chip key={key} onRemove={() => setRemovable((prev) => prev.filter((v) => v !== key))} removeLabel={`${tc("remove")}: ${tc(key as ControlsMessageKey)}`}>
                {tc(key as ControlsMessageKey)}
              </Chip>
            ))}
          </ChipGroup>
        )}
      </div>
    </DemoPanel></Section>

    <Section title={tc("gameChips")}><DemoPanel>
      <ChipGroup label={tc("gameChips")}>
        {games.map((game) => (
          <Chip key={game.value} game selectable selected={selectedGames.includes(game.value)} onSelectedChange={() => toggleGame(game.value)}>
            {game.label}
          </Chip>
        ))}
      </ChipGroup>
      <p className="ds-inline-status" role="status">{tc("selectedGames")}: {selectedGames.map((v) => games.find((g) => g.value === v)?.label).join(", ") || tc("none")}</p>
    </DemoPanel></Section>

    <Guidelines items={[{ kind: "do", text: tc("chipsDo") }, { kind: "dont", text: tc("chipsDont") }]} />
  </>;
}
