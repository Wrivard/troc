import { useMemo, useState } from "react";
import { GlobalSearch, type GlobalSearchSuggestion } from "../../components/ui/global-search";
import { Chip, ChipGroup } from "../../components/ui/chips";
import { usePreferences } from "../../hooks/use-preferences";
import { useNavigationMessages } from "../../lib/messages-navigation";
import { DemoPanel, Guidelines, PageHeader, Section } from "../parts";

type DemoState = "normal" | "loading" | "empty" | "error";

const catalog: { value: string; title: string; meta: string; group: "cards" | "sets" | "sellers" }[] = [
  { value: "charizard", title: "Charizard ex · 199/165", meta: "Scarlet & Violet · from $18.50 CAD", group: "cards" },
  { value: "pikachu", title: "Pikachu · 025/198", meta: "Scarlet & Violet · from $2.10 CAD", group: "cards" },
  { value: "luffy", title: "Monkey D. Luffy · OP05-119", meta: "One Piece · from $9.75 CAD", group: "cards" },
  { value: "blueeyes", title: "Blue-Eyes White Dragon · LOB", meta: "Yu-Gi-Oh! · from $6.40 CAD", group: "cards" },
  { value: "lightning", title: "Lightning Bolt · M11", meta: "Magic · from $0.85 CAD", group: "cards" },
  { value: "sv151", title: "Scarlet & Violet 151", meta: "Pokémon set", group: "sets" },
  { value: "op05", title: "One Piece OP-05", meta: "One Piece set", group: "sets" },
  { value: "maplecards", title: "Maple City Cards", meta: "Verified · Ontario", group: "sellers" },
  { value: "northtcg", title: "North TCG", meta: "Top Seller · Québec", group: "sellers" },
];

export default function GlobalSearchDemo() {
  usePreferences();
  const { tn } = useNavigationMessages();
  const [query, setQuery] = useState("");
  const [state, setState] = useState<DemoState>("normal");
  const [selected, setSelected] = useState<string | null>(null);

  const groupLabels = { cards: tn("searchGroupCards"), sets: tn("searchGroupSets"), sellers: tn("searchGroupSellers") };

  const suggestions = useMemo<GlobalSearchSuggestion[]>(() => {
    if (state === "loading" || state === "error") return [];
    const q = query.trim().toLowerCase();
    const filtered = q ? catalog.filter((c) => c.title.toLowerCase().includes(q) || c.meta.toLowerCase().includes(q)) : catalog;
    if (state === "empty") return [];
    return filtered.map((c) => ({ value: c.value, title: c.title, meta: c.meta, group: groupLabels[c.group] }));
  }, [query, state, groupLabels]);

  return <>
    <PageHeader eyebrow={tn("brandNav")} title={tn("searchTitle")} description={tn("searchIntro")} />

    <Section title={tn("default")}><DemoPanel>
      <div style={{ maxWidth: 520 }}>
        <GlobalSearch
          label={tn("searchLabel")}
          placeholder={tn("searchPlaceholder")}
          value={query}
          onValueChange={setQuery}
          suggestions={state === "empty" ? [] : suggestions}
          onSelect={(s) => setSelected(s.title)}
          onSubmit={(q) => setSelected(q ? `“${q}”` : null)}
          loading={state === "loading"}
          error={state === "error" ? tn("searchError") : null}
          loadingLabel={tn("searchLoading")}
          emptyLabel={tn("searchEmpty")}
          clearLabel={tn("searchClear")}
          submitLabel={tn("searchSubmit")}
        />
      </div>
      <p className="ds-helper" style={{ marginTop: 16 }}>{query ? "" : tn("searchIdle")}</p>
      <p className="ds-inline-status" role="status">{selected ? `${tn("searchSelected")}: ${selected}` : ""}</p>
    </DemoPanel></Section>

    <Section title={tn("states")}><DemoPanel>
      <ChipGroup label={tn("states")}>
        {(["normal", "loading", "empty", "error"] as DemoState[]).map((s) => (
          <Chip key={s} selectable selected={state === s} onSelectedChange={() => setState(s)}>
            {s === "normal" ? tn("default") : s === "loading" ? tn("searchStateLoading") : s === "empty" ? tn("searchStateEmpty") : tn("searchStateError")}
          </Chip>
        ))}
      </ChipGroup>
      <p className="ds-helper" style={{ marginTop: 12 }}>{tn("searchStateNote")} · {tn("demoOnly")}</p>
    </DemoPanel></Section>

    <Guidelines items={[{ kind: "do", text: tn("searchDo") }, { kind: "dont", text: tn("searchDont") }]} />
  </>;
}
