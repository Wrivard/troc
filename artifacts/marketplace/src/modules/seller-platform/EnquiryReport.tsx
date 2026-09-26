import { useEffect, useRef, useState, useId } from "react";
import {
  Dialog,
  DialogContent,
  DialogTitle,
  DialogTrigger,
} from "@workspace/troc-design-system/components/ui/dialog";
import { Button } from "@workspace/troc-design-system/components/ui/button";
import { Textarea } from "@workspace/troc-design-system/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@workspace/troc-design-system/components/ui/select";
import { api } from "../../api";
export function EnquiryReport({
  seller,
  thread,
  messageId,
  body,
  locale,
}: {
  seller: string;
  thread: string;
  messageId: string;
  body: string;
  locale: "en" | "fr";
}) {
  const t = (en: string, fr: string) => (locale === "fr" ? fr : en);
  const field = useId();
  const [open, setOpen] = useState(false),
    [reason, setReason] = useState("spam"),
    [details, setDetails] = useState(""),
    [busy, setBusy] = useState(false),
    [saved, setSaved] = useState(false),
    [error, setError] = useState("");
  const attempt = useRef<{ signature: string; key: string } | null>(null);
  const submitting = useRef(false);
  useEffect(() => {
    if (!open) return;
    const guard = (e: Event) => {
      if (
        submitting.current ||
        (details &&
          !window.confirm(
            t(
              "Discard this report draft?",
              "Abandonner ce brouillon de signalement ?",
            ),
          ))
      )
        e.preventDefault();
    };
    const unload = (e: BeforeUnloadEvent) => {
      if (submitting.current || details) {
        e.preventDefault();
        e.returnValue = "";
      }
    };
    window.addEventListener("troc:seller-change", guard);
    window.addEventListener("troc:message-switch", guard);
    window.addEventListener("beforeunload", unload);
    return () => {
      window.removeEventListener("troc:seller-change", guard);
      window.removeEventListener("troc:message-switch", guard);
      window.removeEventListener("beforeunload", unload);
    };
  }, [open, details, locale]);
  async function submit() {
    if (submitting.current || saved) return;
    const payload = { messageId, reason, details: details.trim() };
    const signature = JSON.stringify(payload);
    if (attempt.current?.signature !== signature)
      attempt.current = { signature, key: crypto.randomUUID() };
    submitting.current = true;
    setBusy(true);
    setError("");
    try {
      const result = await api<{ id: string; status: string }>(
        "/seller/platform/" + seller + "/enquiries/" + thread + "/reports",
        "POST",
        { ...payload, key: attempt.current.key },
      );
      if (
        typeof result.id !== "string" ||
        !result.id ||
        !["open", "resolved", "dismissed"].includes(result.status)
      )
        throw Error("unconfirmed");
      setSaved(true);
      setDetails("");
    } catch {
      setError(
        t(
          "We couldn’t confirm this report. Your notes are kept. Retry without changing them to check the same submission.",
          "Impossible de confirmer le signalement. Vos notes sont conservées. Réessayez sans les modifier pour vérifier le même envoi.",
        ),
      );
    } finally {
      submitting.current = false;
      setBusy(false);
    }
  }
  return (
    <Dialog
      open={open}
      onOpenChange={(v) => {
        if (!submitting.current) setOpen(v);
      }}
    >
      <DialogTrigger asChild>
        <Button
          type="button"
          variant="ghost"
          className="text-xs"
          aria-label={t("Report message", "Signaler le message")}
        >
          {saved ? t("Reported", "Signalé") : t("Report", "Signaler")}
        </Button>
      </DialogTrigger>
      <DialogContent
        closeLabel={t("Close", "Fermer")}
        aria-describedby={field + "-help"}
      >
        <DialogTitle>
          {t("Report this message", "Signaler ce message")}
        </DialogTitle>
        <p id={field + "-help"} className="text-sm text-muted-foreground">
          {t(
            "Your report is private to TROC administrators. Reporting does not block the conversation or change an order.",
            "Votre signalement est réservé aux administrateurs TROC. Il ne bloque pas la conversation et ne modifie aucune commande.",
          )}
        </p>
        {saved ? (
          <div role="status" className="space-y-4">
            <p>
              {t(
                "Report saved for review. No moderation action has been taken automatically.",
                "Signalement enregistré pour examen. Aucune mesure de modération n’a été prise automatiquement.",
              )}
            </p>
            <Button type="button" onClick={() => setOpen(false)}>
              {t("Done", "Terminé")}
            </Button>
          </div>
        ) : (
          <form
            className="space-y-4"
            onSubmit={(e) => {
              e.preventDefault();
              e.stopPropagation();
              void submit();
            }}
          >
            <blockquote className="max-h-32 overflow-auto rounded-md border p-3 text-sm whitespace-pre-wrap break-words">
              {body}
            </blockquote>
            <div className="space-y-2">
              <label htmlFor={field + "-reason"}>{t("Reason", "Motif")}</label>
              <Select value={reason} onValueChange={setReason} disabled={busy}>
                <SelectTrigger id={field + "-reason"}>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent style={{ zIndex: "calc(var(--z-overlay) + 1)" }}>
                  {[
                    ["spam", "Spam", "Pourriel"],
                    ["harassment", "Harassment", "Harcèlement"],
                    ["fraud", "Suspected fraud", "Fraude présumée"],
                    ["other", "Other", "Autre"],
                  ].map(([value, en, fr]) => (
                    <SelectItem key={value} value={value}>
                      {t(en, fr)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <label htmlFor={field + "-notes"}>
                {t(
                  "Additional context (optional)",
                  "Contexte supplémentaire (facultatif)",
                )}
              </label>
              <Textarea
                id={field + "-notes"}
                value={details}
                onChange={(e) => setDetails(e.target.value)}
                maxLength={1000}
                disabled={busy}
              />
              <p className="text-xs text-muted-foreground">
                {details.length}/1000
              </p>
            </div>
            {error && (
              <p role="alert" className="text-sm">
                {error}
              </p>
            )}
            <div className="flex justify-end gap-3">
              <Button
                type="button"
                variant="secondary"
                disabled={busy}
                onClick={() => setOpen(false)}
              >
                {t("Cancel", "Annuler")}
              </Button>
              <Button type="submit" disabled={busy}>
                {busy
                  ? t("Saving…", "Enregistrement…")
                  : t("Submit report", "Envoyer le signalement")}
              </Button>
            </div>
          </form>
        )}
      </DialogContent>
    </Dialog>
  );
}
