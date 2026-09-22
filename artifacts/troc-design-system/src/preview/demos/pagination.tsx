import { useState } from "react";
import {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "../../components/ui/pagination";
import { usePreferences } from "../../hooks/use-preferences";
import { useNavigationMessages } from "../../lib/messages-navigation";
import { DemoPanel, Guidelines, PageHeader, Section } from "../parts";

const TOTAL = 12;

/** Compute a windowed page list with ellipsis sentinels (-1). */
function pageWindow(current: number, total: number): number[] {
  if (total <= 7) return Array.from({ length: total }, (_, i) => i + 1);
  const pages = new Set<number>([1, total, current, current - 1, current + 1]);
  const sorted = [...pages].filter((p) => p >= 1 && p <= total).sort((a, b) => a - b);
  const result: number[] = [];
  let prev = 0;
  for (const p of sorted) {
    if (p - prev > 1) result.push(-1);
    result.push(p);
    prev = p;
  }
  return result;
}

export default function PaginationDemo() {
  usePreferences();
  const { tn } = useNavigationMessages();
  const [page, setPage] = useState(1);
  const [compactPage, setCompactPage] = useState(4);
  const go = (next: number) => setPage(Math.min(Math.max(next, 1), TOTAL));

  return <>
    <PageHeader eyebrow={tn("brandNav")} title={tn("paginationTitle")} description={tn("paginationIntro")} />

    <Section title={tn("paginationFull")}><DemoPanel>
      <Pagination className="troc-pagination--full" label={tn("paginationLabel")}>
        <PaginationContent>
          <PaginationItem className="troc-pagination-prev">
            <PaginationPrevious label={tn("paginationPrev")} disabled={page === 1} onClick={() => go(page - 1)}>
              <span>{tn("paginationPrevShort")}</span>
            </PaginationPrevious>
          </PaginationItem>
          {pageWindow(page, TOTAL).map((p, index) =>
            p === -1 ? (
              <PaginationItem key={`gap-${index}`} className="troc-pagination-numbers">
                <PaginationEllipsis label={tn("paginationEllipsis")} />
              </PaginationItem>
            ) : (
              <PaginationItem key={p} className="troc-pagination-numbers">
                <PaginationLink
                  isActive={p === page}
                  aria-label={`${tn("paginationGoTo")} ${p}`}
                  onClick={() => go(p)}
                >
                  {p}
                </PaginationLink>
              </PaginationItem>
            )
          )}
          <PaginationItem className="troc-pagination-next">
            <PaginationNext label={tn("paginationNext")} disabled={page === TOTAL} onClick={() => go(page + 1)}>
              <span>{tn("paginationNextShort")}</span>
            </PaginationNext>
          </PaginationItem>
        </PaginationContent>
      </Pagination>
      <p className="ds-inline-status" role="status" style={{ marginTop: 16 }}>
        {tn("paginationPage")} {page} {tn("paginationOf")} {TOTAL} · {tn("paginationResults")}
      </p>
    </DemoPanel></Section>

    <Section title={tn("paginationCompact")}><DemoPanel>
      <Pagination className="troc-pagination--compact" label={tn("paginationLabel")}>
        <PaginationContent>
          <PaginationItem className="troc-pagination-prev">
            <PaginationPrevious label={tn("paginationPrev")} disabled={compactPage === 1} onClick={() => setCompactPage((p) => Math.max(p - 1, 1))} />
          </PaginationItem>
          <PaginationItem>
            <span className="troc-pagination-status">{compactPage} {tn("paginationOf")} {TOTAL}</span>
          </PaginationItem>
          <PaginationItem className="troc-pagination-next">
            <PaginationNext label={tn("paginationNext")} disabled={compactPage === TOTAL} onClick={() => setCompactPage((p) => Math.min(p + 1, TOTAL))} />
          </PaginationItem>
        </PaginationContent>
      </Pagination>
      <p className="ds-helper" style={{ marginTop: 12 }}>{tn("demoOnly")}</p>
    </DemoPanel></Section>

    <Guidelines items={[{ kind: "do", text: tn("paginationDo") }, { kind: "dont", text: tn("paginationDont") }]} />
  </>;
}
