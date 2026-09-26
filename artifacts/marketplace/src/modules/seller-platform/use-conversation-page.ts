import { useEffect, useState } from "react";
import { api } from "../../api";
import type { SellerOrder } from "./operations-ui";
export type ConversationRow = Pick<
  SellerOrder,
  | "id"
  | "buyer"
  | "status"
  | "createdAt"
  | "demo"
  | "lastMessage"
  | "messageAt"
  | "unreadCount"
> & { hasMessages: boolean };
type Page = {
  sellerId: string;
  canReply: boolean;
  conversations: ConversationRow[];
  nextCursor: string | null;
};
type Context = { sellerId: string; canReply: boolean; order: SellerOrder };
export function useConversationPage(seller: string, q: string, filter: string) {
  const scope = JSON.stringify([seller, q, filter]);
  const [navigation, setNavigation] = useState({
    scope,
    page: 0,
    cursors: [""],
  });
  const nav =
    navigation.scope === scope ? navigation : { scope, page: 0, cursors: [""] };
  const [revision, setRevision] = useState(0);
  const key = JSON.stringify([scope, nav.cursors[nav.page], revision]);
  const [result, setResult] = useState<{
    key: string;
    data?: Page;
    error?: boolean;
  }>();
  useEffect(() => {
    if (!seller) return;
    let active = true;
    const params = new URLSearchParams({ q, filter, limit: "20" });
    if (nav.cursors[nav.page]) params.set("cursor", nav.cursors[nav.page]);
    const timer = setTimeout(
      () => {
        api<Page>("/seller/platform/" + seller + "/conversations?" + params)
          .then((data) => {
            if (active) setResult({ key, data });
          })
          .catch(() => {
            if (active) setResult({ key, error: true });
          });
      },
      q ? 180 : 0,
    );
    return () => {
      active = false;
      clearTimeout(timer);
    };
  }, [key, seller]);
  const data = result?.key === key ? result.data : undefined;
  return {
    data,
    error: result?.key === key && !!result.error,
    page: nav.page,
    retry: () => setRevision((v) => v + 1),
    refresh: () => {
      setNavigation({ scope, page: 0, cursors: [""] });
      setRevision((v) => v + 1);
    },
    navigate: (page: number) => {
      if (!data || page < 0) return;
      const cursors = [...nav.cursors];
      if (page === nav.page + 1 && data.nextCursor)
        cursors[page] = data.nextCursor;
      if (page > 0 && !cursors[page]) return;
      setNavigation({ scope, page, cursors });
    },
  };
}
export function useConversationContext(seller: string, id: string) {
  const [revision, setRevision] = useState(0);
  const key = JSON.stringify([seller, id, revision]);
  const [result, setResult] = useState<{
    key: string;
    data?: Context;
    error?: boolean;
  }>();
  useEffect(() => {
    if (!seller || !id) return;
    let active = true;
    api<Context>(
      "/seller/platform/" + seller + "/conversations/" + encodeURIComponent(id),
    )
      .then((data) => {
        if (active) setResult({ key, data });
      })
      .catch(() => {
        if (active) setResult({ key, error: true });
      });
    return () => {
      active = false;
    };
  }, [key, seller, id]);
  return {
    data: result?.key === key ? result.data : undefined,
    error: result?.key === key && !!result.error,
    retry: () => setRevision((v) => v + 1),
  };
}
