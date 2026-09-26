import { useEffect, useRef, useState } from "react";
import { Button } from "@workspace/troc-design-system/components/ui/button";
import { Textarea } from "@workspace/troc-design-system/components/ui/textarea";
import { api } from "../../api";
type Profile = {
  storyEn: string;
  storyFr: string;
  version: string;
  canManage: boolean;
};
export function StoreDescriptionEditor({
  seller,
  fr,
  legacyText,
  onPreview,
}: {
  seller: string;
  fr: boolean;
  legacyText: string;
  onPreview: (value: { en: string; fr: string }) => void;
}) {
  const t = (en: string, frText: string) => (fr ? frText : en);
  const [saved, setSaved] = useState<Profile | null>(null),
    [en, setEn] = useState(""),
    [french, setFrench] = useState(""),
    [busy, setBusy] = useState(false),
    [error, setError] = useState(""),
    [notice, setNotice] = useState(""),
    [revision, setRevision] = useState(0);
  const alive = useRef(true);
  const dirty = !!saved && (en !== saved.storyEn || french !== saved.storyFr);
  useEffect(() => {
    alive.current = true;
    return () => {
      alive.current = false;
    };
  }, []);
  useEffect(() => {
    let active = true;
    setSaved(null);
    setError("");
    api<Profile>("/seller/platform/" + seller + "/storefront")
      .then((v) => {
        if (active) {
          setSaved(v);
          setEn(v.storyEn);
          setFrench(v.storyFr);
        }
      })
      .catch(() => {
        if (active)
          setError(
            t(
              "Store description could not load.",
              "Impossible de charger la description.",
            ),
          );
      });
    return () => {
      active = false;
    };
  }, [seller, revision]);
  useEffect(() => {
    onPreview({ en, fr: french });
  }, [en, french, onPreview]);
  useEffect(() => {
    if (!dirty && !busy) return;
    const leave = (e: BeforeUnloadEvent) => {
      e.preventDefault();
      e.returnValue = "";
    };
    const change = (e: Event) => {
      if (
        busy ||
        !window.confirm(
          t(
            "Discard unpublished description changes?",
            "Abandonner les modifications non publiées ?",
          ),
        )
      )
        e.preventDefault();
    };
    window.addEventListener("beforeunload", leave);
    window.addEventListener("troc:seller-change", change);
    return () => {
      window.removeEventListener("beforeunload", leave);
      window.removeEventListener("troc:seller-change", change);
    };
  }, [dirty, busy, fr]);
  async function save() {
    if (!saved || busy || !saved.canManage) return;
    setBusy(true);
    setError("");
    setNotice("");
    try {
      const v = await api<Profile>(
        "/seller/platform/" + seller + "/storefront",
        "POST",
        { version: saved.version, storyEn: en, storyFr: french },
      );
      if (alive.current) {
        setSaved(v);
        setEn(v.storyEn);
        setFrench(v.storyFr);
        setNotice(
          t(
            "Description published to your storefront.",
            "Description publiée sur votre vitrine.",
          ),
        );
      }
    } catch (e) {
      if (alive.current)
        setError(
          e instanceof Error && e.message === "settings_changed"
            ? t(
                "The description changed elsewhere. Your text is kept. Copy it before reloading the latest version.",
                "La description a été modifiée ailleurs. Votre texte est conservé. Copiez-le avant de recharger la version actuelle.",
              )
            : t(
                "Not published. Your text is kept; try again.",
                "Non publiée. Votre texte est conservé; réessayez.",
              ),
        );
    } finally {
      if (alive.current) setBusy(false);
    }
  }
  return (
    <section id="storefront-story" className="settings-panel storefront-description-editor" aria-busy={busy}>
      <div className="storefront-section-label">{t("02 · Your store story", "02 · L’histoire de votre boutique")}</div>
      <h2>{t("Your public description", "Votre description publique")}</h2>
      <p>
        {t(
          "Tell collectors what makes your store yours. Both languages publish together. No automatic translation.",
          "Présentez votre boutique aux collectionneurs. Les deux langues sont publiées ensemble, sans traduction automatique.",
        )}
      </p>
      {!saved && !error && <div className="storefront-text-loading" role="status" aria-label={t("Loading description", "Chargement de la description")}><span /><span /><span /></div>}
      {saved && !saved.canManage && <p role="status">{t("Only owners and managers can publish changes.", "Seuls les propriétaires et gestionnaires peuvent publier des modifications.")}</p>}
      <fieldset
        disabled={!saved?.canManage || busy}
        className="storefront-description-fields" hidden={!saved}
      >
        {(
          [
            ["English", en, setEn],
            ["Français", french, setFrench],
          ] as const
        ).map(([label, value, set]) => (
          <label className="storefront-field" key={label}>
            {label}
            <Textarea
              aria-label={
                label + " — " + t("public description", "description publique")
              }
              value={value}
              maxLength={500}
              placeholder={t("What do you collect? What can buyers expect from your store?", "Que collectionnez-vous ? Que propose votre boutique ?")}
              onChange={(e) => { set(e.target.value); setNotice(""); }}
            />
            <small>{value.length}/500</small>
          </label>
        ))}
      </fieldset>
      {!!legacyText && saved?.canManage && !en && !french && (
        <div className="seller-page-actions">
          <Button
            variant="outline"
            disabled={busy}
            onClick={() => setEn(legacyText)}
          >
            {t(
              "Use previous browser draft in English",
              "Utiliser le brouillon précédent en anglais",
            )}
          </Button>
          <Button
            variant="outline"
            disabled={busy}
            onClick={() => setFrench(legacyText)}
          >
            {t(
              "Use previous browser draft in French",
              "Utiliser le brouillon précédent en français",
            )}
          </Button>
        </div>
      )}
      {error && (
        <p role="alert" className="settings-feedback">
          {error}
        </p>
      )}
      {notice && (
        <p role="status" className="settings-feedback">
          {notice}
        </p>
      )}
      <p className="storefront-publish-state">{dirty ? t("Unpublished text changes", "Modifications du texte non publiées") : saved ? t("Up to date with your public store", "À jour avec votre boutique publique") : ""}</p>
      <div className="seller-page-actions">
        <Button
          variant="outline"
          disabled={busy || !dirty}
          onClick={() => {
            if (saved) {
              setEn(saved.storyEn);
              setFrench(saved.storyFr);
              setNotice("");
              setError("");
            }
          }}
        >
          {t("Discard text changes", "Annuler les modifications du texte")}
        </Button>
        {error && (
          <Button
            variant="outline"
            disabled={busy}
            onClick={() => {
              if (
                !dirty ||
                window.confirm(
                  t(
                    "Reload and discard your unpublished text?",
                    "Recharger et abandonner votre texte non publié ?",
                  ),
                )
              )
                setRevision((n) => n + 1);
            }}
          >
            {t("Reload latest", "Recharger")}
          </Button>
        )}
        <Button
          disabled={!dirty || busy || !saved?.canManage}
          onClick={() => void save()}
        >
          {busy
            ? t("Saving…", "Enregistrement…")
            : t("Publish description", "Publier la description")}
        </Button>
      </div>
    </section>
  );
}
