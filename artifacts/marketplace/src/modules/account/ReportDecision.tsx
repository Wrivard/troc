import { useId, useRef, useState, useEffect } from "react";
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
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@workspace/troc-design-system/components/ui/select";
import { api } from "../../api";
export function ReportDecision({
  id,
  subject,
  locale,
  onComplete,
}: {
  id: string;
  subject: string;
  locale: "en" | "fr";
  onComplete: () => void;
}) {
  const t = (en: string, fr: string) => (locale === "fr" ? fr : en);
  const field = useId();
  const [open, setOpen] = useState(false),
    [decision, setDecision] = useState(""),
    [note, setNote] = useState(""),
    [busy, setBusy] = useState(false),
    [saved, setSaved] = useState(false),
    [error, setError] = useState("");
  const pending = useRef(false),
    attempt = useRef<{ signature: string; key: string } | null>(null);
  useEffect(() => {
    if (!open || saved) return;
    const guard = (e: BeforeUnloadEvent) => {
      if (note || pending.current) {
        e.preventDefault();
        e.returnValue = "";
      }
    };
    window.addEventListener("beforeunload", guard);
    return () => window.removeEventListener("beforeunload", guard);
  }, [open, note, saved]);
  function close() {
    if (pending.current) return;
    setOpen(false);
    if (saved) onComplete();
  }
  async function submit() {
    if (
      pending.current ||
      saved ||
      !decision ||
      !note.trim() ||
      error === "report_already_reviewed"
    )
      return;
    const payload = { decision, note: note.trim() },
      signature = JSON.stringify(payload);
    if (attempt.current?.signature !== signature)
      attempt.current = { signature, key: crypto.randomUUID() };
    pending.current = true;
    setBusy(true);
    setError("");
    try {
      const response = await api<{ id: string; status: string }>(
        "/seller/admin/enquiry-reports/" + id + "/review",
        "POST",
        { ...payload, key: attempt.current.key },
      );
      if (response.id !== id || response.status !== decision)
        throw Error("unconfirmed");
      setSaved(true);
      setNote("");
    } catch (e) {
      setError(e instanceof Error ? e.message : "unconfirmed");
    } finally {
      pending.current = false;
      setBusy(false);
    }
  }
  return (
    <Dialog
      open={open}
      onOpenChange={(v) => {
        if (v) setOpen(true);
        else close();
      }}
    >
      <DialogTrigger asChild>
        <Button variant="outline">
          {t("Review report", "Examiner le signalement")}
        </Button>
      </DialogTrigger>
      <DialogContent
        closeLabel={t("Close", "Fermer")}
        aria-describedby={field + "-help"}
        className="max-h-[90dvh] overflow-y-auto"
      >
        <DialogTitle>
          {t("Record a decision", "Enregistrer une décision")}
        </DialogTitle>
        <p id={field + "-help"} className="text-sm text-muted-foreground">
          {t(
            "This closes the report permanently. It does not block anyone, remove a message or change an order.",
            "Cette décision clôt définitivement le signalement. Elle ne bloque personne, ne supprime aucun message et ne modifie aucune commande.",
          )}
        </p>
        <p className="text-sm font-medium break-words">{subject}</p>
        {saved ? (
          <div className="space-y-4">
            <p role="status">
              {t(
                "Decision saved. The review is recorded in the audit history.",
                "Décision enregistrée dans l’historique d’audit.",
              )}
            </p>
            <Button onClick={close}>{t("Done", "Terminé")}</Button>
          </div>
        ) : (
          <form
            className="space-y-4"
            onSubmit={(e) => {
              e.preventDefault();
              void submit();
            }}
          >
            <div className="space-y-2">
              <label htmlFor={field + "-decision"}>
                {t("Decision", "Décision")}
              </label>
              <Select
                value={decision}
                onValueChange={setDecision}
                disabled={busy || error === "report_already_reviewed"}
              >
                <SelectTrigger id={field + "-decision"}>
                  <SelectValue
                    placeholder={t("Choose a decision", "Choisir une décision")}
                  />
                </SelectTrigger>
                <SelectContent style={{ zIndex: "calc(var(--z-overlay) + 1)" }}>
                  <SelectItem value="resolved">
                    {t(
                      "Resolve — review complete",
                      "Résoudre — examen terminé",
                    )}
                  </SelectItem>
                  <SelectItem value="dismissed">
                    {t(
                      "Dismiss — no action warranted",
                      "Classer — aucune mesure justifiée",
                    )}
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <label htmlFor={field + "-note"}>
                {t(
                  "Private rationale (required)",
                  "Justification privée (obligatoire)",
                )}
              </label>
              <Textarea
                id={field + "-note"}
                value={note}
                onChange={(e) => setNote(e.target.value)}
                required
                maxLength={1000}
                disabled={busy}
                aria-describedby={field + "-privacy"}
              />
              <p
                id={field + "-privacy"}
                className="text-xs text-muted-foreground"
              >
                {t(
                  "Only administrators can read this note.",
                  "Seuls les administrateurs peuvent lire cette note.",
                )}{" "}
                {note.length}/1000
              </p>
            </div>
            {error && (
              <p role="alert" className="text-sm">
                {error === "report_already_reviewed"
                  ? t(
                      "Another decision is already saved. Your note is preserved. Refresh the report to see its current review.",
                      "Une décision est déjà enregistrée. Votre note est conservée. Actualisez le signalement pour consulter son examen.",
                    )
                  : error === "forbidden" || error === "unauthorized"
                    ? t(
                        "Administrator access is required. Your note is preserved.",
                        "Un accès administrateur est requis. Votre note est conservée.",
                      )
                    : t(
                        "We couldn’t confirm the decision. Your note is kept. Retry unchanged to check the same submission.",
                        "Impossible de confirmer la décision. Votre note est conservée. Réessayez sans la modifier pour vérifier le même envoi.",
                      )}
              </p>
            )}
            <div className="flex flex-wrap justify-end gap-3">
              <Button
                type="button"
                variant="secondary"
                disabled={busy}
                onClick={close}
              >
                {t("Cancel", "Annuler")}
              </Button>
              {error === "report_already_reviewed" ? (
                <Button
                  type="button"
                  onClick={() => {
                    if (
                      window.confirm(
                        t(
                          "Refresh and discard this unsaved note?",
                          "Actualiser et abandonner cette note non enregistrée ?",
                        ),
                      )
                    ) {
                      setOpen(false);
                      onComplete();
                    }
                  }}
                >
                  {t("Refresh report", "Actualiser le signalement")}
                </Button>
              ) : (
                <Button
                  type="submit"
                  disabled={busy || !decision || !note.trim()}
                >
                  {busy
                    ? t("Saving…", "Enregistrement…")
                    : t("Confirm decision", "Confirmer la décision")}
                </Button>
              )}
            </div>
          </form>
        )}
      </DialogContent>
    </Dialog>
  );
}
