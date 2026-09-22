import { useEffect, useState, type FormEvent } from "react";
import { Button } from "@workspace/troc-design-system/components/ui/button";
import { Input } from "@workspace/troc-design-system/components/ui/input";
import { usePreferences } from "@workspace/troc-design-system/hooks/use-preferences";
import { MarketplaceHeader, MarketplaceFooter } from "../brand/SiteChrome";
import { api } from "../../api";
import { formatCad } from "./money";
import "./seller-platform.css";
type Application = {
  id: string;
  contact_name: string;
  status: string;
  province: string;
  seller_type?: string;
  profile: {
    displayName?: string;
    inventorySize?: number;
    channels?: string[];
    games?: string[];
    platforms?: string[];
    salesRange?: string;
    taxRegistered?: boolean;
  };
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
    [loadError, setLoadError] = useState(false),
    [adminPage, setAdminPage] = useState(0),
    [sellerPage, setSellerPage] = useState(0),
    [teamPage, setTeamPage] = useState(0),
    [workspaceError, setWorkspaceError] = useState(false),
    [workspaceLoaded, setWorkspaceLoaded] = useState(false),
    [busy, setBusy] = useState(false),
    [loaded, setLoaded] = useState(false),
    [revision, setRevision] = useState(0);
  const money = (v: string) => formatCad(v, locale);
  function loadFailure(error: unknown) {
    const code = error instanceof Error ? error.message : "";
    if (code === "unauthorized")
      return t(
        "Sign in to access this workspace.",
        "Connectez-vous pour accéder à cet espace.",
      );
    if (code === "forbidden")
      return t(
        "Your account does not have permission to access this workspace.",
        "Votre compte n’a pas l’autorisation d’accéder à cet espace.",
      );
    return t(
      "This workspace is temporarily unavailable. Please try again.",
      "Cet espace est temporairement indisponible. Veuillez réessayer.",
    );
  }
  function pageControls(
    label: string,
    page: number,
    count: number,
    change: (page: number) => void,
  ) {
    if (page === 0 && count < 50) return null;
    return (
      <nav aria-label={label}>
        <Button
          variant="secondary"
          disabled={busy || page === 0}
          onClick={() => change(page - 1)}
        >
          {t("Previous page", "Page précédente")}
        </Button>
        <span>
          {t("Page", "Page")} {page + 1}
        </span>
        <Button
          variant="secondary"
          disabled={busy || count < 50 || page >= 10000}
          onClick={() => change(page + 1)}
        >
          {t("Next page", "Page suivante")}
        </Button>
      </nav>
    );
  }
  useEffect(() => {
    let cancelled = false;
    setLoaded(false);
    setError("");
    setLoadError(false);
    setApplications([]);
    setSellers([]);
    const load = async () => {
      try {
        if (view === "apply" || view === "admin") {
          const data = await api<Application[]>(
            view === "admin"
              ? `/admin/seller-applications?page=${adminPage}`
              : "/seller/applications",
          );
          if (!cancelled) setApplications(data);
        } else {
          const data = await api<Seller[]>(
            `/seller/platform/sellers?page=${sellerPage}`,
          );
          if (!cancelled) {
            setSellers(data);
            setSeller((current) =>
              data.some((s) => s.id === current)
                ? current
                : (data.find((s) => s.status === "active")?.id ?? ""),
            );
          }
        }
      } catch (error) {
        if (!cancelled) setLoadError(true);
        if (!cancelled) setError(loadFailure(error));
      } finally {
        if (!cancelled) setLoaded(true);
      }
    };
    void load();
    return () => {
      cancelled = true;
    };
  }, [view, revision, locale, adminPage, sellerPage]);
  useEffect(() => {
    let cancelled = false;
    setDashboard(null);
    setTeam([]);
    setWorkspaceError(false);
    setWorkspaceLoaded(false);
    if (!seller || !["team", "dashboard"].includes(view)) return;
    void (async () => {
      try {
        const data = await api<Dashboard | Member[]>(
          `/seller/platform/${seller}/${view}${view === "team" ? `?page=${teamPage}` : ""}`,
        );
        if (!cancelled) {
          if (view === "team") setTeam(data as Member[]);
          else setDashboard(data as Dashboard);
        }
      } catch (error) {
        if (!cancelled) setWorkspaceError(true);
        if (!cancelled) setError(loadFailure(error));
      } finally {
        if (!cancelled) setWorkspaceLoaded(true);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [seller, view, revision, locale, teamPage]);
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
          <a
            href="/seller/apply"
            aria-current={view === "apply" ? "page" : undefined}
          >
            {t("Application", "Demande")}
          </a>
          <a
            href="/seller/dashboard"
            aria-current={view === "dashboard" ? "page" : undefined}
          >
            {t("Dashboard", "Tableau de bord")}
          </a>
          <a
            href="/seller/team"
            aria-current={view === "team" ? "page" : undefined}
          >
            {t("Team", "Équipe")}
          </a>
          <a href="/seller/inventory">{t("Inventory", "Inventaire")}</a>
        </nav>
        {error && <p role="alert">{error}</p>}
        {!loaded && <p role="status">{t("Loading…", "Chargement…")}</p>}
        {view === "apply" && loaded && !loadError && (
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
        {view === "admin" && loaded && !loadError && (
          <>
            <p>
              {t(
                "Applications are shown 50 per page. Each decision requires a review note visible to the applicant.",
                "Les demandes sont affichées par pages de 50. Chaque décision exige une note visible au demandeur.",
              )}
            </p>
            {(adminPage > 0 || applications.length >= 50) && (
              <nav aria-label={t("Application pages", "Pages de demandes")}>
                <Button
                  variant="secondary"
                  disabled={busy || adminPage === 0}
                  onClick={() => setAdminPage((page) => page - 1)}
                >
                  {t("Previous page", "Page précédente")}
                </Button>
                <span>
                  {t("Page", "Page")} {adminPage + 1}
                </span>
                <Button
                  variant="secondary"
                  disabled={
                    busy || applications.length < 50 || adminPage >= 10000
                  }
                  onClick={() => setAdminPage((page) => page + 1)}
                >
                  {t("Next page", "Page suivante")}
                </Button>
              </nav>
            )}
            {!applications.length && (
              <p>
                {t(
                  "No applications on this page.",
                  "Aucune demande sur cette page.",
                )}
              </p>
            )}
            {applications.map((a) => (
              <section key={a.id}>
                <h2>{a.profile.displayName || a.contact_name}</h2>
                <p>
                  {a.contact_name} · {a.province} · {status(a.status, fr)}
                </p>
                <dl className="seller-application-details">
                  {[
                    [
                      t("Requested seller type", "Type de vendeur demandé"),
                      a.seller_type
                        ? (
                            {
                              individual: t("Individual", "Particulier"),
                              professional: t("Professional", "Professionnel"),
                              verified_online: t(
                                "Online seller (review required)",
                                "Vendeur en ligne (examen requis)",
                              ),
                              verified_hobby_shop: t(
                                "Hobby shop (review required)",
                                "Boutique (examen requis)",
                              ),
                            } as Record<string, string>
                          )[a.seller_type]
                        : undefined,
                    ],
                    [
                      t("Store URLs", "URL de boutiques"),
                      a.profile.channels?.join(", "),
                    ],
                    [t("Games", "Jeux"), a.profile.games?.join(", ")],
                    [
                      t("Inventory tools", "Outils d’inventaire"),
                      a.profile.platforms?.join(", "),
                    ],
                    [
                      t(
                        "Approximate inventory units",
                        "Quantité approximative en inventaire",
                      ),
                      a.profile.inventorySize?.toLocaleString(
                        fr ? "fr-CA" : "en-CA",
                      ),
                    ],
                    [
                      t("Sales range", "Volume de ventes"),
                      a.profile.salesRange,
                    ],
                    [
                      t(
                        "Sales-tax registration declared",
                        "Inscription aux taxes déclarée",
                      ),
                      a.profile.taxRegistered === undefined
                        ? undefined
                        : a.profile.taxRegistered
                          ? t("Yes", "Oui")
                          : t("No", "Non"),
                    ],
                  ].map(([label, value]) => (
                    <div key={label}>
                      <dt>{label}</dt>
                      <dd>{value || t("Not provided", "Non fourni")}</dd>
                    </div>
                  ))}
                </dl>
                {a.review_note && (
                  <dl className="seller-application-details">
                    <div>
                      <dt>{t("Review note", "Note d’examen")}</dt>
                      <dd>{a.review_note}</dd>
                    </div>
                  </dl>
                )}
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
                      <select name="decision" defaultValue="" required>
                        <option value="" disabled>
                          {t("Choose a decision", "Choisir une décision")}
                        </option>
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
        {["dashboard", "team"].includes(view) && loaded && !loadError && (
          <>
            {pageControls(
              t("Seller pages", "Pages de vendeurs"),
              sellerPage,
              sellers.length,
              (page) => {
                setSeller("");
                setTeamPage(0);
                setSellerPage(page);
              },
            )}
            <label>
              {t("Seller", "Vendeur")}
              <select
                value={seller}
                onChange={(e) => {
                  setError("");
                  setTeamPage(0);
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
                  "No active seller workspace on this page.",
                  "Aucun espace vendeur actif sur cette page.",
                )}
              </p>
            )}
          </>
        )}
        {seller && !workspaceLoaded && !loadError && (
          <p role="status">
            {t("Loading workspace…", "Chargement de l’espace…")}
          </p>
        )}
        {view === "dashboard" && dashboard && !loadError && !workspaceError && (
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
        {view === "team" &&
          seller &&
          !loadError &&
          !workspaceError &&
          workspaceLoaded && (
            <>
              <p>
                {t(
                  "Only current owners can change membership. Add existing account IDs; no invitation email is sent.",
                  "Seuls les propriétaires actuels peuvent gérer l’équipe. Ajoutez les identifiants de comptes existants; aucun courriel d’invitation n’est envoyé.",
                )}
              </p>
              {pageControls(
                t("Team pages", "Pages de l’équipe"),
                teamPage,
                team.length,
                setTeamPage,
              )}
              {!team.length && (
                <p>
                  {t(
                    "No members on this page.",
                    "Aucun membre sur cette page.",
                  )}
                </p>
              )}
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
                    role: f.get("role") === "remove" ? null : f.get("role"),
                  });
                }}
              >
                <label>
                  {t("Existing account ID", "Identifiant de compte existant")}
                  <Input
                    name="userId"
                    required
                    aria-describedby="seller-member-id-help"
                  />
                </label>
                <p id="seller-member-id-help">
                  {t(
                    "Ask the member to copy their TROC account ID from their Account page. Use this ID, not their email address. Email invitations are not available yet.",
                    "Demandez au membre de copier son identifiant de compte TROC depuis sa page Compte. Utilisez cet identifiant, et non son adresse courriel. Les invitations par courriel ne sont pas encore disponibles.",
                  )}
                </p>
                <label>
                  {t("Role", "Rôle")}
                  <select name="role" required defaultValue="">
                    <option value="" disabled>
                      {t(
                        "Choose a role or remove access",
                        "Choisir un rôle ou retirer l’accès",
                      )}
                    </option>
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
                    <option value="remove">
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
