import { useMemo, useState } from "react";
import { Button } from "../../components/ui/button";
import { Chip, ChipGroup } from "../../components/ui/chips";
import { FilterBar, FilterGroup, SortControl } from "../../components/ui/data-controls";
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
import { PriceBlock } from "../../components/ui/price";
import { usePreferences } from "../../hooks/use-preferences";
import { useDataMessages } from "../../lib/messages-data";
import { DemoPanel, Guidelines, PageHeader, Section } from "../parts";

type Card = { id: string; name: string; game: "pokemon" | "magic" | "onepiece"; condition: "NM" | "LP" | "MP"; price: number; stock: number };

const SAMPLE: Card[] = [
  { id: "c1", name: "Charizard ex", game: "pokemon", condition: "NM", price: 189.99, stock: 3 },
  { id: "c2", name: "Pikachu V", game: "pokemon", condition: "LP", price: 24.5, stock: 0 },
  { id: "c3", name: "Black Lotus", game: "magic", condition: "MP", price: 999.0, stock: 1 },
  { id: "c4", name: "Lightning Bolt", game: "magic", condition: "NM", price: 3.25, stock: 12 },
  { id: "c5", name: "Monkey D. Luffy", game: "onepiece", condition: "NM", price: 42.0, stock: 5 },
  { id: "c6", name: "Ace", game: "onepiece", condition: "LP", price: 0.75, stock: 40 },
];

export default function DataControlsDemo() {
  const { locale } = usePreferences();
  const { td } = useDataMessages();
  const [games, setGames] = useState<string[]>([]);
  const [conditions, setConditions] = useState<string[]>([]);
  const [inStock, setInStock] = useState(false);
  const [sort, setSort] = useState("relevance");
  const [loading, setLoading] = useState(false);

  const activeCount = games.length + conditions.length + (inStock ? 1 : 0);

  const results = useMemo(() => {
    let rows = SAMPLE.filter((card) =>
      (games.length === 0 || games.includes(card.game)) &&
      (conditions.length === 0 || conditions.includes(card.condition)) &&
      (!inStock || card.stock > 0)
    );
    if (sort === "price-asc") rows = [...rows].sort((a, b) => a.price - b.price);
    else if (sort === "price-desc") rows = [...rows].sort((a, b) => b.price - a.price);
    else if (sort === "name-asc") rows = [...rows].sort((a, b) => a.name.localeCompare(b.name));
    return rows;
  }, [games, conditions, inStock, sort]);

  const toggle = (list: string[], setList: (v: string[]) => void, value: string) =>
    setList(list.includes(value) ? list.filter((v) => v !== value) : [...list, value]);

  const clearAll = () => { setGames([]); setConditions([]); setInStock(false); };

  const gameOptions = [
    { value: "pokemon", label: td("gamePokemon") },
    { value: "magic", label: td("gameMagic") },
    { value: "onepiece", label: td("gameOnePiece") },
  ];
  const condOptions = [
    { value: "NM", label: td("condNM") },
    { value: "LP", label: td("condLP") },
    { value: "MP", label: td("condMP") },
  ];
  const sortOptions = [
    { value: "relevance", label: td("sortRelevance") },
    { value: "price-asc", label: td("sortPriceAsc") },
    { value: "price-desc", label: td("sortPriceDesc") },
    { value: "name-asc", label: td("sortNameAsc") },
  ];

  const gameFilters = (
    <FilterGroup label={td("filterGame")}>
      <ChipGroup label={td("filterGame")}>
        {gameOptions.map((g) => (
          <Chip key={g.value} selectable selected={games.includes(g.value)} disabled={loading} onSelectedChange={() => toggle(games, setGames, g.value)}>{g.label}</Chip>
        ))}
      </ChipGroup>
    </FilterGroup>
  );
  const conditionFilters = (
    <FilterGroup label={td("filterCondition")}>
      <ChipGroup label={td("filterCondition")}>
        {condOptions.map((c) => (
          <Chip key={c.value} selectable selected={conditions.includes(c.value)} disabled={loading} onSelectedChange={() => toggle(conditions, setConditions, c.value)}>{c.label}</Chip>
        ))}
      </ChipGroup>
    </FilterGroup>
  );
  const stockFilter = (
    <label className="troc-choice">
      <Switch checked={inStock} onCheckedChange={setInStock} disabled={loading} aria-label={td("filterInStock")} />
      <span className="troc-choice-label">{td("filterInStock")}</span>
    </label>
  );

  const resultList = (
    <ul className="ds-stack" aria-busy={loading} style={{ listStyle: "none", padding: 0, margin: 0, gap: 8 }}>
      {loading ? (
        <li className="ds-inline-status" role="status">{td("loadingLabel")}</li>
      ) : results.length === 0 ? (
        <li className="ds-inline-status">{td("noResults")}</li>
      ) : (
        results.map((card) => (
          <li key={card.id} style={{ display: "flex", justifyContent: "space-between", gap: 12, padding: "10px 12px", border: "1px solid var(--border)", borderRadius: "var(--radius-md)" }}>
            <span style={{ fontWeight: 600 }}>{card.name}</span>
            <PriceBlock amount={card.price} locale={locale} size="sm" />
          </li>
        ))
      )}
    </ul>
  );

  return (
    <>
      <PageHeader eyebrow={td("eyebrow")} title={td("controlsTitle")} description={td("controlsIntro")} />

      <Section title={td("filtersLabel")}>
        <DemoPanel>
          {/* Desktop inline */}
          <div className="ds-desktop-only">
            <FilterBar
              label={td("filtersLabel")}
              activeCount={activeCount}
              clearLabel={td("clearAll")}
              onClear={clearAll}
              disabled={loading}
              trailing={<SortControl label={td("sortBy")} value={sort} onValueChange={setSort} options={sortOptions} disabled={loading} />}
            >
              {gameFilters}
              {conditionFilters}
              <FilterGroup label={td("filterInStock")}>{stockFilter}</FilterGroup>
            </FilterBar>
          </div>

          {/* Mobile drawer */}
          <div className="ds-mobile-only" style={{ gap: 12, alignItems: "center", flexWrap: "wrap" }}>
            <Drawer direction="bottom">
              <DrawerTrigger asChild>
                <Button variant="outline">
                  {td("openFilters")}{activeCount > 0 ? ` (${activeCount})` : ""}
                </Button>
              </DrawerTrigger>
              <DrawerContent side="bottom" closeLabel={td("close")}>
                <DrawerHeader>
                  <DrawerTitle>{td("filtersLabel")}</DrawerTitle>
                  <DrawerDescription>{td("controlsIntro")}</DrawerDescription>
                </DrawerHeader>
                <div className="ds-stack" style={{ gap: 16 }}>
                  {gameFilters}
                  {conditionFilters}
                  {stockFilter}
                  <SortControl label={td("sortBy")} value={sort} onValueChange={setSort} options={sortOptions} />
                </div>
                <DrawerFooter>
                  <Button variant="ghost" onClick={clearAll} disabled={activeCount === 0}>{td("clearAll")}</Button>
                  <DrawerClose asChild><Button>{td("applyFilters")}</Button></DrawerClose>
                </DrawerFooter>
              </DrawerContent>
            </Drawer>
            <SortControl label={td("sortBy")} value={sort} onValueChange={setSort} options={sortOptions} hideLabel />
          </div>

          <div style={{ marginTop: 20, display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12, flexWrap: "wrap" }}>
            <p className="ds-inline-status" role="status" style={{ margin: 0 }}>
              {loading ? td("loadingLabel") : `${results.length} ${td("resultsCount")}${activeCount > 0 ? ` · ${activeCount} ${td("activeFilters")}` : ""}`}
            </p>
            <Button variant="outline" size="sm" onClick={() => { setLoading(true); window.setTimeout(() => setLoading(false), 1200); }}>{td("toggleLoading")}</Button>
          </div>

          <div style={{ marginTop: 12 }}>{resultList}</div>
          <p className="ds-helper" style={{ marginTop: 16 }}>{td("demoOnly")}</p>
        </DemoPanel>
      </Section>

      <Guidelines items={[{ kind: "do", text: td("controlsDo") }, { kind: "dont", text: td("controlsDont") }]} />
    </>
  );
}
