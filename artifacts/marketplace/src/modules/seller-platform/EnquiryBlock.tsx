import { useRef, useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogTitle,
  DialogTrigger,
} from "@workspace/troc-design-system/components/ui/dialog";
import { Button } from "@workspace/troc-design-system/components/ui/button";
import { api } from "../../api";
export type ContactControl = {
  blocked: boolean;
  version: number;
  canManageBlock: boolean;
};
export function EnquiryBlock({
  seller,
  thread,
  control,
  locale,
  onChanged,
  reload,
}: {
  seller: string;
  thread: string;
  control: ContactControl;
  locale: "en" | "fr";
  onChanged: (v: ContactControl) => void;
  reload: () => void;
}) {
  const t = (a: string, b: string) => (locale === "fr" ? b : a);
  const [open, setOpen] = useState(false),
    [busy, setBusy] = useState(false),
    [error, setError] = useState("");
  const pending = useRef(false),
    attempt = useRef<{ version: number; blocked: boolean; key: string } | null>(
      null,
    );
  async function save() {
    if (pending.current) return;
    const blocked = !control.blocked;
    if (
      attempt.current?.version !== control.version ||
      attempt.current.blocked !== blocked
    )
      attempt.current = {
        version: control.version,
        blocked,
        key: crypto.randomUUID(),
      };
    pending.current = true;
    setBusy(true);
    setError("");
    try {
      const result = await api<{ blocked: boolean; version: number }>(
        "/seller/platform/" + seller + "/enquiries/" + thread + "/block",
        "POST",
        attempt.current,
      );
      if (result.blocked !== blocked || result.version !== control.version + 1)
        throw Error("unconfirmed");
      onChanged({ ...control, ...result });
      setOpen(false);
      attempt.current = null;
    } catch (e) {
      setError(e instanceof Error ? e.message : "unconfirmed");
    } finally {
      pending.current = false;
      setBusy(false);
    }
  }
  if (!control.canManageBlock) return null;
  return (
    <Dialog
      open={open}
      onOpenChange={(v) => {
        if (!pending.current) setOpen(v);
      }}
    >
      <DialogTrigger asChild>
        <Button type="button" variant="outline">
          {control.blocked
            ? t(
                "Unblock pre-sale messages",
                "Débloquer les messages avant achat",
              )
            : t("Block pre-sale messages", "Bloquer les messages avant achat")}
        </Button>
      </DialogTrigger>
      <DialogContent
        closeLabel={t("Close", "Fermer")}
        aria-describedby="enquiry-block-help"
      >
        <DialogTitle>
          {control.blocked
            ? t(
                "Resume pre-sale messages?",
                "Reprendre les messages avant achat ?",
              )
            : t(
                "Pause pre-sale messages?",
                "Suspendre les messages avant achat ?",
              )}
        </DialogTitle>
        <p id="enquiry-block-help">
          {control.blocked
            ? t(
                "This buyer and your store can message each other again in all pre-sale conversations.",
                "Cet acheteur et votre boutique pourront de nouveau échanger dans toutes leurs conversations avant achat.",
              )
            : t(
                "This pauses new pre-sale messages in both directions between this buyer and your store. It applies to all your pre-sale conversations with this buyer.",
                "Cette action suspend les nouveaux messages avant achat dans les deux sens entre cet acheteur et votre boutique, dans toutes leurs conversations.",
              )}
        </p>
        <p className="text-sm text-muted-foreground">
          {t(
            "Order conversations, history and reporting remain available. Your unsent reply is kept.",
            "Les conversations de commande, l’historique et les signalements restent accessibles. Votre brouillon est conservé.",
          )}
        </p>
        {error && (
          <p role="alert">
            {["version_conflict", "idempotency_conflict"].includes(error)
              ? t(
                  "This setting changed. Reload its current state before trying again.",
                  "Ce réglage a changé. Rechargez son état actuel avant de réessayer.",
                )
              : error === "forbidden"
                ? t(
                    "Only a store owner or administrator can change this setting.",
                    "Seul un propriétaire de boutique ou un administrateur peut modifier ce réglage.",
                  )
                : t(
                    "Change not confirmed. Retry to check the same request.",
                    "Modification non confirmée. Réessayez pour vérifier la même demande.",
                  )}
          </p>
        )}
        <div className="flex flex-wrap justify-end gap-3">
          <Button
            type="button"
            variant="secondary"
            disabled={busy}
            onClick={() => setOpen(false)}
          >
            {t("Cancel", "Annuler")}
          </Button>
          {["version_conflict", "idempotency_conflict", "forbidden"].includes(
            error,
          ) ? (
            <Button
              type="button"
              onClick={() => {
                setOpen(false);
                setError("");
                attempt.current = null;
                reload();
              }}
            >
              {t("Reload", "Recharger")}
            </Button>
          ) : (
            <Button type="button" disabled={busy} onClick={() => void save()}>
              {busy
                ? t("Saving…", "Enregistrement…")
                : control.blocked
                  ? t("Confirm unblock", "Confirmer le déblocage")
                  : t("Confirm block", "Confirmer le blocage")}
            </Button>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
