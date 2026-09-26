import { EnquiryBlock, type ContactControl } from "./EnquiryBlock";
import { EnquiryReport } from "./EnquiryReport";
import { useEffect, useRef, useState, type RefObject } from "react";
import { Button } from "@workspace/troc-design-system/components/ui/button";
import { Input } from "@workspace/troc-design-system/components/ui/input";
import { Textarea } from "@workspace/troc-design-system/components/ui/textarea";
import { api } from "../../api";
import { useSellerWorkspace } from "./SellerShell";
import { useSellerCopy } from "./operations-ui";
type Enquiry = {
  id: string;
  subject: string;
  buyer: string;
  preview: string;
  created_at: string;
  unread_count?: number;
};
type Entry = { id: string; author: string; body: string; created_at: string };
export function SellerEnquiries() {
  const { seller } = useSellerWorkspace(),
    { t, date } = useSellerCopy();
  const [rows, setRows] = useState<Enquiry[] | null>(null),
    [id, setId] = useState(""),
    [q, setQ] = useState(""),
    [error, setError] = useState(""),
    [revision, setRevision] = useState(0),
    [mobile, setMobile] = useState(false);
  const [nextListBefore, setNextListBefore] = useState<string | null>(null),
    [listBusy, setListBusy] = useState(false);
  const listAlive = useRef(true);
  useEffect(() => {
    listAlive.current = true;
    return () => {
      listAlive.current = false;
    };
  }, []);
  useEffect(() => {
    let active = true;
    setError("");
    if (seller)
      api<{ items: Enquiry[]; nextBefore: string | null }>(
        "/seller/platform/" + seller + "/enquiries?page=true",
      )
        .then((v) => {
          if (active) {
            setRows((current) =>
              revision === 0
                ? v.items
                : [
                    ...v.items,
                    ...(current ?? []).filter(
                      (r) => !v.items.some((n) => n.id === r.id),
                    ),
                  ],
            );
            if (revision === 0) setNextListBefore(v.nextBefore);
            setId((old) => old || v.items[0]?.id || "");
          }
        })
        .catch(() => {
          if (active)
            setError(
              t(
                "Enquiries could not load. Your role must allow buyer messages.",
                "Chargement impossible. Votre rôle doit autoriser les messages aux acheteurs.",
              ),
            );
        });
    return () => {
      active = false;
    };
  }, [seller, revision]);
  async function moreEnquiries() {
    if (!nextListBefore || listBusy) return;
    setListBusy(true);
    setError("");
    try {
      const page = await api<{ items: Enquiry[]; nextBefore: string | null }>(
        "/seller/platform/" +
          seller +
          "/enquiries?page=true&before=" +
          encodeURIComponent(nextListBefore),
      );
      if (!listAlive.current) return;
      setRows((current) => [
        ...(current ?? []),
        ...page.items.filter((r) => !current?.some((c) => c.id === r.id)),
      ]);
      setNextListBefore(page.nextBefore);
    } catch {
      if (listAlive.current)
        setError(
          t(
            "Could not load earlier enquiries.",
            "Impossible de charger les demandes précédentes.",
          ),
        );
    } finally {
      if (listAlive.current) setListBusy(false);
    }
  }
  const [drafts, setDrafts] = useState<Record<string, string>>({});
  const attempts = useRef<Record<string, { body: string; key: string }>>({});
  const current = rows?.find((r) => r.id === id);
  return (
    <>
      {error && (
        <p role="alert">
          {error}
          <Button variant="secondary" onClick={() => setRevision((n) => n + 1)}>
            {t("Retry", "Réessayer")}
          </Button>
        </p>
      )}
      <div className="ops-inbox-toolbar">
        <p className="ops-scope">
          {t(
            "Questions before a purchase, with no order required.",
            "Questions avant l’achat, sans commande nécessaire.",
          )}
        </p>
        <Input
          aria-label={t("Search enquiries", "Rechercher des demandes")}
          placeholder={t("Search a subject or buyer…", "Sujet ou acheteur…")}
          value={q}
          onChange={(e) => setQ(e.target.value)}
        />
      </div>
      {!rows && !error && (
        <p role="status">
          {t("Loading enquiries…", "Chargement des demandes…")}
        </p>
      )}
      {rows?.length === 0 && (
        <div className="ops-empty">
          <h2>
            {t("No pre-sale enquiries yet", "Aucune demande avant achat")}
          </h2>
          <p>
            {t(
              "Questions about cards, condition or availability will appear here without an order.",
              "Les questions sur les cartes, leur état ou leur disponibilité apparaîtront ici sans commande.",
            )}
          </p>
        </div>
      )}
      {!!rows?.length && (
        <div className={"ops-inbox" + (mobile ? " ops-inbox-open" : "")}>
          <section
            className="ops-conversations"
            aria-label={t("Pre-sale enquiries", "Demandes avant achat")}
          >
            {rows
              .filter((r) =>
                [r.subject, r.buyer, r.preview]
                  .join(" ")
                  .toLowerCase()
                  .includes(q.toLowerCase()),
              )
              .map((r) => (
                <button
                  key={r.id}
                  aria-pressed={r.id === id}
                  onClick={() => {
                    setId(r.id);
                    setMobile(true);
                  }}
                >
                  <span className="ops-avatar" aria-hidden="true">
                    ?
                  </span>
                  <span>
                    <strong>{r.subject}</strong>
                    {!!r.unread_count && (
                      <small>
                        {r.unread_count} {t("unread", "non lus")}
                      </small>
                    )}
                    <small>
                      {r.buyer} · {date(r.created_at)}
                    </small>
                    <span>{r.preview}</span>
                  </span>
                </button>
              ))}
            {nextListBefore && (
              <Button
                variant="secondary"
                disabled={listBusy}
                onClick={() => void moreEnquiries()}
              >
                {listBusy
                  ? t("Loading…", "Chargement…")
                  : t("Load more enquiries", "Charger plus de demandes")}
              </Button>
            )}
          </section>
          {current && (
            <>
              <EnquiryThread
                draft={drafts[id] || ""}
                setDraft={(v) => setDrafts((d) => ({ ...d, [id]: v }))}
                attempts={attempts}
                key={seller + id}
                seller={seller}
                thread={current}
                back={() => setMobile(false)}
                changed={() => setRevision((n) => n + 1)}
              />
              <aside
                className="ops-order-context"
                aria-label={t("Enquiry context", "Contexte de la demande")}
              >
                <section className="ops-panel">
                  <h2>{t("Before the purchase", "Avant l’achat")}</h2>
                  <p>{current.subject}</p>
                  <div className="enquiry-no-order">
                    {t("No order yet", "Aucune commande")}
                  </div>
                  <p>
                    {t(
                      "Answer the buyer’s question here. Shipping, payment and order actions only appear once there is an order.",
                      "Répondez ici à l’acheteur. Les actions d’expédition, de paiement et de commande apparaissent uniquement après une commande.",
                    )}
                  </p>
                </section>
              </aside>
            </>
          )}
        </div>
      )}
    </>
  );
}
function EnquiryThread({
  draft,
  setDraft,
  attempts,
  seller,
  thread,
  back,
  changed,
}: {
  draft: string;
  setDraft: (v: string) => void;
  attempts: RefObject<Record<string, { body: string; key: string }>>;
  seller: string;
  thread: Enquiry;
  back: () => void;
  changed: () => void;
}) {
  const { t, locale } = useSellerCopy(),
    [messages, setMessages] = useState<Entry[]>([]),
    [busy, setBusy] = useState(false),
    [loaded, setLoaded] = useState(false),
    [error, setError] = useState(""),
    [revision, setRevision] = useState(0);
  const [nextBefore, setNextBefore] = useState<string | null>(null),
    [olderBusy, setOlderBusy] = useState(false);
  const [control, setControl] = useState<ContactControl>({
    blocked: false,
    version: 0,
    canManageBlock: false,
  });
  const bubbles = useRef<HTMLDivElement>(null);
  const [markingRead, setMarkingRead] = useState(false);
  const alive = useRef(true);
  useEffect(() => {
    alive.current = true;
    return () => {
      alive.current = false;
    };
  }, []);
  useEffect(() => {
    let active = true;
    setLoaded(false);
    setError("");
    api<{
      messages: Entry[];
      nextBefore: string | null;
      contactControl?: ContactControl;
    }>("/seller/platform/" + seller + "/enquiries/" + thread.id)
      .then((v) => {
        if (active) {
          setControl(
            v.contactControl ?? {
              blocked: false,
              version: 0,
              canManageBlock: false,
            },
          );
          setMessages(v.messages);
          setNextBefore(v.nextBefore);
          setLoaded(true);
        }
      })
      .catch(() => {
        if (active)
          setError(
            t(
              "Could not load the conversation.",
              "Impossible de charger la conversation.",
            ),
          );
      });
    return () => {
      active = false;
    };
  }, [seller, thread.id, revision]);
  useEffect(() => {
    if (!draft && !busy) return;
    const unload = (e: BeforeUnloadEvent) => {
      e.preventDefault();
      e.returnValue = "";
    };
    const guard = (e: Event) => {
      if (
        busy ||
        !window.confirm(t("Discard this draft?", "Abandonner ce brouillon ?"))
      )
        e.preventDefault();
    };
    window.addEventListener("beforeunload", unload);
    window.addEventListener("troc:seller-change", guard);
    window.addEventListener("troc:message-switch", guard);
    return () => {
      window.removeEventListener("beforeunload", unload);
      window.removeEventListener("troc:seller-change", guard);
      window.removeEventListener("troc:message-switch", guard);
    };
  }, [draft, busy]);
  async function loadOlder() {
    if (!nextBefore || olderBusy || busy) return;
    setOlderBusy(true);
    setError("");
    const element = bubbles.current,
      oldHeight = element?.scrollHeight ?? 0,
      oldTop = element?.scrollTop ?? 0;
    try {
      const page = await api<{
        messages: Entry[];
        nextBefore: string | null;
        contactControl?: ContactControl;
      }>(
        "/seller/platform/" +
          seller +
          "/enquiries/" +
          thread.id +
          "?before=" +
          encodeURIComponent(nextBefore),
      );
      if (!alive.current) return;
      setMessages((current) => [
        ...page.messages.filter((m) => !current.some((c) => c.id === m.id)),
        ...current,
      ]);
      setNextBefore(page.nextBefore);
      requestAnimationFrame(() => {
        if (alive.current && element)
          element.scrollTop = oldTop + element.scrollHeight - oldHeight;
      });
    } catch {
      if (alive.current)
        setError(
          t(
            "Earlier messages could not load. Try again.",
            "Impossible de charger les anciens messages. Réessayez.",
          ),
        );
    } finally {
      if (alive.current) setOlderBusy(false);
    }
  }
  async function markRead() {
    if (markingRead || !loaded) return;
    setMarkingRead(true);
    try {
      await api(
        "/seller/platform/" + seller + "/enquiries/" + thread.id + "/read",
        "POST",
        {},
      );
      if (alive.current) changed();
    } catch {
      if (alive.current)
        setError(
          t(
            "Could not update read status. Try again.",
            "Impossible de mettre à jour les messages lus. Réessayez.",
          ),
        );
    } finally {
      if (alive.current) setMarkingRead(false);
    }
  }
  async function send() {
    const body = draft.trim();
    if (!body || busy || olderBusy || !loaded || control.blocked) return;
    if (attempts.current[thread.id]?.body !== body)
      attempts.current[thread.id] = { body, key: crypto.randomUUID() };
    setBusy(true);
    setError("");
    try {
      await api(
        "/seller/platform/" + seller + "/enquiries/" + thread.id,
        "POST",
        { body, key: attempts.current[thread.id].key },
      );
      if (alive.current) {
        setDraft("");
        delete attempts.current[thread.id];
        setRevision((n) => n + 1);
        changed();
      }
    } catch (error) {
      if (error instanceof Error && error.message === "enquiry_blocked") {
        setControl((v) => ({ ...v, blocked: true }));
        setRevision((n) => n + 1);
      }
      if (alive.current)
        setError(
          t(
            "Not confirmed. Your draft is kept; retry.",
            "Non confirmé. Votre brouillon est conservé; réessayez.",
          ),
        );
    } finally {
      if (alive.current) setBusy(false);
    }
  }
  return (
    <section
      className="ops-conversation"
      aria-label={t("Pre-sale conversation", "Conversation avant achat")}
    >
      <header>
        <Button className="ops-back" variant="secondary" onClick={back}>
          {t("Back", "Retour")}
        </Button>
        <div>
          <h2>{thread.buyer}</h2>
          <p>{thread.subject}</p>
          {!!thread.unread_count && (
            <Button
              variant="secondary"
              disabled={markingRead || !loaded}
              onClick={() => void markRead()}
            >
              {t(
                "Mark conversation as read",
                "Marquer la conversation comme lue",
              )}
            </Button>
          )}
        </div>
      </header>
      {loaded && (
        <EnquiryBlock
          seller={seller}
          thread={thread.id}
          control={control}
          locale={locale}
          onChanged={setControl}
          reload={() => setRevision((n) => n + 1)}
        />
      )}
      {control.blocked && (
        <p role="status" className="ops-message-error">
          {t(
            "Pre-sale messages are paused for this buyer and store. Order conversations, history and reporting remain available. Your draft is kept.",
            "Les messages avant achat sont suspendus entre cet acheteur et cette boutique. Les conversations de commande, l’historique et les signalements restent accessibles. Votre brouillon est conservé.",
          )}
        </p>
      )}
      <div
        ref={bubbles}
        className="ops-bubbles"
        tabIndex={0}
        role="log"
        aria-label={t("Enquiry messages", "Messages de la demande")}
      >
        {nextBefore && (
          <Button
            variant="secondary"
            disabled={olderBusy || busy}
            onClick={() => void loadOlder()}
          >
            {olderBusy
              ? t("Loading…", "Chargement…")
              : t("Load earlier messages", "Charger les anciens messages")}
          </Button>
        )}
        {messages.map((m) => (
          <div key={m.id} className={"ops-message ops-message-" + m.author}>
            <small>
              {m.author === "seller"
                ? t("Your store", "Votre boutique")
                : t("Buyer", "Acheteur")}
            </small>
            <p>{m.body}</p>
            {m.author === "buyer" && (
              <EnquiryReport
                seller={seller}
                thread={thread.id}
                messageId={m.id}
                body={m.body}
                locale={locale}
              />
            )}
            <time>
              {new Date(m.created_at).toLocaleString(
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
      </div>
      {error && (
        <p role="alert" className="ops-message-error">
          {error}
          <Button variant="secondary" onClick={() => setRevision((n) => n + 1)}>
            {t("Reload", "Recharger")}
          </Button>
        </p>
      )}
      <form
        className="ops-composer"
        onSubmit={(e) => {
          e.preventDefault();
          void send();
        }}
      >
        <label htmlFor="enquiry-reply">
          {t("Reply to this enquiry", "Répondre à cette demande")}
        </label>
        <Textarea
          id="enquiry-reply"
          maxLength={2000}
          value={draft}
          disabled={busy}
          onChange={(e) => setDraft(e.target.value)}
        />
        <div>
          <span>{draft.length}/2000</span>
          <Button
            type="submit"
            disabled={
              !draft.trim() || busy || olderBusy || !loaded || control.blocked
            }
          >
            {t("Send message", "Envoyer")}
          </Button>
        </div>
      </form>
    </section>
  );
}
