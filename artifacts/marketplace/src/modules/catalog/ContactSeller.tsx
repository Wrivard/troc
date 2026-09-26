import { EnquiryReport } from "../seller-platform/EnquiryReport";
import { useEffect, useRef, useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogTitle,
  DialogTrigger,
} from "@workspace/troc-design-system/components/ui/dialog";
import { Button } from "@workspace/troc-design-system/components/ui/button";
import { Input } from "@workspace/troc-design-system/components/ui/input";
import { Textarea } from "@workspace/troc-design-system/components/ui/textarea";
import { useSession } from "../account/Workspace";
import { api } from "../../api";
export function ContactSeller({
  seller,
  storePath,
  locale,
}: {
  seller: string;
  storePath: string;
  locale: "en" | "fr";
}) {
  const { user } = useSession(),
    t = (a: string, b: string) => (locale === "fr" ? b : a);
  const [open, setOpen] = useState(false),
    [id, setId] = useState(""),
    [subject, setSubject] = useState(""),
    [body, setBody] = useState(""),
    [busy, setBusy] = useState(false),
    [error, setError] = useState(""),
    [loaded, setLoaded] = useState(false),
    [messages, setMessages] = useState<
      { id: string; author: string; body: string }[]
    >([]),
    [revision, setRevision] = useState(0);
  const [blocked, setBlocked] = useState(false);
  const attempt = useRef<{ value: string; key: string } | null>(null),
    storage = "troc.enquiry." + user?.id + "." + seller;
  useEffect(() => {
    setBlocked(false);
    setId("");
    setMessages([]);
    setSubject("");
    setBody("");
    if (user)
      try {
        setId(localStorage.getItem(storage) || "");
      } catch {
        /* In-memory conversation still works. */
      }
  }, [seller, user?.id, storage]);
  useEffect(() => {
    if (!open || !user) return;
    let active = true;
    setError("");
    setLoaded(!id);
    if (id)
      api<{
        subject: string;
        contactControl?: { blocked: boolean };
        messages: { id: string; author: string; body: string }[];
      }>("/seller/platform/" + seller + "/enquiries/" + id)
        .then((v) => {
          if (active) {
            setBlocked(v.contactControl?.blocked ?? false);
            setMessages(v.messages);
            setSubject(v.subject);
            setLoaded(true);
          }
        })
        .catch(() => {
          if (active)
            setError(
              t(
                "Could not load your conversation. Try again.",
                "Impossible de charger votre conversation. Réessayez.",
              ),
            );
        });
    return () => {
      active = false;
    };
  }, [open, id, user?.id, seller, revision]);
  async function send() {
    if (!loaded || busy || !body.trim() || blocked) return;
    const value = id + "|" + subject.trim() + "|" + body.trim();
    if (attempt.current?.value !== value)
      attempt.current = { value, key: crypto.randomUUID() };
    setBusy(true);
    setError("");
    try {
      const result = await api<{ id?: string }>(
        "/seller/platform/" + seller + "/enquiries" + (id ? "/" + id : ""),
        "POST",
        {
          key: attempt.current.key,
          subject: subject.trim(),
          body: body.trim(),
        },
      );
      if (result.id) {
        setId(result.id);
        try {
          localStorage.setItem(storage, result.id);
        } catch {
          /* Keep the current conversation available. */
        }
      }
      setBody("");
      attempt.current = null;
      setRevision((n) => n + 1);
    } catch (error) {
      if (error instanceof Error && error.message === "enquiry_blocked")
        setBlocked(true);
      setError(
        t(
          "Message not confirmed. Your draft is kept; retry.",
          "Message non confirmé. Votre brouillon est conservé; réessayez.",
        ),
      );
    } finally {
      setBusy(false);
    }
  }
  return (
    <Dialog
      open={open}
      onOpenChange={(v) => {
        if (
          !busy &&
          (!body ||
            v ||
            window.confirm(
              t("Discard this draft?", "Abandonner ce brouillon ?"),
            ))
        )
          setOpen(v);
      }}
    >
      <DialogTrigger asChild>
        <Button variant="secondary">
          {t("Contact seller", "Contacter le vendeur")}
        </Button>
      </DialogTrigger>
      <DialogContent
        closeLabel={t("Close", "Fermer")}
        aria-describedby="contact-seller-help"
      >
        <DialogTitle>{t("Contact seller", "Contacter le vendeur")}</DialogTitle>
        <p id="contact-seller-help" className="text-sm text-muted-foreground">
          {t(
            "Ask about a card or availability. No order needed.",
            "Posez une question sur une carte ou sa disponibilité. Aucune commande nécessaire.",
          )}
        </p>
        {!user ? (
          <Button asChild>
            <a href={"/sign-in?lang=" + locale + "&returnTo=" + encodeURIComponent(storePath)}>
              {t(
                "Sign in to send a message",
                "Se connecter pour envoyer un message",
              )}
            </a>
          </Button>
        ) : (
          <form
            className="grid gap-4"
            onSubmit={(e) => {
              e.preventDefault();
              void send();
            }}
          >
            {blocked && (
              <p role="status" className="text-sm">
                {t(
                  "Pre-sale messages with this store are paused. Your draft, conversation history, reports and order conversations remain available.",
                  "Les messages avant achat avec cette boutique sont suspendus. Votre brouillon, l’historique, les signalements et les conversations de commande restent accessibles.",
                )}
                <Button
                  type="button"
                  variant="secondary"
                  onClick={() => {
                    if (!id) setBlocked(false);
                    setRevision((n) => n + 1);
                  }}
                >
                  {t("Check again", "Vérifier de nouveau")}
                </Button>
              </p>
            )}
            {id && (
              <div
                role="log"
                aria-label={t("Conversation", "Conversation")}
                tabIndex={0}
                className="max-h-60 overflow-auto space-y-3"
              >
                {messages.map((m) => (
                  <div key={m.id} className="rounded border p-3 text-sm">
                    <strong>
                      {m.author === "buyer"
                        ? t("You", "Vous")
                        : t("Seller", "Vendeur")}
                    </strong>
                    <p className="whitespace-pre-wrap break-words">{m.body}</p>
                    {m.author === "seller" && (
                      <EnquiryReport
                        seller={seller}
                        thread={id}
                        messageId={m.id}
                        body={m.body}
                        locale={locale}
                      />
                    )}
                  </div>
                ))}
              </div>
            )}
            <label className="grid gap-2 text-sm">
              {t("Subject", "Sujet")}
              <Input
                required
                maxLength={120}
                value={subject}
                disabled={!!id || busy}
                onChange={(e) => setSubject(e.target.value)}
              />
            </label>
            <label className="grid gap-2 text-sm">
              {t("Message", "Message")}
              <Textarea
                required
                maxLength={2000}
                value={body}
                disabled={busy}
                onChange={(e) => setBody(e.target.value)}
              />
            </label>
            {error && (
              <p role="alert">
                {error}
                <Button
                  type="button"
                  variant="secondary"
                  onClick={() => setRevision((n) => n + 1)}
                >
                  {t("Reload", "Recharger")}
                </Button>
              </p>
            )}
            <Button
              type="submit"
              disabled={
                busy || !loaded || !body.trim() || !subject.trim() || blocked
              }
            >
              {busy ? t("Sending…", "Envoi…") : t("Send message", "Envoyer")}
            </Button>
          </form>
        )}
      </DialogContent>
    </Dialog>
  );
}

