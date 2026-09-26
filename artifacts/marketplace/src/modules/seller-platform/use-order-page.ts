import { useEffect, useState } from "react";
import { api } from "../../api";
import { useSellerWorkspace } from "./SellerShell";
import type { SellerOrder } from "./operations-ui";

type Filters = {
  q: string;
  lang: string;
  status: string;
  period: string;
  sort: string;
};
type OrderRow = Omit<
  SellerOrder,
  "messageCount" | "unreadCount" | "lastMessage" | "messageAt"
>;
type List = {
  sellerId: string;
  canReply: boolean;
  orders: OrderRow[];
  nextCursor: string | null;
  asOf: string;
};
type Summary = {
  sellerId: string;
  asOf: string;
  priorities: Record<string, number>;
  tabs: Record<string, number>;
  matchedCount: number;
  matchedTotalCents: number;
  containsDemo: boolean;
};
export function useOrderPage(filters: Filters) {
  const { seller, directoryState, reloadDirectory } = useSellerWorkspace();
  const query = new URLSearchParams(filters).toString();
  const scope = seller + "?" + query;
  const [navigation, setNavigation] = useState({
    scope,
    cursors: [""],
    page: 0,
    asOf: "",
  });
  const nav =
    navigation.scope === scope
      ? navigation
      : { scope, cursors: [""], page: 0, asOf: "" };
  const [revision, setRevision] = useState(0),
    [summaryRevision, setSummaryRevision] = useState(0);
  const key = JSON.stringify([
    scope,
    nav.cursors[nav.page],
    nav.asOf,
    revision,
  ]);
  const [list, setList] = useState<{
    key: string;
    data?: List;
    error?: boolean;
  }>();
  const data = list?.key === key ? list.data : undefined;
  const error =
    directoryState === "error" || (list?.key === key && !!list.error);
  useEffect(() => {
    if (!seller) return;
    let active = true;
    const params = new URLSearchParams(query);
    params.set("limit", "8");
    if (nav.cursors[nav.page]) params.set("cursor", nav.cursors[nav.page]);
    if (nav.asOf) params.set("asOf", nav.asOf);
    // Coalesce typing while immediately making previous results non-current.
    const timer = setTimeout(
      () => {
        api<List>("/seller/platform/" + seller + "/order-list?" + params)
          .then((data) => {
            if (active) setList({ key, data });
          })
          .catch(() => {
            if (active) setList({ key, error: true });
          });
      },
      filters.q ? 180 : 0,
    );
    return () => {
      active = false;
      clearTimeout(timer);
    };
  }, [key, seller]);
  const summaryAsOf = data?.asOf || nav.asOf;
  const summaryKey = summaryAsOf
    ? JSON.stringify([scope, summaryAsOf, summaryRevision])
    : "";
  const [aggregate, setAggregate] = useState<{
    key: string;
    data?: Summary;
    error?: boolean;
  }>();
  const summary = aggregate?.key === summaryKey ? aggregate.data : undefined;
  const summaryError = aggregate?.key === summaryKey && !!aggregate.error;
  useEffect(() => {
    if (!summaryAsOf || !seller) return;
    let active = true;
    const params = new URLSearchParams(query);
    params.set("asOf", summaryAsOf);
    api<Summary>("/seller/platform/" + seller + "/order-summary?" + params)
      .then((data) => {
        if (active) setAggregate({ key: summaryKey, data });
      })
      .catch(() => {
        if (active) setAggregate({ key: summaryKey, error: true });
      });
    return () => {
      active = false;
    };
  }, [summaryKey, seller]);
  function setPage(page: number) {
    if (page === 0) {
      setNavigation({
        scope,
        cursors: [""],
        page: 0,
        asOf: data?.asOf ?? nav.asOf,
      });
      return;
    }
    if (!data) return;
    const cursors = [...nav.cursors];
    if (page === nav.page + 1 && data.nextCursor)
      cursors[page] = data.nextCursor;
    if (!cursors[page]) return;
    setNavigation({ scope, cursors, page, asOf: data.asOf });
  }
  return {
    data,
    summary,
    error,
    summaryError,
    page: nav.page,
    setPage,
    retry: () => {
      if (directoryState === "error") reloadDirectory();
      else setRevision((v) => v + 1);
    },
    retrySummary: () => setSummaryRevision((v) => v + 1),
  };
}

