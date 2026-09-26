import {
  useConversationPage,
  useConversationContext,
} from "./use-conversation-page";
import { useSellerWorkspace } from "./SellerShell";
import { SellerEnquiries } from "./SellerEnquiries";
import { useEffect, useRef, useState, type RefObject } from "react";
import type { OrderView } from "@workspace/commerce";
import { Button } from "@workspace/troc-design-system/components/ui/button";
import { Input } from "@workspace/troc-design-system/components/ui/input";
import { Textarea } from "@workspace/troc-design-system/components/ui/textarea";
import { api } from "../../api";
import {
  useSellerCopy,
  OperationsPage,
  OperationsState,
  Product,
  Status,
  type SellerOrder,
} from "./operations-ui";
export function SellerMessages() {
  const { seller, directoryState, reloadDirectory } = useSellerWorkspace();
  const switchChannel = (next: string) => {
    if (
      window.dispatchEvent(
        new Event("troc:message-switch", { cancelable: true }),
      )
    )
      setChannel(next);
  };
  const [channel, setChannel] = useState("orders");
  const { t } = useSellerCopy();
  return (
    <OperationsPage
      title={t("Messages", "Messages")}
      description={t(
        "Answer buyer questions before and after a purchase.",
        "Répondez aux acheteurs avant et après leur achat.",
      )}
    >
      <div
        className="ops-tabs"
        aria-label={t("Message type", "Type de message")}
      >
        <button
          aria-pressed={channel === "orders"}
          onClick={() => switchChannel("orders")}
        >
          {t("Order conversations", "Conversations de commande")}
        </button>
        <button
          aria-pressed={channel === "general"}
          onClick={() => switchChannel("general")}
        >
          {t("Pre-sale enquiries", "Questions avant achat")}
        </button>
      </div>
      {channel === "general" ? (
        <SellerEnquiries key={seller} />
      ) : seller ? (
        <Inbox key={seller} seller={seller} />
      ) : (
        <OperationsState
          error={directoryState === "error"}
          reload={reloadDirectory}
        />
      )}
    </OperationsPage>
  );
}
function Inbox({ seller }: { seller: string }) {
  const { t, href, money, date } = useSellerCopy();
  const [q, setQ] = useState(""),
    [filter, setFilter] = useState("conversations"),
    [id, setId] = useState(
      () => new URLSearchParams(location.search).get("order") || "",
    ),
    [mobile, setMobile] = useState(
      () => !!new URLSearchParams(location.search).get("order"),
    );
  const [drafts, setDrafts] = useState<Record<string, string>>({});
  const attempts = useRef<Record<string, { body: string; key: string }>>({});
  const [updates, setUpdates] = useState<Record<string, Partial<SellerOrder>>>(
    {},
  );
  const state = useConversationPage(seller, q, filter);
  const context = useConversationContext(seller, id);
  useEffect(() => {
    if (!id && state.data?.conversations[0])
      setId(state.data.conversations[0].id);
  }, [id, state.data]);
  const order = context.data
    ? { ...context.data.order, ...updates[id] }
    : undefined;
  const conversations = (state.data?.conversations || []).map((o) => ({
    ...o,
    ...updates[o.id],
  }));
  const choose = (v: string) => {
    setId(v);
    setMobile(true);
  };
  return (
    <>
      <div className="ops-inbox-toolbar">
        <div className="ops-tabs">
          <button
            aria-pressed={filter === "conversations"}
            onClick={() => setFilter("conversations")}
          >
            {t("Conversations", "Conversations")}
          </button>
          <button
            aria-pressed={filter === "all"}
            onClick={() => setFilter("all")}
          >
            {t("All orders", "Toutes les commandes")}
          </button>
        </div>
        <Button variant="secondary" onClick={state.refresh}>
          {t("Refresh conversations", "Actualiser les conversations")}
        </Button>
        <Input
          aria-label={t("Search conversations", "Rechercher des conversations")}
          placeholder={t(
            "Search buyer or order…",
            "Rechercher un acheteur ou une commande…",
          )}
          value={q}
          onChange={(e) => setQ(e.target.value)}
        />
      </div>
      <div className={"ops-inbox" + (mobile ? " ops-inbox-open" : "")}>
        <section
          className="ops-conversations"
          aria-label={t("Conversations", "Conversations")}
        >
          {state.error ? (
            <div className="ops-empty" role="alert">
              <p>
                {t(
                  "Conversations could not load.",
                  "Impossible de charger les conversations.",
                )}
              </p>
              <Button variant="secondary" onClick={state.retry}>
                {t("Retry conversations", "Réessayer les conversations")}
              </Button>
            </div>
          ) : !state.data ? (
            <div
              role="status"
              aria-label={t(
                "Loading conversations",
                "Chargement des conversations",
              )}
              className="ops-inbox-skeleton"
            >
              {Array.from({ length: 6 }, (_, i) => (
                <div key={i} aria-hidden="true" />
              ))}
            </div>
          ) : null}
          {conversations.map((o) => (
            <button
              key={o.id}
              aria-pressed={id === o.id}
              onClick={() => choose(o.id)}
            >
              <span className="ops-avatar" aria-hidden="true">
                {o.buyer
                  .split(" ")
                  .slice(0, 2)
                  .map((w) => w[0])
                  .join("")}
              </span>
              <span>
                <strong>{o.buyer}</strong>
                {!!o.unreadCount && (
                  <small>
                    {t(o.unreadCount + " unread", o.unreadCount + " non lus")}
                  </small>
                )}
                <small>
                  #{o.id.slice(-4)} · {date(o.messageAt || o.createdAt)}
                </small>
                <span>
                  {o.lastMessage ||
                    t(
                      "Start an order conversation",
                      "Démarrer une conversation",
                    )}
                </span>
              </span>
            </button>
          ))}
          {state.data && !conversations.length && (
            <p className="ops-empty">
              {t(
                "No conversations match your search.",
                "Aucune conversation ne correspond.",
              )}
            </p>
          )}
          <nav
            className="ops-inbox-pager"
            aria-label={t("Conversation pages", "Pages de conversations")}
          >
            <Button
              variant="secondary"
              disabled={!state.data || state.page === 0}
              onClick={() => state.navigate(state.page - 1)}
            >
              {t("Previous", "Précédent")}
            </Button>
            <span>
              {t("Page ", "Page ")}
              {state.page + 1}
            </span>
            <Button
              variant="secondary"
              disabled={!state.data?.nextCursor}
              onClick={() => state.navigate(state.page + 1)}
            >
              {t("Next", "Suivant")}
            </Button>
          </nav>
        </section>
        {order ? (
          <>
            <Conversation
              onRead={() =>
                setUpdates((v) => ({
                  ...v,
                  [order.id]: { ...v[order.id], unreadCount: 0 },
                }))
              }
              onSent={(body) =>
                setUpdates((v) => ({
                  ...v,
                  [order.id]: {
                    lastMessage: body,
                    messageAt: new Date().toISOString(),
                    messageCount: order.messageCount + 1,
                  },
                }))
              }
              attempts={attempts}
              key={order.id}
              order={order}
              canReply={context.data?.canReply ?? false}
              draft={drafts[id] || ""}
              setDraft={(v) => setDrafts((d) => ({ ...d, [id]: v }))}
              back={() => setMobile(false)}
            />
            <aside
              className="ops-order-context"
              aria-label={t("Selected order", "Commande choisie")}
            >
              <section className="ops-panel">
                <div className="ops-panel-head">
                  <h2>{t("Order details", "Détails de la commande")}</h2>
                  <a href={href("/seller/orders/" + order.id)}>
                    {t("View order", "Voir")}
                  </a>
                </div>
                <Product order={order} />
                <dl>
                  <dt>{t("Order", "Commande")}</dt>
                  <dd>#{order.id.slice(-4)}</dd>
                  <dt>{t("Date", "Date")}</dt>
                  <dd>{date(order.createdAt)}</dd>
                  <dt>{t("Total", "Total")}</dt>
                  <dd>{money(order.totalCents)}</dd>
                  <dt>{t("Status", "État")}</dt>
                  <dd>
                    <Status value={order.status} />
                  </dd>
                </dl>
              </section>
              <section className="ops-panel">
                <h2>{t("Buyer", "Acheteur")}</h2>
                <p>{order.buyer}</p>
                <p>{order.province} · Canada</p>
                <a href={href("/seller/orders/" + order.id)}>
                  {t(
                    "View items and shipping details",
                    "Voir les articles et l’expédition",
                  )}
                </a>
              </section>
              <p className="ops-scope">
                {t(
                  "Messages are linked to orders. Use the pre-sale tab for questions without an order. Attachments are not available yet.",
                  "Les messages sont liés aux commandes. Utilisez les questions avant achat pour les échanges sans commande. Les pièces jointes ne sont pas encore disponibles.",
                )}
              </p>
            </aside>
          </>
        ) : id ? (
          <section
            className="ops-conversation ops-empty"
            role={context.error ? "alert" : "status"}
            aria-label={t("Selected conversation", "Conversation choisie")}
          >
            <Button
              className="ops-back"
              variant="secondary"
              onClick={() => setMobile(false)}
            >
              {t("Back to conversations", "Retour aux conversations")}
            </Button>
            {context.error ? (
              <>
                <p>
                  {t(
                    "This conversation could not load. Check your access or try again.",
                    "Impossible de charger cette conversation. Vérifiez votre accès ou réessayez.",
                  )}
                </p>
                <Button variant="secondary" onClick={context.retry}>
                  {t(
                    "Retry selected conversation",
                    "Réessayer la conversation choisie",
                  )}
                </Button>
              </>
            ) : (
              <div
                className="ops-inbox-skeleton"
                aria-label={t(
                  "Loading conversation",
                  "Chargement de la conversation",
                )}
              >
                {Array.from({ length: 4 }, (_, i) => (
                  <div key={i} aria-hidden="true" />
                ))}
              </div>
            )}
          </section>
        ) : (
          <div className="ops-empty">
            <h2>
              {t(
                "Your conversations start here",
                "Vos conversations commencent ici",
              )}
            </h2>
            <p>
              {t(
                "When your store receives orders, you can contact buyers here.",
                "Vous pourrez contacter vos acheteurs dès les premières commandes.",
              )}
            </p>
          </div>
        )}
      </div>
      <p className="ops-scope">
        {t(
          "Conversations are ordered by latest activity. Refresh to see new replies.",
          "Les conversations sont classées par activité récente. Actualisez pour voir les nouvelles réponses.",
        )}
        {state.data?.conversations.some((o) => o.demo)
          ? " " +
            t(
              "Includes sample orders for your test store.",
              "Comprend des commandes fictives de votre boutique de test.",
            )
          : ""}
      </p>
    </>
  );
}
type MessagePage = {
  messages: OrderView["messages"];
  nextBefore: string | null;
  unreadCount: number;
};
function Conversation({
  onRead,
  onSent,
  attempts,
  order,
  canReply,
  draft,
  setDraft,
  back,
}: {
  onRead: () => void;
  onSent: (body: string) => void;
  attempts: RefObject<Record<string, { body: string; key: string }>>;
  order: SellerOrder;
  canReply: boolean;
  draft: string;
  setDraft: (v: string) => void;
  back: () => void;
}) {
  const { t, locale } = useSellerCopy(),
    [view, setView] = useState<OrderView | null>(null),
    [error, setError] = useState(""),
    [busy, setBusy] = useState(false),
    [revision, setRevision] = useState(0),
    [notice, setNotice] = useState("");
  const [nextBefore, setNextBefore] = useState<string | null>(null);
  const [unread, setUnread] = useState(0);
  const [paging, setPaging] = useState(false);
  const [reading, setReading] = useState(false);
  const scrollAnchor = useRef<{ top: number; height: number } | null>(null);
  const alive = useRef(true),
    bottom = useRef<HTMLDivElement>(null);
  useEffect(() => {
    alive.current = true;
    return () => {
      alive.current = false;
    };
  }, []);
  useEffect(() => {
    let current = true;
    setError("");
    Promise.all([
      api<OrderView>("/commerce/seller/orders/" + order.id),
      api<MessagePage>("/commerce/seller/orders/" + order.id + "/messages"),
    ])
      .then(([v, page]) => {
        if (current) {
          setView({ ...v, messages: page.messages });
          setNextBefore(page.nextBefore);
          setUnread(page.unreadCount);
        }
      })
      .catch(() => {
        if (current)
          setError(
            t(
              "Conversation could not load. Try again.",
              "Impossible de charger la conversation. Réessayez.",
            ),
          );
      });
    return () => {
      current = false;
    };
  }, [order.id, revision]);
  useEffect(() => {
    const list = bottom.current?.parentElement;
    if (list) {
      const anchor = scrollAnchor.current;
      list.scrollTop = anchor
        ? anchor.top + list.scrollHeight - anchor.height
        : list.scrollHeight;
      scrollAnchor.current = null;
    }
  }, [view?.messages.length]);
  useEffect(() => {
    if (!draft && !busy) return;
    const leave = (e: BeforeUnloadEvent) => {
      e.preventDefault();
      e.returnValue = "";
    };
    const change = (e: Event) => {
      if (
        busy ||
        !window.confirm(
          t(
            "Discard this unsent message and change stores?",
            "Abandonner ce message et changer de boutique ?",
          ),
        )
      )
        e.preventDefault();
    };
    window.addEventListener("beforeunload", leave);
    window.addEventListener("troc:seller-change", change);
    window.addEventListener("troc:message-switch", change);
    return () => {
      window.removeEventListener("beforeunload", leave);
      window.removeEventListener("troc:seller-change", change);
      window.removeEventListener("troc:message-switch", change);
    };
  }, [draft, busy]);
  async function earlier() {
    if (!nextBefore || paging || busy) return;
    setPaging(true);
    setError("");
    try {
      const page = await api<MessagePage>(
        "/commerce/seller/orders/" +
          order.id +
          "/messages?before=" +
          encodeURIComponent(nextBefore),
      );
      if (!alive.current) return;
      const list = bottom.current?.parentElement;
      if (list)
        scrollAnchor.current = {
          top: list.scrollTop,
          height: list.scrollHeight,
        };
      setView((v) =>
        v ? { ...v, messages: [...page.messages, ...v.messages] } : v,
      );
      setNextBefore(page.nextBefore);
      setUnread(page.unreadCount);
    } catch {
      if (alive.current)
        setError(
          t(
            "Earlier messages could not load. Try again.",
            "Impossible de charger les messages précédents. Réessayez.",
          ),
        );
    } finally {
      if (alive.current) setPaging(false);
    }
  }
  async function markRead() {
    if (reading) return;
    setReading(true);
    setError("");
    try {
      await api(
        "/commerce/seller/orders/" + order.id + "/messages/read",
        "POST",
        {},
      );
      if (alive.current) {
        setUnread(0);
        onRead();
        setNotice(
          t("Conversation marked as read.", "Conversation marquée comme lue."),
        );
      }
    } catch {
      if (alive.current)
        setError(
          t(
            "Read status could not be saved. Try again.",
            "Impossible d’enregistrer la lecture. Réessayez.",
          ),
        );
    } finally {
      if (alive.current) setReading(false);
    }
  }
  async function send() {
    const body = draft.trim();
    if (!body || busy || paging || !view) return;
    if (attempts.current[order.id]?.body !== body)
      attempts.current[order.id] = { body, key: crypto.randomUUID() };
    setBusy(true);
    setError("");
    setNotice("");
    try {
      await api("/commerce/seller-orders/" + order.id + "/actions", "POST", {
        action: "message",
        body,
        idempotencyKey: attempts.current[order.id].key,
      });
      if (!alive.current) return;
      setDraft("");
      onSent(body);
      delete attempts.current[order.id];
      setNotice(
        t(
          "Message saved to this order.",
          "Message enregistré dans cette commande.",
        ),
      );
      setRevision((v) => v + 1);
    } catch {
      if (alive.current)
        setError(
          t(
            "Message could not be confirmed. Your draft is kept; try again.",
            "Impossible de confirmer le message. Votre brouillon est conservé; réessayez.",
          ),
        );
    } finally {
      if (alive.current) setBusy(false);
    }
  }
  const messages = [...(view?.messages || [])].sort(
    (a, b) =>
      Date.parse(a.createdAt) - Date.parse(b.createdAt) ||
      a.id.localeCompare(b.id),
  );
  return (
    <section
      className="ops-conversation"
      aria-label={t("Order conversation", "Conversation de la commande")}
    >
      <header>
        <Button className="ops-back" variant="secondary" onClick={back}>
          {t("Back", "Retour")}
        </Button>
        <span className="ops-avatar" aria-hidden="true">
          {order.buyer[0]}
        </span>
        <div>
          <h2>{order.buyer}</h2>
          <p>#{order.id.slice(-4)}</p>
        </div>
      </header>
      {unread > 0 && (
        <div className="ops-inbox-toolbar">
          <span>{t(unread + " unread", unread + " non lus")}</span>
          <Button
            variant="secondary"
            disabled={reading || paging || busy}
            onClick={() => void markRead()}
          >
            {t(
              "Mark conversation as read",
              "Marquer la conversation comme lue",
            )}
          </Button>
        </div>
      )}
      <div
        className="ops-bubbles"
        tabIndex={0}
        role="log"
        aria-label={t("Messages", "Messages")}
      >
        {nextBefore && (
          <Button
            variant="secondary"
            disabled={paging || busy}
            onClick={() => void earlier()}
          >
            {paging
              ? t("Loading…", "Chargement…")
              : t("Load earlier messages", "Charger les messages précédents")}
          </Button>
        )}
        {!view && !error && (
          <p role="status">{t("Loading messages…", "Chargement…")}</p>
        )}
        {view && !messages.length && (
          <p className="ops-empty">
            {t(
              "No messages yet. Start with a question about this order.",
              "Aucun message. Posez une question concernant cette commande.",
            )}
          </p>
        )}
        {messages.map((m) => (
          <div key={m.id} className={"ops-message ops-message-" + m.author}>
            <small>
              {m.author === "seller"
                ? t("Your store", "Votre boutique")
                : t("Buyer", "Acheteur")}
            </small>
            <p>{m.body}</p>
            <time dateTime={m.createdAt}>
              {new Date(m.createdAt).toLocaleString(
                locale === "fr" ? "fr-CA" : "en-CA",
                {
                  month: "short",
                  day: "numeric",
                  hour: "2-digit",
                  minute: "2-digit",
                },
              )}
            </time>
          </div>
        ))}
        <div ref={bottom} />
      </div>
      {error && (
        <div className="ops-message-error" role="alert">
          {error}
          {!view && (
            <Button
              variant="secondary"
              onClick={() => setRevision((n) => n + 1)}
            >
              {t("Retry", "Réessayer")}
            </Button>
          )}
        </div>
      )}
      <form
        className="ops-composer"
        onSubmit={(e) => {
          e.preventDefault();
          void send();
        }}
      >
        <label htmlFor="seller-reply">
          {t("Reply about this order", "Répondre au sujet de cette commande")}
        </label>
        <Textarea
          id="seller-reply"
          value={draft}
          maxLength={2000}
          disabled={!canReply || busy}
          onChange={(e) => setDraft(e.target.value)}
          placeholder={t("Write your message…", "Écrivez votre message…")}
        />
        <div>
          <span>{draft.length}/2000</span>
          <Button
            disabled={!canReply || !draft.trim() || !view || busy || paging}
            type="submit"
          >
            {busy
              ? t("Saving…", "Enregistrement…")
              : t("Send message", "Envoyer")}
          </Button>
        </div>
        {!canReply && (
          <p>
            {t(
              "Your role does not allow replies.",
              "Votre rôle ne permet pas de répondre.",
            )}
          </p>
        )}
        <p role="status">{notice}</p>
      </form>
    </section>
  );
}
