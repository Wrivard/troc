import { useEffect, useState, type FormEvent } from "react";
import { Button } from "@workspace/troc-design-system/components/ui/button";
import { Input } from "@workspace/troc-design-system/components/ui/input";
import { usePreferences } from "@workspace/troc-design-system/hooks/use-preferences";
import { MarketplaceHeader, MarketplaceFooter } from "../brand/SiteChrome";
import { api } from "../../api";
import "./seller-platform.css";
type Application = {
  id: string;
  contact_name: string;
  status: string;
  province: string;
  profile: { displayName?: string; inventorySize?: number };
  review_note: string | null;
};
type Seller = {
  id: string;
  display_name: string;
  role: string;
  status: string;
};
type Member = { user_id: string; email: string; role: string };
type Dashboard = {
  account: {
    display_name: string;
    role: string;
    plan_id: string;
    level_id: string;
  };
  inventory: {
    active_listings: number;
    units: string;
    asking_value_cents: string;
  };
  sales: { completed_orders: number; merchandise_cents: string };
};
export function SellerPlatformApp({
  view = "dashboard",
}: {
  view?: "apply" | "dashboard" | "team" | "admin";
}) {
  const { locale, theme, setLocale, setTheme } = usePreferences(),
    fr = locale === "fr",
    t = (en: string, french: string) => (fr ? french : en);
  const [applications, setApplications] = useState<Application[]>([]),
    [sellers, setSellers] = useState<Seller[]>([]),
    [seller, setSeller] = useState(""),
    [dashboard, setDashboard] = useState<Dashboard | null>(null),
    [team, setTeam] = useState<Member[]>([]),
    [error, setError] = useState(""),
    [busy, setBusy] = useState(false),
    [loaded, setLoaded] = useState(false),
    [revision, setRevision] = useState(0);
  const money = (v: string) =>
    new Intl.NumberFormat(fr ? "fr-CA" : "en-CA", {
      style: "currency",
      currency: "CAD",
    }).format(Number(v) / 100);
  useEffect(() => {
    let cancelled = false;
    setLoaded(false);
    setError("");
    setApplications([]);
    setSellers([]);
    const load = async () => {
      try {
        if (view === "apply" || view === "admin") {
          const data = await api<Application[]>(
            view === "admin"
              ? "/admin/seller-applications"
              : "/seller/applications",
          );
          if (!cancelled) setApplications(data);
        } else {
          const data = await api<Seller[]>("/seller/platform/sellers");
          if (!cancelled) {
            setSellers(data);
            setSeller((current) =>
              data.some((s) => s.id === current)
                ? current
                : (data.find((s) => s.status === "active")?.id ?? ""),
            );
          }
        }
      } catch {
        if (!cancelled)
          setError(
            t(
              "Sign in with an authorized account, or try again later.",
              "Connectez-vous avec un compte autorisé ou réessayez plus tard.",
            ),
          );
      } finally {
        if (!cancelled) setLoaded(true);
      }
    };
    void load();
    return () => {
      cancelled = true;
    };
  }, [view, revision, locale]);
  useEffect(() => {
    let cancelled = false;
    setDashboard(null);
    setTeam([]);
    if (!seller || !["team", "dashboard"].includes(view)) return;
    void (async () => {
      try {
        const data = await api<Dashboard | Member[]>(
          `/seller/platform/${seller}/${view}`,
        );
        if (!cancelled) {
          if (view === "team") setTeam(data as Member[]);
          else setDashboard(data as Dashboard);
        }
      } catch {
        if (!cancelled)
          setError(
            t(
              "This seller workspace is unavailable for your role.",
              "Cet espace vendeur est inaccessible pour votre rôle.",
            ),
          );
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [seller, view, revision, locale]);
  async function save(path: string, body: unknown) {
    setBusy(true);
    setError("");
    try {
      await api(path, "POST", body);
      setRevision((v) => v + 1);
    } catch (e) {
      const code = e instanceof Error ? e.message : "";
      setError(
        code === "last_owner"
          ? t(
              "Keep at least one active owner.",
              "Conservez au moins un propriétaire actif.",
            )
          : code === "application_exists"
            ? t(
                "You already have a pending or approved application.",
                "Vous avez déjà une demande en attente ou approuvée.",
              )
            : t(
                "The change could not be saved. Check your access and details.",
                "Impossible d’enregistrer. Vérifiez votre accès et les renseignements.",
              ),
      );
    } finally {
      setBusy(false);
    }
  }
  function submit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const f = new FormData(e.currentTarget),
      list = (key: string) =>
        String(f.get(key) || "")
          .split(",")
          .map((x) => x.trim())
          .filter(Boolean);
    void save("/seller/applications", {
      contactName: f.get("contactName"),
      displayName: f.get("displayName"),
      country: "CA",
      province: f.get("province"),
      sellerType: f.get("sellerType"),
      adultConfirmed: f.get("adult") === "on",
      inventorySize: Number(f.get("inventorySize")),
      games: list("games"),
      channels: list("channels"),
      platforms: list("platforms"),
      salesRange: f.get("salesRange"),
      taxRegistered: f.get("tax") === "on",
    });
  }
  return (
    <>
      <MarketplaceHeader
        locale={locale}
        theme={theme}
        onLocale={setLocale}
        onTheme={setTheme}
      />
      <main id="main-content" className="seller-platform">
        <p>
          {t(
            "In development · Seller platform",
            "En développement · Espace vendeur",
          )}
        </p>
        <h1>
          {view === "apply"
            ? t("Apply to sell", "Devenir vendeur")
            : view === "admin"
              ? t("Review seller applications", "Examiner les demandes")
              : view === "team"
                ? t("Seller team", "Équipe vendeur")
                : t("Seller dashboard", "Tableau de bord vendeur")}
        </h1>
        <nav aria-label={t("Seller navigation", "Navigation vendeur")}>
          <a href="/seller/apply">{t("Application", "Demande")}</a>
          <a href="/seller/dashboard">{t("Dashboard", "Tableau de bord")}</a>
          <a href="/seller/team">{t("Team", "Équipe")}</a>
          <a href="/seller/inventory">{t("Inventory", "Inventaire")}</a>
        </nav>
        {error && <p role="alert">{error}</p>}
        {!loaded && <p role="status">{t("Loading…", "Chargement…")}</p>}
        {view === "apply" && loaded && !error && (
          <>
            <p>
              {t(
                "Manual review. Approval does not verify identity or connect payouts. No founding reward is granted.",
                "Examen manuel. L’approbation ne vérifie pas l’identité et ne connecte pas les versements. Aucune récompense de fondateur n’est accordée.",
              )}
            </p>
            {applications.map((a) => (
              <p key={a.id}>
                {a.profile.displayName || a.contact_name} —{" "}
                {status(a.status, fr)}
                {a.review_note && <>: {a.review_note}</>}
              </p>
            ))}
            {!applications.some((a) =>
              ["submitted", "approved"].includes(a.status),
            ) && (
              <form onSubmit={submit}>
                <label>
                  {t("Contact name", "Nom du contact")}
                  <Input name="contactName" required maxLength={120} />
                </label>
                <label>
                  {t("Store / display name", "Nom de boutique / public")}
                  <Input name="displayName" required maxLength={120} />
                </label>
                <label>
                  Province
                  <select name="province">
                    {"AB BC MB NB NL NS NT NU ON PE QC SK YT"
                      .split(" ")
                      .map((p) => (
                        <option key={p}>{p}</option>
                      ))}
                  </select>
                </label>
                <label>
                  {t("Seller type requested", "Type de vendeur demandé")}
                  <select name="sellerType">
                    {[
                      "individual",
                      "professional",
                      "verified_online",
                      "verified_hobby_shop",
                    ].map((r, i) => (
                      <option value={r} key={r}>
                        {
                          [
                            t("Individual", "Particulier"),
                            t("Professional", "Professionnel"),
                            t(
                              "Online seller (review required)",
                              "Vendeur en ligne (examen requis)",
                            ),
                            t(
                              "Hobby shop (review required)",
                              "Boutique (examen requis)",
                            ),
                          ][i]
                        }
                      </option>
                    ))}
                  </select>
                </label>
                <label>
                  {t(
                    "Approximate inventory units",
                    "Quantité approximative en inventaire",
                  )}
                  <Input
                    name="inventorySize"
                    type="number"
                    min={0}
                    max={100000000}
                    defaultValue={0}
                  />
                </label>
                {[
                  [
                    "games",
                    t(
                      "Games, comma separated",
                      "Jeux, séparés par des virgules",
                    ),
                  ],
                  [
                    "channels",
                    t(
                      "Store URLs, comma separated",
                      "URL de boutiques, séparées par des virgules",
                    ),
                  ],
                  [
                    "platforms",
                    t(
                      "Inventory tools, comma separated",
                      "Outils d’inventaire, séparés par des virgules",
                    ),
                  ],
                  [
                    "salesRange",
                    t(
                      "Sales range (optional)",
                      "Volume de ventes (facultatif)",
                    ),
                  ],
                ].map(([key, label]) => (
                  <label key={key}>
                    {label}
                    <Input
                      name={key}
                      maxLength={key === "salesRange" ? 120 : 2000}
                    />
                  </label>
                ))}
                <label>
                  <input name="tax" type="checkbox" />
                  {t(
                    "Registered for sales tax (no tax ID collected)",
                    "Inscrit aux taxes de vente (aucun numéro recueilli)",
                  )}
                </label>
                <label>
                  <input name="adult" type="checkbox" required />
                  {t(
                    "I am an adult residing in Canada",
                    "Je suis adulte et je réside au Canada",
                  )}
                </label>
                <Button disabled={busy} type="submit">
                  {t("Submit for review", "Soumettre pour examen")}
                </Button>
              </form>
            )}
          </>
        )}
        {view === "admin" && loaded && !error && (
          <>
            <p>
              {t(
                "Latest 50 applications. Each decision requires a review note visible to the applicant.",
                "Les 50 dernières demandes. Chaque décision exige une note visible au demandeur.",
              )}
            </p>
            {!applications.length && (
              <p>
                {t("No applications yet.", "Aucune demande pour le moment.")}
              </p>
            )}
            {applications.map((a) => (
              <section key={a.id}>
                <h2>{a.profile.displayName || a.contact_name}</h2>
                <p>
                  {a.contact_name} · {a.province} · {status(a.status, fr)}
                </p>
                {a.status === "submitted" && (
                  <form
                    onSubmit={(e) => {
                      e.preventDefault();
                      const f = new FormData(e.currentTarget);
                      void save(`/admin/seller-applications/${a.id}/review`, {
                        decision: f.get("decision"),
                        note: f.get("note"),
                        displayName: f.get("displayName"),
                      });
                    }}
                  >
                    <label>
                      {t("Approved display name", "Nom public approuvé")}
                      <Input
                        name="displayName"
                        defaultValue={a.profile.displayName || a.contact_name}
                        required
                        maxLength={120}
                      />
                    </label>
                    <label>
                      {t("Review note", "Note d’examen")}
                      <textarea name="note" required maxLength={2000} />
                    </label>
                    <label>
                      {t("Decision", "Décision")}
                      <select name="decision">
                        <option value="rejected">
                          {t("Reject", "Refuser")}
                        </option>
                        <option value="approved">
                          {t("Approve", "Approuver")}
                        </option>
                      </select>
                    </label>
                    <Button disabled={busy} type="submit">
                      {t("Save decision", "Enregistrer la décision")}
                    </Button>
                  </form>
                )}
              </section>
            ))}
          </>
        )}
        {["dashboard", "team"].includes(view) && loaded && !error && (
          <>
            <label>
              {t("Seller", "Vendeur")}
              <select
                value={seller}
                onChange={(e) => {
                  setError("");
                  setSeller(e.target.value);
                }}
              >
                <option value="">
                  {t("Select seller", "Choisir un vendeur")}
                </option>
                {sellers
                  .filter((s) => s.status === "active")
                  .map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.display_name}
                    </option>
                  ))}
              </select>
            </label>
            {!sellers.some((s) => s.status === "active") && (
              <p>
                {t(
                  "No active seller workspace. Apply or wait for manual approval.",
                  "Aucun espace vendeur actif. Soumettez une demande ou attendez l’approbation manuelle.",
                )}
              </p>
            )}
          </>
        )}
        {view === "dashboard" && dashboard && !error && (
          <>
            <h2>{dashboard.account.display_name}</h2>
            <dl>
              <dt>{t("Active listings", "Annonces actives")}</dt>
              <dd>{dashboard.inventory.active_listings}</dd>
              <dt>{t("Inventory stock units", "Unités en inventaire")}</dt>
              <dd>{dashboard.inventory.units}</dd>
              <dt>
                {t(
                  "Inventory asking value (CAD)",
                  "Valeur demandée de l’inventaire (CAD)",
                )}
              </dt>
              <dd>{money(dashboard.inventory.asking_value_cents)}</dd>
              <dt>
                {t(
                  "Eligible completed orders",
                  "Commandes terminées admissibles",
                )}
              </dt>
              <dd>{dashboard.sales.completed_orders}</dd>
              <dt>
                {t(
                  "Completed merchandise subtotal (CAD)",
                  "Sous-total des marchandises terminées (CAD)",
                )}
              </dt>
              <dd>{money(dashboard.sales.merchandise_cents)}</dd>
            </dl>
            <p>
              {t(
                "All time. Excludes demo, simulated and refunded orders. Asking value is not sales revenue.",
                "Depuis le début. Exclut les commandes de démonstration, simulées et remboursées. La valeur demandée n’est pas un revenu.",
              )}
            </p>
            {dashboard.sales.completed_orders === 0 && (
              <p>
                {t(
                  "No eligible real completed sales yet.",
                  "Aucune vente réelle terminée admissible pour le moment.",
                )}
              </p>
            )}
            <p>
              {t(
                "Views, conversion, demand and promotion analytics are not available.",
                "Les statistiques de vues, conversion, demande et promotions ne sont pas disponibles.",
              )}
            </p>
          </>
        )}
        {view === "team" && seller && !error && (
          <>
            <p>
              {t(
                "Only current owners can change membership. Add existing account IDs; no invitation email is sent.",
                "Seuls les propriétaires actuels peuvent gérer l’équipe. Ajoutez les identifiants de comptes existants; aucun courriel d’invitation n’est envoyé.",
              )}
            </p>
            {team.map((m) => (
              <p key={m.user_id}>
                {m.email} — {roleLabel(m.role, fr)} <code>{m.user_id}</code>
              </p>
            ))}
            <form
              onSubmit={(e) => {
                e.preventDefault();
                const f = new FormData(e.currentTarget);
                void save(`/seller/platform/${seller}/team`, {
                  userId: f.get("userId"),
                  role: f.get("role") || null,
                });
              }}
            >
              <label>
                {t("Existing account ID", "Identifiant de compte existant")}
                <Input name="userId" required />
              </label>
              <label>
                {t("Role", "Rôle")}
                <select name="role">
                  {[
                    "owner",
                    "manager",
                    "inventory",
                    "fulfillment",
                    "customer_service",
                  ].map((r) => (
                    <option key={r} value={r}>
                      {roleLabel(r, fr)}
                    </option>
                  ))}
                  <option value="">
                    {t("Remove access", "Retirer l’accès")}
                  </option>
                </select>
              </label>
              <Button disabled={busy} type="submit">
                {t("Save membership", "Enregistrer le membre")}
              </Button>
            </form>
          </>
        )}
      </main>
      <MarketplaceFooter locale={locale} />
    </>
  );
}
function status(s: string, fr: boolean) {
  return (
    (
      {
        submitted: fr ? "En attente" : "Submitted",
        approved: fr ? "Approuvée" : "Approved",
        rejected: fr ? "Refusée" : "Rejected",
        withdrawn: fr ? "Retirée" : "Withdrawn",
      } as Record<string, string>
    )[s] || s
  );
}
function roleLabel(s: string, fr: boolean) {
  return (
    (
      {
        owner: fr ? "Propriétaire" : "Owner",
        manager: fr ? "Gestionnaire" : "Manager",
        inventory: fr ? "Inventaire" : "Inventory",
        fulfillment: fr ? "Expédition" : "Fulfillment",
        customer_service: fr ? "Service client" : "Customer service",
      } as Record<string, string>
    )[s] || s
  );
}
