import { useMemo, useState } from "react";
import { Pencil } from "lucide-react";
import { Badge, OrderStatusBadge, type OrderStatus } from "../../components/ui/badge-status";
import { Button } from "../../components/ui/button";
import { Chip, ChipGroup } from "../../components/ui/chips";
import { InventoryTable, type InventoryColumn, type SortDirection } from "../../components/ui/data-table";
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "../../components/ui/pagination";
import { PriceBlock } from "../../components/ui/price";
import { usePreferences } from "../../hooks/use-preferences";
import { useDataMessages } from "../../lib/messages-data";
import { DemoPanel, Guidelines, PageHeader, Section } from "../parts";

type Row = {
  id: string; name: string; meta: string; game: string; condition: string;
  stock: number; price: number; status: OrderStatus;
};

const PAGE_SIZE = 4;

export default function DataTableDemo() {
  const { locale } = usePreferences();
  const { td } = useDataMessages();
  const [state, setState] = useState<"ready" | "loading" | "empty" | "error">("ready");
  const [sortColumn, setSortColumn] = useState<string | null>("price");
  const [sortDir, setSortDir] = useState<SortDirection>("desc");
  const [selected, setSelected] = useState<string[]>([]);
  const [page, setPage] = useState(1);
  const [note, setNote] = useState("");

  const allRows: Row[] = useMemo(() => [
    { id: "r1", name: td("cardCharizard"), meta: td("cardMeta"), game: td("gamePokemon"), condition: td("condNM"), stock: 3, price: 189.99, status: "delivered" },
    { id: "r2", name: td("cardPikachu"), meta: "043/185", game: td("gamePokemon"), condition: td("condLP"), stock: 0, price: 24.5, status: "cancelled" },
    { id: "r3", name: td("cardLuffy"), meta: "OP05-119", game: td("gameOnePiece"), condition: td("condNM"), stock: 5, price: 42.0, status: "processing" },
    { id: "r4", name: td("cardBolt"), meta: "M11 · 146", game: td("gameMagic"), condition: td("condNM"), stock: 12, price: 3.25, status: "shipped" },
    { id: "r5", name: "Ace", meta: "OP02-013", game: td("gameOnePiece"), condition: td("condLP"), stock: 40, price: 0.75, status: "pending" },
    { id: "r6", name: "Black Lotus", meta: "CE", game: td("gameMagic"), condition: td("condMP"), stock: 1, price: 999.0, status: "delivered" },
  ], [td]);

  const sortedRows = useMemo(() => {
    if (!sortColumn || !sortDir) return allRows;
    const dir = sortDir === "asc" ? 1 : -1;
    return [...allRows].sort((a, b) => {
      if (sortColumn === "price") return (a.price - b.price) * dir;
      if (sortColumn === "stock") return (a.stock - b.stock) * dir;
      if (sortColumn === "name") return a.name.localeCompare(b.name) * dir;
      return 0;
    });
  }, [allRows, sortColumn, sortDir]);

  const pageCount = Math.max(1, Math.ceil(sortedRows.length / PAGE_SIZE));
  const currentPage = Math.min(page, pageCount);
  const pageRows = sortedRows.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE);

  const onSort = (columnId: string) => {
    if (sortColumn !== columnId) { setSortColumn(columnId); setSortDir("asc"); }
    else setSortDir(sortDir === "asc" ? "desc" : sortDir === "desc" ? null : "asc");
    setPage(1);
  };

  const statusLabel: Record<OrderStatus, string> = {
    pending: td("statusPending"), processing: td("statusLive"), shipped: td("statusLive"),
    delivered: td("statusLive"), cancelled: td("statusSold"),
  };

  const columns: InventoryColumn<Row>[] = [
    { id: "name", header: td("colCard"), sortable: true, cell: (r) => (
      <div style={{ display: "flex", flexDirection: "column" }}>
        <span style={{ fontWeight: 600 }}>{r.name}</span>
        <span style={{ fontSize: 11, color: "var(--text-muted)" }}>{r.meta}</span>
      </div>
    ) },
    { id: "game", header: td("colGame"), cell: (r) => <Badge variant="neutral">{r.game}</Badge> },
    { id: "condition", header: td("colCondition"), cell: (r) => <Badge variant="outline">{r.condition}</Badge> },
    { id: "stock", header: td("colStock"), numeric: true, sortable: true, cell: (r) => (
      <span>{r.stock === 0 ? <Badge variant="destructive">{td("statusSold")}</Badge> : r.stock}</span>
    ) },
    { id: "price", header: td("colPrice"), numeric: true, sortable: true, cell: (r) => <PriceBlock amount={r.price} locale={locale} size="sm" /> },
    { id: "status", header: td("colStatus"), cell: (r) => <OrderStatusBadge status={r.status} label={statusLabel[r.status]} /> },
  ];

  const displayedRows = state === "ready" ? pageRows : [];

  return (
    <>
      <PageHeader eyebrow={td("eyebrow")} title={td("tableTitle")} description={td("tableIntro")} />

      <Section title={td("showState")}>
        <DemoPanel>
          <ChipGroup label={td("showState")}>
            {([["ready", td("stateReady")], ["loading", td("stateLoading")], ["empty", td("stateEmpty")], ["error", td("stateError")]] as const).map(([value, label]) => (
              <Chip key={value} selectable selected={state === value} onSelectedChange={() => setState(value)}>{label}</Chip>
            ))}
          </ChipGroup>

          <div style={{ marginTop: 20 }}>
            <InventoryTable
              caption={td("tableCaption")}
              scrollLabel={td("scrollLabel")}
              columns={columns}
              rows={displayedRows}
              getRowId={(r) => r.id}
              sortColumn={sortColumn}
              sortDirection={sortDir}
              onSort={onSort}
              sortLabel={(header) => `${td("sortColumn")} ${header}`}
              selectable
              selectedIds={selected}
              onToggleRow={(id) => setSelected(selected.includes(id) ? selected.filter((s) => s !== id) : [...selected, id])}
              onToggleAll={() => setSelected(displayedRows.every((r) => selected.includes(r.id)) ? [] : displayedRows.map((r) => r.id))}
              selectRowLabel={(r) => `${td("selectRow")} ${r.name}`}
              selectAllLabel={td("selectAll")}
              rowActionHeader={td("colActions")}
              rowAction={(r) => (
                <Button variant="ghost" size="sm" onClick={() => setNote(td("edited"))} aria-label={`${td("editRow")} ${r.name}`}>
                  <Pencil aria-hidden="true" />{td("editRow")}
                </Button>
              )}
              loading={state === "loading"}
              error={state === "error" ? (
                <div className="ds-stack" style={{ alignItems: "center", gap: 8 }}>
                  <span>{td("tableError")}</span>
                  <Button variant="outline" size="sm" onClick={() => setState("ready")}>{td("tableRetry")}</Button>
                </div>
              ) : undefined}
              empty={state === "empty" ? td("tableEmpty") : undefined}
            />
          </div>

          {state === "ready" && (
            <div style={{ marginTop: 16, display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12, flexWrap: "wrap" }}>
              <p className="ds-inline-status" role="status" style={{ margin: 0 }}>
                {selected.length > 0 ? `${selected.length} ${td("selectedCount")}` : note || td("demoOnly")}
              </p>
              <Pagination label={td("pageLabel")}>
                <PaginationContent>
                  <PaginationItem>
                    <PaginationPrevious label={td("prevPage")} disabled={currentPage === 1} onClick={() => setPage((p) => Math.max(1, p - 1))} />
                  </PaginationItem>
                  {Array.from({ length: pageCount }).map((_, index) => (
                    <PaginationItem key={index}>
                      <PaginationLink isActive={currentPage === index + 1} onClick={() => setPage(index + 1)} aria-label={`${td("pageLabel")} ${index + 1}`}>
                        {index + 1}
                      </PaginationLink>
                    </PaginationItem>
                  ))}
                  <PaginationItem>
                    <PaginationNext label={td("nextPage")} disabled={currentPage === pageCount} onClick={() => setPage((p) => Math.min(pageCount, p + 1))} />
                  </PaginationItem>
                </PaginationContent>
              </Pagination>
            </div>
          )}
        </DemoPanel>
      </Section>

      <Guidelines items={[{ kind: "do", text: td("tableDo") }, { kind: "dont", text: td("tableDont") }]} />
    </>
  );
}
