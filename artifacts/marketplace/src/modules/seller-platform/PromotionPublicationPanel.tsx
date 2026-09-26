import { useEffect, useRef, useState } from "react";
import { Button } from "@workspace/troc-design-system/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogTitle,
  DialogDescription,
} from "@workspace/troc-design-system/components/ui/dialog";
import { api } from "../../api";
import { useSellerCopy } from "./operations-ui";
type Draft = {
  id: string;
  name: string;
  percent: number;
  minimum: number;
  minimumCents?: number;
  coupon: string;
  start: string;
  end: string;
};
type Rule = {
  id: string;
  basisPoints: number;
  minimumCards?: number;
  coupon?: string;
  startsAt?: string;
  endsAt?: string;
};
type Snapshot = {
  version: number;
  draftVersion: number;
  drafts: Draft[];
  promotions: Rule[];
};
export function PromotionPublicationPanel({ seller }: { seller: string }) {
  const { t, money } = useSellerCopy();
  const [open, setOpen] = useState(false),
    [data, setData] = useState<Snapshot | null>(null),
    [state, setState] = useState("idle"),
    [selection, setSelection] = useState(""),
    [consent, setConsent] = useState(false),
    [message, setMessage] = useState("");
  const readSequence = useRef(0);
  const alive = useRef(true),
    busy = useRef(false),
    attempt = useRef<{ signature: string; key: string } | null>(null);
  useEffect(() => {
    alive.current = true;
    return () => {
      alive.current = false;
    };
  }, []);
  const path = "/seller/platform/" + seller + "/promotions";
  async function load() {
    const sequence = ++readSequence.current;
    setData(null);
    setState("loading");
    try {
      const value = await api<Snapshot>(path);
      if (!alive.current || sequence !== readSequence.current) return;
      setData(value);
      setSelection("");
      setConsent(false);
      attempt.current = null;
      setState("ready");
    } catch {
      if (alive.current && sequence === readSequence.current) setState("readError");
    }
  }
  async function command() {
    if (
      busy.current ||
      !data ||
      !selection ||
      !consent ||
      !["ready", "writeError"].includes(state)
    )
      return;
    const [action, id] = selection.split(":");
    const input = {
      version: data.version,
      action,
      draftId: id,
      ...(action === "publish"
        ? { draftVersion: data.draftVersion, calendarTimeZone: "UTC" }
        : {}),
    };
    const signature = JSON.stringify(input);
    if (attempt.current?.signature !== signature)
      attempt.current = { signature, key: crypto.randomUUID() };
    busy.current = true;
    setState("saving");
    try {
      await api(path, "POST", { ...input, key: attempt.current.key });
      if (!alive.current) return;
      setMessage(
        t(
          "Request saved. Current rules are shown below.",
          "Demande enregistrée. Les règles actuelles sont affichées ci-dessous.",
        ),
      );
      await load();
    } catch (e) {
      if (alive.current) {
        setMessage(
          e instanceof Error &&
            ["promotions_changed", "settings_changed"].includes(e.message)
            ? t(
                "The store changed. Reload and review before confirming again.",
                "La boutique a changé. Rechargez et vérifiez avant de confirmer.",
              )
            : t(
                "Request failed. Retry the same request or reload the current rules.",
                "Échec de la demande. Réessayez ou rechargez les règles actuelles.",
              ),
        );
        setState(
          e instanceof Error &&
            ["promotions_changed", "settings_changed"].includes(e.message)
            ? "conflict"
            : "writeError",
        );
      }
    } finally {
      busy.current = false;
    }
  }
  const draft = data?.drafts.find((d) => "publish:" + d.id === selection),
    rule = data?.promotions.find((r) => "unpublish:" + r.id === selection);
  return (
    <>
      <Button
        variant="secondary"
        onClick={() => {
          setOpen(true);
          setMessage("");
          void load();
        }}
      >
        {t("Review publication", "Vérifier la publication")}
      </Button>
      <Dialog
        open={open}
        onOpenChange={(v) => {
          if (!busy.current) {
            if (!v) readSequence.current++;
            setOpen(v);
          }
        }}
      >
        <DialogContent closeLabel={t("Close", "Fermer")}>
          <DialogTitle>
            {t(
              "Publish or withdraw a promotion",
              "Publier ou retirer une promotion",
            )}
          </DialogTitle>
          <DialogDescription>
            {t(
              "Saved drafts only. Publication changes eligible checkout discounts; it does not change paid orders.",
              "Brouillons sauvegardés seulement. La publication modifie les rabais admissibles au paiement, pas les commandes payées.",
            )}
          </DialogDescription>
          {state === "loading" && (
            <p role="status">
              {t("Loading current rules…", "Chargement des règles…")}
            </p>
          )}
          {message && <p role="status">{message}</p>}
          {["readError", "conflict"].includes(state) && (
            <p role="alert">
              {t(
                "Current rules must be loaded before continuing.",
                "Chargez les règles actuelles pour continuer.",
              )}
            </p>
          )}
          {state !== "saving" && state !== "loading" && (
            <Button variant="secondary" onClick={() => void load()}>
              {t("Reload current rules", "Recharger les règles")}
            </Button>
          )}
          {data && (
            <>
              <p>
                {data.promotions.length}/20{" "}
                {t(
                  "published rules (including scheduled or expired)",
                  "règles publiées (y compris à venir ou expirées)",
                )}
              </p>
              <label>
                {t("Action", "Action")}
                <select
                  value={selection}
                  disabled={!["ready", "writeError"].includes(state)}
                  onChange={(e) => {
                    setSelection(e.target.value);
                    setConsent(false);
                    attempt.current = null;
                    setMessage("");
                  }}
                >
                  <option value="">
                    {t("Choose an action", "Choisir une action")}
                  </option>
                  {data.drafts.map((d) => (
                    <option key={"publish:" + d.id} value={"publish:" + d.id}>
                      {t("Publish / replace: ", "Publier / remplacer : ")}
                      {d.name}
                    </option>
                  ))}
                  {data.promotions.map((r) => (
                    <option
                      key={"unpublish:" + r.id}
                      value={"unpublish:" + r.id}
                    >
                      {t("Withdraw: ", "Retirer : ")}
                      {data.drafts.find((d) => d.id === r.id)?.name ?? r.id}
                    </option>
                  ))}
                </select>
              </label>
              {draft && (
                <div>
                  <p>
                    {draft.name} · {draft.percent}% · {draft.minimum}{" "}
                    {t("cards minimum", "cartes minimum")} ·{" "}
                    {draft.coupon || t("No coupon", "Sans code")}
                  </p>
                  <p>{t("Minimum spend: ", "Dépense minimale : ")}{money(draft.minimumCents ?? 0)} {t("Both quantity and spend are required, before basket discounts, shipping and taxes.", "Quantité et dépense requises, avant rabais panier, livraison et taxes.")}</p>
                  <p>
                    {t(
                      "UTC calendar days, not local time. Starts at",
                      "Jours du calendrier UTC, pas l’heure locale. Début :",
                    )}{" "}
                    {draft.start} 00:00 UTC.{" "}
                    {t(
                      "Includes the full end day",
                      "Inclut toute la journée de fin",
                    )}{" "}
                    {draft.end} UTC.
                  </p>
                  <p>
                    {t("Ends exclusively at", "Fin exclusive :")}{" "}
                    {new Date(
                      Date.parse(draft.end + "T00:00:00.000Z") + 86400000,
                    ).toISOString()}
                  </p>
                  <p>
                    {t(
                      "One best eligible discount; sale-priced cards are excluded. Existing rules with the same ID are replaced.",
                      "Un seul rabais admissible, le plus avantageux; cartes déjà soldées exclues. La règle du même identifiant sera remplacée.",
                    )}
                  </p>
                </div>
              )}
              {rule && (
                <p>
                  {t(
                    "Withdraw this rule from future quotes. Existing paid orders remain unchanged.",
                    "Retirer cette règle des prochains calculs. Les commandes payées restent inchangées.",
                  )}{" "}
                  {rule.startsAt ?? t("No start date", "Sans date de début")} —{" "}
                  {rule.endsAt ?? t("No end date", "Sans date de fin")}
                </p>
              )}
              {selection && (
                <label>
                  <input
                    type="checkbox"
                    checked={consent}
                    disabled={!["ready", "writeError"].includes(state)}
                    onChange={(e) => setConsent(e.target.checked)}
                  />
                  {t(
                    "I confirm this action and the displayed UTC schedule.",
                    "Je confirme cette action et les dates UTC affichées.",
                  )}
                </label>
              )}
              <Button
                disabled={
                  !selection ||
                  !consent ||
                  !["ready", "writeError"].includes(state)
                }
                onClick={() => void command()}
              >
                {state === "saving"
                  ? t("Saving…", "Enregistrement…")
                  : t("Confirm action", "Confirmer")}
              </Button>
            </>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}
