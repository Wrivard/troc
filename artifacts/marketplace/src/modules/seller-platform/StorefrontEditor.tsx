import {
  boundedFraming,
  centeredFraming,
  demoCoverRules,
  validateCoverDimensions,
  type CoverFraming,
} from "../store-cover-editor/crop";
import { StoreDescriptionEditor } from "./StoreDescriptionEditor";
import { useEffect, useRef, useState } from "react";
import { Button } from "@workspace/troc-design-system/components/ui/button";
import { Input } from "@workspace/troc-design-system/components/ui/input";
import { usePreferences } from "@workspace/troc-design-system/hooks/use-preferences";
import { MarketplaceHeader, MarketplaceFooter } from "../brand/SiteChrome";
import { useSellerWorkspace } from "./SellerShell";
import { api } from "../../api";
import "./seller-settings.css";
import "./storefront-editor.css";
type Draft = {
  description: string;
  banner: string;
  logo: string;
  position: number;
  framing?: CoverFraming;
};
const blank: Draft = { description: "", banner: "", logo: "", position: 50 };
export function StorefrontEditor() {
  const { locale, theme, setLocale, setTheme } = usePreferences(),
    fr = locale === "fr",
    t = (a: string, b: string) => (fr ? b : a);
  const { seller, shops } = useSellerWorkspace();
  const [publicDescription, setPublicDescription] = useState({
    en: "",
    fr: "",
  });
  const [previewMode, setPreviewMode] = useState("desktop");
  const [previewLanguage, setPreviewLanguage] = useState<"en" | "fr">(locale);
  const [access, setAccess] = useState("loading");
  const [accessRevision, setAccessRevision] = useState(0);
  const [draft, setDraft] = useState<Draft>(blank),
    [saved, setSaved] = useState<Draft>(blank),
    [notice, setNotice] = useState(""),
    [busy, setBusy] = useState(false),
    [canManage, setCanManage] = useState(false);
  const generation = useRef(0);
  const framing = boundedFraming(
    draft.framing ?? { x: 50, y: draft.position, zoom: 1 },
  );
  const key = "troc.storefront-draft.v1." + seller,
    dirty = JSON.stringify(draft) !== JSON.stringify(saved);
  useEffect(() => {
    const current = ++generation.current;
    if (!seller) return;
    let active = true;
    setCanManage(false);
    setBusy(false);
    setAccess("loading");
    setNotice("");
    let value = blank;
    try {
      const v = JSON.parse(localStorage.getItem(key) || "null");
      if (
        v &&
        typeof v.description === "string" &&
        typeof v.banner === "string" &&
        typeof v.logo === "string" &&
        Number.isFinite(v.position)
      )
        value = {
          description: v.description.slice(0, 500),
          banner: /^data:image\/(jpeg|png|webp);base64,/.test(v.banner)
            ? v.banner
            : "",
          logo: /^data:image\/(jpeg|png|webp);base64,/.test(v.logo)
            ? v.logo
            : "",
          position: Math.min(100, Math.max(0, v.position)),
          framing: boundedFraming(
            v.framing &&
              [v.framing.x, v.framing.y, v.framing.zoom].every(Number.isFinite)
              ? v.framing
              : { x: 50, y: v.position, zoom: 1 },
          ),
        };
    } catch {
      /* Browser storage can be disabled; keep the in-memory view. */
    }
    setDraft(value);
    setSaved(value);
    api<{ canManage: boolean }>("/seller/platform/" + seller + "/settings")
      .then((v) => {
        if (active) { setCanManage(v.canManage); setAccess(v.canManage ? "ready" : "readonly"); }
      })
      .catch(() => { if (active) setAccess("error"); });
    return () => {
      active = false;
      if (generation.current === current) generation.current++;
    };
  }, [seller, key, accessRevision]);
  useEffect(() => {
    if (!dirty && !busy) return;
    const leave = (e: BeforeUnloadEvent) => {
      e.preventDefault();
      e.returnValue = "";
    };
    const change = (e: Event) => {
      if (busy) {
        e.preventDefault();
        return;
      }
      if (
        !window.confirm(
          t(
            "Discard this unsaved storefront draft?",
            "Abandonner ce brouillon non enregistré ?",
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
  }, [dirty, locale, busy]);
  async function imageFile(file: File | undefined, field: "banner" | "logo") {
    if (!file || !canManage || busy) return;
    const request = generation.current;
    setNotice("");
    if (
      !["image/jpeg", "image/png", "image/webp"].includes(file.type) ||
      file.size === 0 ||
      file.size > 5 * 1024 * 1024
    ) {
      setNotice(
        t(
          "Choose a JPG, PNG or WebP image under 5 MB.",
          "Choisissez une image JPG, PNG ou WebP de moins de 5 Mo.",
        ),
      );
      return;
    }
    setBusy(true);
    try {
      const bitmap = await createImageBitmap(file);
      if (
        bitmap.width * bitmap.height > 40000000 ||
        (field === "banner" &&
          validateCoverDimensions(bitmap.width, bitmap.height, demoCoverRules))
      ) {
        bitmap.close();
        throw Error();
      }
      if (field === "banner") {
        bitmap.close();
        const original = await new Promise<string>((resolve, reject) => {
          const reader = new FileReader();
          reader.onload = () => resolve(String(reader.result));
          reader.onerror = () => reject(new Error("read"));
          reader.readAsDataURL(file);
        });
        if (generation.current === request)
          setDraft((d) => ({
            ...d,
            banner: original,
            position: 50,
            framing: { ...centeredFraming },
          }));
        return;
      }
      const max = 400,
        scale = Math.min(1, max / Math.max(bitmap.width, bitmap.height)),
        canvas = document.createElement("canvas");
      canvas.width = Math.round(bitmap.width * scale);
      canvas.height = Math.round(bitmap.height * scale);
      const ctx = canvas.getContext("2d");
      if (!ctx) throw Error();
      ctx.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
      bitmap.close();
      const value = canvas.toDataURL("image/webp", 0.9);
      if (generation.current === request)
        setDraft((d) => ({ ...d, [field]: value }));
    } catch {
      if (generation.current !== request) return;
      setNotice(
        t(
          "This image could not be opened. Banners need at least 800 × 320 px, at most 10,000 px per side and 40 megapixels.",
          "Impossible d’ouvrir cette image. Bannière : au moins 800 × 320 px, au plus 10 000 px par côté et 40 mégapixels.",
        ),
      );
    } finally {
      if (generation.current === request) setBusy(false);
    }
  }
  const name = shops.find((s) => s.id === seller)?.display_name ?? "TROC";
  return (
    <>
      <MarketplaceHeader
        locale={locale}
        theme={theme}
        onLocale={setLocale}
        onTheme={setTheme}
      />
      <main
        id="main-content"
        className="seller-settings-page storefront-editor-page"
      >
        <header className="seller-page-heading">
          <div>
            <h1>{t("Edit storefront", "Modifier la vitrine")}</h1>
            <p>
              {t(
                "Create a recognisable home for your store.",
                "Créez une vitrine reconnaissable pour votre boutique.",
              )}
            </p>
          </div>
        </header>
        <nav className="storefront-jump-links" aria-label={t("Editor sections", "Sections de l’éditeur")}>
          <a href="#storefront-appearance">{t("Brand images", "Images de marque")}</a>
          <a href="#storefront-story">{t("Store story", "Histoire de la boutique")}</a>
          <a href="#storefront-preview">{t("Preview", "Aperçu")}</a>
        </nav>
        <div className="storefront-editor-grid">
          <div className="storefront-editor-controls">
          <section className="settings-panel" id="storefront-appearance">
            <div className="storefront-section-label">{t("01 · Visual identity", "01 · Identité visuelle")}</div>
            <h2>{t("Make it yours", "À votre image")}</h2>
            <p>
              {t(
                "Start with a recognisable logo and a banner that feels like your store.",
                "Choisissez un logo reconnaissable et une bannière à l’image de votre boutique.",
              )}
            </p>
            <a
              className="storefront-name-link"
              href={"/seller/settings?lang=" + locale}
            >
              {t(
                "Edit store name in Settings",
                "Modifier le nom dans les paramètres",
              )}
            </a>
            <p className="storefront-scope-note">{t("Artwork is a browser-only draft for now. Saving here does not change your public store.", "Les images sont un brouillon local pour le moment. Leur enregistrement ne modifie pas votre boutique publique.")}</p>
            {access === "loading" && <p role="status">{t("Checking editing permissions…", "Vérification des droits de modification…")}</p>}
            {access === "readonly" && <p role="status">{t("You can preview this store. An owner or manager can edit its images.", "Vous pouvez consulter cette vitrine. Un propriétaire ou gestionnaire peut modifier ses images.")}</p>}
            {access === "error" && <div role="alert"><p>{t("Editing permissions could not load.", "Impossible de vérifier vos droits de modification.")}</p><Button variant="outline" onClick={() => setAccessRevision(n => n + 1)}>{t("Try again", "Réessayer")}</Button></div>}
            <fieldset disabled={!canManage || busy}>
              {(["logo", "banner"] as const).map((field) => (
                <div key={field} className="storefront-field storefront-upload">
                  <label>
                    <div className={"storefront-upload-thumb storefront-upload-thumb--" + field} aria-hidden="true">
                      {draft[field] ? <img src={draft[field]} alt="" /> : <span>{field === "logo" ? name.slice(0, 1) : "+"}</span>}
                    </div>
                    <span>
                      {field === "logo" ? "Logo" : t("Banner", "Bannière")}
                    </span>
                    <strong>
                      {draft[field]
                        ? t("Replace image", "Remplacer l’image")
                        : t("Choose an image", "Choisir une image")}
                    </strong>
                    <Input
                      aria-label={
                        field === "logo" ? "Logo" : t("Banner", "Bannière")
                      }
                      type="file"
                      accept="image/jpeg,image/png,image/webp"
                      onChange={(e) => {
                        void imageFile(e.target.files?.[0], field);
                        e.target.value = "";
                      }}
                    />
                  </label>
                  <small>
                    {field === "logo"
                      ? t(
                          "Square artwork · 400 × 400 px recommended.",
                          "Image carrée · 400 × 400 px recommandés.",
                        )
                      : t(
                          "Wide artwork · 2000 × 800 px recommended. Original preserved.",
                          "Image large · 2000 × 800 px recommandés. Original conservé.",
                        )}{" "}
                    JPG, PNG, WebP · 5 MB max.
                  </small>
                  {draft[field] && (
                    <Button
                      variant="outline"
                      aria-label={t("Remove " + field, field === "logo" ? "Retirer le logo" : "Retirer la bannière")}
                      onClick={() => { setDraft((d) => ({ ...d, [field]: "" })); setNotice(""); }}
                    >
                      {t("Remove", "Retirer")}
                    </Button>
                  )}
                </div>
              ))}
              {draft.banner && (
                <div className="storefront-framing">
                  {(["x", "y", "zoom"] as const).map((axis) => (
                    <label className="storefront-field" key={axis}>
                      <span>
                        {axis === "x"
                          ? t("Horizontal framing", "Cadrage horizontal")
                          : axis === "y"
                            ? t("Vertical framing", "Cadrage vertical")
                            : "Zoom"}{" "}
                        <output>
                          {framing[axis]}
                          {axis === "zoom" ? "×" : "%"}
                        </output>
                      </span>
                      <input
                        aria-label={
                          axis === "x"
                            ? t("Horizontal framing", "Cadrage horizontal")
                            : axis === "y"
                              ? t("Vertical framing", "Cadrage vertical")
                              : "Zoom"
                        }
                        type="range"
                        min={axis === "zoom" ? 1 : 0}
                        max={axis === "zoom" ? 3 : 100}
                        step={axis === "zoom" ? 0.05 : 1}
                        value={framing[axis]}
                        onChange={(e) =>
                          setDraft((d) => ({
                            ...d,
                            framing: {
                              ...boundedFraming(
                                d.framing ?? { x: 50, y: d.position, zoom: 1 },
                              ),
                              [axis]: Number(e.target.value),
                            },
                          }))
                        }
                      />
                    </label>
                  ))}
                  <Button
                    variant="outline"
                    onClick={() =>
                      setDraft((d) => ({
                        ...d,
                        position: 50,
                        framing: { ...centeredFraming },
                      }))
                    }
                  >
                    {t("Reset framing", "Réinitialiser le cadrage")}
                  </Button>
                  <p>
                    {t(
                      "Check both previews. Desktop covers use 5:2; mobile and store cards use 16:9. Your original stays intact.",
                      "Vérifiez les deux aperçus. Format ordinateur 5:2; mobile et cartes boutique 16:9. Votre original reste intact.",
                    )}
                  </p>
                </div>
              )}
            </fieldset>
        {notice && (
          <p role="status" className="settings-feedback">
            {notice}
          </p>
        )}
        <footer className="settings-savebar" data-dirty={dirty} aria-busy={busy}>
          <span>
            {dirty
              ? t("Unsaved images", "Images non enregistrées")
              : t("No unsaved image changes", "Aucune modification d’image à enregistrer")}
          </span>
          <div className="seller-page-actions">
            <Button
              variant="outline"
              disabled={!dirty || busy}
              onClick={() => {
                setDraft(saved);
                setNotice("");
              }}
            >
              {t("Discard changes", "Annuler les modifications")}
            </Button>
            <Button
              disabled={!dirty || busy || !canManage}
              onClick={() => {
                try {
                  localStorage.setItem(key, JSON.stringify(draft));
                  setSaved(draft);
                  setNotice(
                    t(
                      "Draft saved in this browser.",
                      "Brouillon enregistré dans ce navigateur.",
                    ),
                  );
                } catch {
                  setNotice(
                    t(
                      "Not saved: browser storage is full or unavailable. Try smaller images.",
                      "Non enregistré : stockage plein ou indisponible. Essayez des images plus petites.",
                    ),
                  );
                }
              }}
            >
              {busy ? t("Preparing image…", "Préparation de l’image…") : t("Save local draft", "Enregistrer le brouillon")}
            </Button>
          </div>
        </footer>
          </section>
          <StoreDescriptionEditor key={seller} seller={seller} fr={fr} legacyText={draft.description} onPreview={setPublicDescription} />
          </div>
          <section id="storefront-preview"
            className={
              "settings-panel storefront-preview " +
              (previewMode === "mobile" ? "storefront-preview-mobile" : "")
            }
          >
            <div className="storefront-preview-heading">
              <h2>{t("Live preview", "Aperçu en direct")}</h2>
              <div
                role="group"
                aria-label={t("Preview size", "Taille de l’aperçu")}
              >
                <button
                  aria-pressed={previewMode === "desktop"}
                  onClick={() => setPreviewMode("desktop")}
                >
                  {t("Desktop", "Ordinateur")}
                </button>
                <button
                  aria-pressed={previewMode === "mobile"}
                  onClick={() => setPreviewMode("mobile")}
                >
                  {t("Mobile", "Mobile")}
                </button>
              </div>
            </div>
            <div className="storefront-preview-language" role="group" aria-label={t("Preview language", "Langue de l’aperçu")}>
              <span>{t("Description language", "Langue de description")}</span>
              {(["en", "fr"] as const).map(lang => <button key={lang} aria-pressed={previewLanguage === lang} onClick={() => setPreviewLanguage(lang)}>{lang === "en" ? "EN" : "FR"}</button>)}
            </div>
            <p className="storefront-preview-caption">{t("Preview includes your unpublished edits.", "L’aperçu inclut vos modifications non publiées.")}</p>
            <div className="storefront-preview-banner">
              {draft.banner ? (
                <img
                  src={draft.banner}
                  alt=""
                  style={{
                    objectPosition: `${framing.x}% ${framing.y}%`,
                    transform: `scale(${framing.zoom})`,
                    transformOrigin: `${framing.x}% ${framing.y}%`,
                  }}
                />
              ) : (
                <span>{t("Your banner", "Votre bannière")}</span>
              )}
            </div>
            <div className="storefront-preview-identity">
              <div className="storefront-preview-logo">
                {draft.logo ? (
                  <img src={draft.logo} alt="" />
                ) : (
                  name.slice(0, 1)
                )}
              </div>
              <div>
                <h3>{name}</h3>
                <p>Canada · CAD</p>
              </div>
            </div>
            <p className="storefront-preview-description">
              {publicDescription[previewLanguage] ||
                (previewLanguage === "fr" ? "Votre description apparaîtra ici." : "Your description will appear here.")}
            </p>
            <div className="storefront-preview-bottom">
              {t(
                "Listings will appear below your store information.",
                "Les annonces apparaîtront sous les informations de boutique.",
              )}
            </div>
          </section>
        </div>

      </main>
      <MarketplaceFooter locale={locale} />
    </>
  );
}
