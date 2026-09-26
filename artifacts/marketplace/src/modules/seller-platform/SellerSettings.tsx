import { SellerLoading } from "./SellerLoading";
import { useEffect, useState } from "react";
import { Button } from "@workspace/troc-design-system/components/ui/button";
import { Input } from "@workspace/troc-design-system/components/ui/input";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@workspace/troc-design-system/components/ui/select";
import { usePreferences } from "@workspace/troc-design-system/hooks/use-preferences";
import { MarketplaceHeader, MarketplaceFooter } from "../brand/SiteChrome";
import { useSellerWorkspace } from "./SellerShell";
import { useSession } from "../account/Workspace";
import { api } from "../../api";
import "./seller-settings.css";
type Settings = {
  display_name: string;
  slug: string;
  country: string;
  version: string;
  minimum_order_cents: number;
  handling_days: number;
  free_shipping_threshold_cents?: number | null;
  canSetFreeShipping?: boolean;
  payout_status: string;
  canManage: boolean;
};
const shippingText = (value: number | null | undefined) => value == null ? "" : (value / 100).toFixed(2);
const shippingCents = (value: string) => {
  if (!value.trim()) return null;
  const normalized=value.trim().replace(",", ".");
  if (!/^\d{1,7}(?:\.\d{1,2})?$/.test(normalized)) throw new Error("invalid_shipping_threshold");
  const [whole,fraction=""]=normalized.split(".");
  const cents=Number(whole)*100+Number(fraction.padEnd(2,"0"));
  if(cents>100000000) throw new Error("invalid_shipping_threshold");
  return cents;
};
export function SellerSettings() {
  const { locale, theme, setLocale, setTheme } = usePreferences(),
    fr = locale === "fr",
    t = (a: string, b: string) => (fr ? b : a);
  const { seller } = useSellerWorkspace(),
    { user } = useSession();
  const [saved, setSaved] = useState<Settings | null>(null),
    [name, setName] = useState(""),
    [days, setDays] = useState("2"),
    [minimum, setMinimum] = useState("0"),
    [freeShipping, setFreeShipping] = useState(""),
    [busy, setBusy] = useState(false),
    [error, setError] = useState(""),
    [notice, setNotice] = useState(""),
    [conflict, setConflict] = useState(false),
    [revision, setRevision] = useState(0);
  const dirty =
    !!saved &&
    (name !== saved.display_name ||
      Number(days) !== saved.handling_days ||
      Number(minimum) !== saved.minimum_order_cents ||
      freeShipping !== shippingText(saved.free_shipping_threshold_cents));
  useEffect(() => {
    if (!seller) return;
    let active = true;
    setSaved(null);
    setConflict(false);
    setError("");
    setNotice("");
    api<Settings>("/seller/platform/" + seller + "/settings")
      .then((v) => {
        if (active) {
          setSaved(v);
          setName(v.display_name);
          setDays(String(v.handling_days));
          setMinimum(String(v.minimum_order_cents));
          setFreeShipping(shippingText(v.free_shipping_threshold_cents));
        }
      })
      .catch(() => {
        if (active)
          setError(
            t(
              "Settings could not load. Please retry.",
              "Impossible de charger les paramètres. Réessayez.",
            ),
          );
      });
    return () => {
      active = false;
    };
  }, [seller, revision]);
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
            "Discard unsaved changes and switch stores?",
            "Abandonner les modifications et changer de boutique ?",
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
  async function reviewLatest() {
    if (!saved || busy) return;
    setBusy(true);
    try {
      const fresh = await api<Settings>(
        "/seller/platform/" + seller + "/settings",
      );
      // Preserve edited fields; accept concurrent changes to untouched fields.
      setName(name === saved.display_name ? fresh.display_name : name);
      setDays(
        Number(days) === saved.handling_days
          ? String(fresh.handling_days)
          : days,
      );
      setMinimum(
        Number(minimum) === saved.minimum_order_cents
          ? String(fresh.minimum_order_cents)
          : minimum,
      );
      setFreeShipping(freeShipping === shippingText(saved.free_shipping_threshold_cents) ? shippingText(fresh.free_shipping_threshold_cents) : freeShipping);
      setSaved(fresh);
      setConflict(false);
      setError("");
      setNotice(
        t(
          "Latest settings loaded. Your edited fields are kept; review them before saving.",
          "Paramètres récents chargés. Vos champs modifiés sont conservés; vérifiez-les avant d’enregistrer.",
        ),
      );
    } catch {
      setError(
        t(
          "Latest settings could not load. Your entries are preserved; try again.",
          "Impossible de charger les paramètres récents. Vos saisies sont conservées; réessayez.",
        ),
      );
    } finally {
      setBusy(false);
    }
  }
  const reset = () => {
    if (saved) {
      setName(saved.display_name);
      setDays(String(saved.handling_days));
      setMinimum(String(saved.minimum_order_cents));
      setFreeShipping(shippingText(saved.free_shipping_threshold_cents));
      setError("");
      setNotice("");
    }
  };
  return (
    <>
      <MarketplaceHeader
        locale={locale}
        theme={theme}
        onLocale={setLocale}
        onTheme={setTheme}
      />
      <main id="main-content" className="seller-settings-page">
        <header className="seller-page-heading">
          <div>
            <h1>{t("Settings", "Paramètres")}</h1>
            <p>
              {t(
                "Manage your store identity and selling preferences.",
                "Gérez l’identité de votre boutique et vos préférences de vente.",
              )}
            </p>
          </div>
        </header>
        {error && (
          <div className="settings-feedback" role="alert">
            {error}{" "}
            {conflict && (
              <Button variant="outline" disabled={busy} onClick={reviewLatest}>
                {t("Review latest settings", "Vérifier les paramètres récents")}
              </Button>
            )}
            {!saved && (
              <Button
                onClick={() => setRevision((v) => v + 1)}
                variant="outline"
              >
                {t("Retry", "Réessayer")}
              </Button>
            )}
          </div>
        )}
        {notice && (
          <p className="settings-feedback" role="status">
            {notice}
          </p>
        )}
        {!saved && !error && <SellerLoading view="settings" locale={locale} />}
        {saved && (
          <form
            onSubmit={async (e) => {
              e.preventDefault();
              if (busy || conflict || !saved.canManage) return;
              setBusy(true);
              setError("");
              setNotice("");
              try {
                await api("/seller/platform/" + seller + "/settings", "POST", {
                  displayName: name,
                  handlingDays: Number(days),
                  minimumOrderCents: Number(minimum),
                  version: saved.version,
                  ...(freeShipping !== shippingText(saved.free_shipping_threshold_cents) ? {freeShippingCents: shippingCents(freeShipping)} : {}),
                });
                const fresh = await api<Settings>(
                  "/seller/platform/" + seller + "/settings",
                );
                setSaved(fresh);
                setName(fresh.display_name);
                setDays(String(fresh.handling_days));
                setMinimum(String(fresh.minimum_order_cents));
                setFreeShipping(shippingText(fresh.free_shipping_threshold_cents));
                window.dispatchEvent(new Event("troc:seller-updated"));
                setNotice(
                  t(
                    "Store settings saved.",
                    "Paramètres de boutique enregistrés.",
                  ),
                );
              } catch (e) {
                if (e instanceof Error && e.message === "settings_changed")
                  setConflict(true);
                setError(
                  e instanceof Error && e.message === "invalid_shipping_threshold"
                    ? t("Enter a CAD amount from 0 to 1,000,000 with at most two decimals, or leave blank.", "Saisissez un montant CAD de 0 à 1 000 000 avec deux décimales maximum, ou laissez vide.")
                    : e instanceof Error && e.message === "free_shipping_level_required"
                    ? t("Your store level cannot enable free shipping. You can clear the threshold to disable it.", "Votre niveau ne permet pas d’activer la livraison gratuite. Effacez le seuil pour la désactiver.")
                    : e instanceof Error && e.message === "settings_changed"
                    ? t(
                        "These settings changed in another session. Your entries are still here. Review the latest settings before saving again.",
                        "Ces paramètres ont changé dans une autre session. Vos saisies sont conservées. Vérifiez les paramètres récents avant de réessayer.",
                      )
                    : t(
                        "Changes were not confirmed. Your entries are still here; please retry.",
                        "Modifications non confirmées. Vos saisies sont conservées; réessayez.",
                      ),
                );
              } finally {
                setBusy(false);
              }
            }}
          >
            {!saved.canManage && (
              <p className="settings-feedback">
                {t(
                  "Only a store owner or administrator can change these settings.",
                  "Seul un propriétaire ou administrateur peut modifier ces paramètres.",
                )}
              </p>
            )}
            <div className="settings-grid">
              <section className="settings-panel">
                <div className="settings-panel-top">
                  <div>
                    <h2>
                      {t("Store information", "Informations de boutique")}
                    </h2>
                    <p>
                      {t(
                        "How buyers recognise your store on TROC.",
                        "Comment les acheteurs reconnaissent votre boutique.",
                      )}
                    </p>
                  </div>
                  <a href={"/seller/storefront?lang=" + locale}>
                    {t("Edit storefront", "Modifier la vitrine")} →
                  </a>
                </div>
                <label className="settings-row">
                  <span>{t("Store name", "Nom de boutique")}</span>
                  <div>
                    <Input
                      aria-label={t("Store name", "Nom de boutique")}
                      required
                      maxLength={50}
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      disabled={!saved.canManage || busy}
                    />
                    <small>{name.length}/50</small>
                  </div>
                </label>
                <div className="settings-row">
                  <span>{t("Store address", "Adresse de boutique")}</span>
                  <code>/stores/{saved.slug}</code>
                </div>
                <div className="settings-brand-note">
                  <strong>
                    {t("Make it yours", "Une boutique à votre image")}
                  </strong>
                  <p>
                    {t(
                      "Prepare your logo, banner and description in the storefront editor.",
                      "Préparez votre logo, votre bannière et votre description dans l’éditeur de vitrine.",
                    )}
                  </p>
                  <Button asChild variant="outline">
                    <a href={"/seller/storefront?lang=" + locale}>
                      {t("Open storefront editor", "Ouvrir l’éditeur")}
                    </a>
                  </Button>
                </div>
              </section>
              <section className="settings-panel">
                <h2>{t("Your personal account", "Votre compte personnel")}</h2>
                <p>
                  {t(
                    "Your login and personal preferences belong to your account, not your store.",
                    "Votre connexion et vos préférences personnelles appartiennent à votre compte, pas à votre boutique.",
                  )}
                </p>
                <div className="settings-row">
                  <span>{t("Email", "Courriel")}</span>
                  <strong className="settings-email">{user?.email}</strong>
                </div>
                <div className="settings-row">
                  <span>
                    {t("Language and appearance", "Langue et apparence")}
                  </span>
                  <Button asChild variant="outline">
                    <a href={"/account/settings?lang=" + locale}>
                      {t("Account preferences", "Préférences du compte")}
                    </a>
                  </Button>
                </div>
                <div className="settings-row">
                  <span>{t("Store permissions", "Accès à la boutique")}</span>
                  <Button asChild variant="outline">
                    <a href={"/seller/team?lang=" + locale}>
                      {t("Manage team", "Gérer l’équipe")}
                    </a>
                  </Button>
                </div>
              </section>
              <section className="settings-panel">
                <h2>{t("Selling preferences", "Préférences de vente")}</h2>
                <p>
                  {t(
                    "Applied to this store. Prices and minimums are in CAD.",
                    "Appliquées à cette boutique. Prix et minimums en CAD.",
                  )}
                </p>
                <div className="settings-row">
                  <span>
                    {t("Marketplace country", "Pays de la plateforme")}
                  </span>
                  <strong>Canada</strong>
                </div>
                <label className="settings-row">
                  <span>{t("Handling time", "Délai de préparation")}</span>
                  <Select
                    disabled={!saved.canManage || busy}
                    value={days}
                    onValueChange={setDays}
                  >
                    <SelectTrigger
                      aria-label={t("Handling time", "Délai de préparation")}
                    >
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {Array.from({ length: 31 }, (_, i) => (
                        <SelectItem value={String(i)} key={i}>
                          {i === 0
                            ? t("Same day", "Le jour même")
                            : i +
                              " " +
                              t(
                                i === 1 ? "business day" : "business days",
                                i === 1 ? "jour ouvrable" : "jours ouvrables",
                              )}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </label>
                <label className="settings-row">
                  <span>{t("Free shipping from (CAD)", "Livraison gratuite dès (CAD)")}</span>
                  <Input name="freeShipping" inputMode="decimal" value={freeShipping} maxLength={10} disabled={!saved.canManage || busy || (!saved.canSetFreeShipping && saved.free_shipping_threshold_cents == null)} onChange={e=>setFreeShipping(e.target.value)} placeholder={t("Disabled", "Désactivée")} />
                </label>
                <p>{t("Leave blank to disable; 0 offers free shipping on all eligible orders. Threshold uses merchandise after discounts, before taxes. Available to Established, Trusted and Elite stores.", "Laissez vide pour désactiver; 0 offre la livraison gratuite aux commandes admissibles. Seuil sur les articles après rabais, avant taxes. Réservé aux boutiques Established, Trusted et Elite.")}</p>
                <label className="settings-row">
                  <span>{t("Minimum order", "Commande minimale")}</span>
                  <Select
                    disabled={!saved.canManage || busy}
                    value={minimum}
                    onValueChange={setMinimum}
                  >
                    <SelectTrigger
                      aria-label={t("Minimum order", "Commande minimale")}
                    >
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {[0, 200, 500, 1000].map((n) => (
                        <SelectItem value={String(n)} key={n}>
                          {n === 0
                            ? t("No minimum", "Aucun minimum")
                            : new Intl.NumberFormat(fr ? "fr-CA" : "en-CA", {
                                style: "currency",
                                currency: "CAD",
                              }).format(n / 100)}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </label>
                <p className="settings-muted-note">
                  {t(
                    "Handling time is preparation time, not a guaranteed delivery date. Offers and vacation mode will be added separately.",
                    "Le délai concerne la préparation, pas une date de livraison garantie. Les offres et le mode vacances seront ajoutés séparément.",
                  )}
                </p>
              </section>
              <section className="settings-panel">
                <h2>{t("Payments & payouts", "Paiements et versements")}</h2>
                <p>
                  {t(
                    "Payout availability is separate from access to Seller Hub.",
                    "L’accès au Seller Hub ne signifie pas que les versements sont activés.",
                  )}
                </p>
                <div className="settings-status">
                  <span className="settings-dot" />
                  <div>
                    <strong>
                      {(
                        {
                          not_connected: t("Not connected", "Non connecté"),
                          pending: t(
                            "Verification pending",
                            "Vérification en attente",
                          ),
                          enabled: t("Enabled", "Activé"),
                          restricted: t("Restricted", "Restreint"),
                        } as Record<string, string>
                      )[saved.payout_status] ??
                        t("Unavailable", "Indisponible")}
                    </strong>
                    <p>
                      {t(
                        "Payment setup is not available in this local workspace.",
                        "La configuration des paiements n’est pas disponible dans cet espace local.",
                      )}
                    </p>
                  </div>
                </div>
                <h3>{t("Notifications", "Notifications")}</h3>
                <p>
                  {t(
                    "Order conversations are available inside each order. Email delivery and notification preferences are not connected yet.",
                    "Les conversations sont accessibles dans chaque commande. Les envois courriel et préférences de notifications ne sont pas encore connectés.",
                  )}
                </p>
                <Button asChild variant="outline">
                  <a href={"/seller/orders?lang=" + locale}>
                    {t("Open orders", "Ouvrir les commandes")}
                  </a>
                </Button>
              </section>
            </div>
            <footer className="settings-savebar" data-dirty={dirty}>
              <span>
                {dirty
                  ? t(
                      "You have unsaved changes",
                      "Modifications non enregistrées",
                    )
                  : t(
                      "Your settings are up to date",
                      "Vos paramètres sont à jour",
                    )}
              </span>
              <div className="seller-page-actions">
                <Button
                  type="button"
                  variant="outline"
                  disabled={!dirty || busy || conflict}
                  onClick={reset}
                >
                  {t("Discard changes", "Annuler les modifications")}
                </Button>
                <Button
                  disabled={!dirty || busy || conflict || !saved.canManage}
                  type="submit"
                >
                  {busy
                    ? t("Saving…", "Enregistrement…")
                    : t("Save changes", "Enregistrer")}
                </Button>
              </div>
            </footer>
          </form>
        )}
      </main>
      <MarketplaceFooter locale={locale} />
    </>
  );
}
