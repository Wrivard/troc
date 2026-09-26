import { PromotionPublicationPanel } from "./PromotionPublicationPanel";
import { api } from "../../api";
import { useGrowthDialogFocus } from "./growth-dialog-focus";
import { useState, useEffect, useRef } from "react";
import { Button } from "@workspace/troc-design-system/components/ui/button";
import { Input } from "@workspace/troc-design-system/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogTitle,
} from "@workspace/troc-design-system/components/ui/dialog";
import {
  Tabs,
  TabsList,
  TabsTrigger,
  TabsContent,
} from "@workspace/troc-design-system/components/ui/tabs";
import { OperationsPage, useSellerCopy } from "./operations-ui";
import { useSellerWorkspace } from "./SellerShell";
import { useSession } from "../account/Workspace";
import "./seller-growth.css";
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
const valid = (d: unknown): d is Draft => {
  if (!d || typeof d !== "object") return false;
  const x = d as Draft;
  return (
    typeof x.id === "string" &&
    typeof x.name === "string" &&
    Number.isInteger(x.percent) &&
    x.percent >= 1 &&
    x.percent <= 90 &&
    Number.isInteger(x.minimum) &&
    x.minimum >= 1 &&
    x.minimum <= 10000 &&
    (x.minimumCents === undefined || (Number.isInteger(x.minimumCents) && x.minimumCents >= 0 && x.minimumCents <= 100000000)) &&
    typeof x.coupon === "string" &&
    typeof x.start === "string" &&
    typeof x.end === "string"
  );
};
const spendCents = (raw: string) => {
  if (!raw.trim()) return 0;
  const normalized=raw.trim().replace(",", ".");
  if (!/^\d{1,7}(?:\.\d{1,2})?$/.test(normalized)) throw new Error("invalid_spend");
  const [whole,fraction=""]=normalized.split(".");
  const cents=Number(whole)*100+Number(fraction.padEnd(2,"0"));
  if(cents>100000000)throw new Error("invalid_spend");
  return cents;
};
export function SellerPromotions() {
  const dialogFocus = useGrowthDialogFocus();
  const { t, money } = useSellerCopy(),
    { seller } = useSellerWorkspace(),
    { user } = useSession();
  const [keyLoaded, setKeyLoaded] = useState(""),
    [drafts, setDrafts] = useState<Draft[]>([]),
    [tab, setTab] = useState("sample"),
    [q, setQ] = useState(""),
    [editing, setEditing] = useState<Draft | null>(null),
    [notice, setNotice] = useState(""),
    [error, setError] = useState(""),
    [remove, setRemove] = useState<Draft | null>(null);
  const key =
    user && seller ? "troc.promotion-drafts.v1." + user.id + "." + seller : "";
  const [minimumSpend,setMinimumSpend]=useState("");
  useEffect(()=>{setMinimumSpend(editing?.minimumCents ? (editing.minimumCents/100).toFixed(2) : "");},[editing?.id]);
  const [conflict, setConflict] = useState(false);
  const [reviewLatest, setReviewLatest] = useState<Draft[] | null>(null);
  const [readRevision, setReadRevision] = useState(0);
  const [readState, setReadState] = useState("loading");
  const [version, setVersion] = useState(0),
    [canManage, setCanManage] = useState(false),
    [saving, setSaving] = useState(false),
    [legacy, setLegacy] = useState<Draft[]>([]);
  const scope = useRef(key);
  scope.current = key;
  const attempt = useRef<{ signature: string; key: string } | null>(null);
  useEffect(() => {
    let active = true;
    setConflict(false);
    setReviewLatest(null);
    setReadState("loading");
    setDrafts([]);
    setKeyLoaded("");
    setEditing(null);
    setNotice("");
    setError("");
    setCanManage(false);
    setLegacy([]);
    if (!key) return;
    api<{ drafts: Draft[]; version: number; canManage: boolean }>(
      "/seller/platform/" + seller + "/promotion-drafts",
    )
      .then((v) => {
        if (!active) return;
        setReadState("ready");
        setDrafts(v.drafts);
        setVersion(v.version);
        setCanManage(v.canManage);
        setKeyLoaded(key);
        setTab(v.drafts.length ? "drafts" : "sample");
        try {
          const raw = JSON.parse(localStorage.getItem(key) || "[]");
          if (Array.isArray(raw) && raw.every(valid))
            setLegacy(
              raw.filter((d) => !v.drafts.some((saved) => saved.id === d.id)),
            );
        } catch {
          /* Preserve unrecognized browser data. */
        }
      })
      .catch(() => {
        if (active) {
          setReadState("error");
          setError(
            t(
              "Promotion drafts could not load. Retry to retrieve your saved drafts.",
              "Impossible de charger les brouillons. Réessayez pour retrouver vos brouillons sauvegardés.",
            ),
          );
        }
      });
    return () => {
      active = false;
    };
  }, [key, seller, readRevision]);
  useEffect(() => {
    if (!saving) return;
    const stop = (e: Event) => e.preventDefault();
    window.addEventListener("troc:seller-change", stop);
    return () => window.removeEventListener("troc:seller-change", stop);
  }, [saving]);
  const save = async (next: Draft[]) => {
    if (!key || keyLoaded !== key || !canManage || saving || conflict) return false;
    setSaving(true);
    setError("");
    const signature = JSON.stringify({ version, drafts: next });
    if (attempt.current?.signature !== signature)
      attempt.current = { signature, key: crypto.randomUUID() };
    try {
      const saved = await api<{ drafts: Draft[]; version: number }>(
        "/seller/platform/" + seller + "/promotion-drafts",
        "POST",
        { key: attempt.current.key, version, drafts: next },
      );
      if (scope.current !== key) return false;
      setDrafts(saved.drafts);
      setVersion(saved.version);
      attempt.current = null;
      setReviewLatest(null);
      return true;
    } catch (e) {
      if (scope.current === key && e instanceof Error && e.message === "settings_changed") setConflict(true);
      if (scope.current === key)
        setError(
          e instanceof Error && e.message === "settings_changed"
            ? t(
                "Drafts changed in another session. Load the latest drafts to review before saving again. Your edits are kept.",
                "Les brouillons ont changé ailleurs. Chargez la version actuelle avant de confirmer. Vos modifications sont conservées.",
              )
            : t(
                "Drafts could not be saved. Check dates, duplicate coupons and the 100-draft limit, then retry. Your edits are kept.",
                "Impossible d’enregistrer. Vérifiez les dates, codes en double et la limite de 100 brouillons, puis réessayez. Vos modifications sont conservées.",
              ),
        );
      return false;
    } finally {
      if (scope.current === key) setSaving(false);
    }
  };
  async function loadConflict() {
    if (saving || !conflict) return;
    setSaving(true);
    try {
      const latest = await api<{drafts: Draft[]; version: number; canManage: boolean}>("/seller/platform/" + seller + "/promotion-drafts");
      if (scope.current !== key) return;
      setDrafts(latest.drafts);
      setVersion(latest.version);
      setCanManage(latest.canManage);
      setReviewLatest(latest.drafts);
      setLegacy(old => old.filter(d => !latest.drafts.some(remote => remote.id === d.id)));
      attempt.current = null;
      setConflict(false);
      setError("");
    } catch {
      if (scope.current === key) setError(t("Latest drafts could not load. Retry; your edits are kept.", "Lecture impossible. Réessayez; vos modifications sont conservées."));
    } finally { if (scope.current === key) setSaving(false); }
  }
  const selectedLatest = reviewLatest?.find(d => d.id === (editing?.id ?? remove?.id));
  const recovery = <>
    {conflict && <Button type="button" variant="secondary" disabled={saving} onClick={loadConflict}>{t("Load latest drafts", "Charger la version actuelle")}</Button>}
    {reviewLatest && <div role="status" className="growth-notice">
      <p>{t("Latest drafts loaded. Review and confirm your action again. Other drafts will be preserved.", "Version actuelle chargée. Vérifiez puis confirmez votre action. Les autres brouillons seront conservés.")}</p>
      {(editing || remove) && <p>{selectedLatest ? `${selectedLatest.name} · ${selectedLatest.percent}% · ${selectedLatest.minimum} ${t("cards", "cartes")} + ${money(selectedLatest.minimumCents ?? 0)} · ${selectedLatest.coupon || "—"} · ${selectedLatest.start} → ${selectedLatest.end}` : t("This draft is absent from the latest version. Saving creates it; deleting leaves it absent.", "Ce brouillon est absent de la version actuelle. Enregistrer le crée; supprimer le laisse absent.")}</p>}
    </div>}
  </>;
  const fresh = (kind = "percent") => {
    if (!key || keyLoaded !== key || !canManage || saving) return;
    setError("");
    setEditing({
      id: crypto.randomUUID(),
      name:
        kind === "bundle"
          ? t("Buy more, save more", "Achetez plus, économisez plus")
          : kind === "coupon"
            ? t("Collector welcome", "Bienvenue aux collectionneurs")
            : "",
      percent: kind === "bundle" ? 15 : 10,
      minimum: kind === "bundle" ? 3 : 1,
      coupon: kind === "coupon" ? "WELCOME10" : "",
      start: "",
      end: "",
    });
  };
  const sample: Draft[] = [
    {
      id: "s1",
      name: t("Collector weekend", "Week-end des collectionneurs"),
      percent: 10,
      minimum: 1,
      coupon: "WEEKEND10",
      start: "2026-09-25",
      end: "2026-09-27",
    },
    {
      id: "s2",
      name: t("Build your binder", "Remplissez votre cartable"),
      percent: 15,
      minimum: 3,
      coupon: "",
      start: "2026-09-01",
      end: "2026-09-30",
    },
    {
      id: "s3",
      name: t("Welcome to the store", "Bienvenue à la boutique"),
      percent: 5,
      minimum: 1,
      coupon: "WELCOME5",
      start: "2026-09-01",
      end: "2026-10-01",
    },
  ];
  const list = (
    tab === "sample" ? sample : keyLoaded === key ? drafts : []
  ).filter((d) =>
    [d.name, d.coupon].join(" ").toLowerCase().includes(q.toLowerCase()),
  );
  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editing) return;
    let minimumCents: number;
    try { minimumCents=spendCents(minimumSpend); } catch {setError(t("Enter a CAD minimum with at most two decimals, up to 1,000,000.", "Saisissez un minimum CAD avec deux décimales maximum, jusqu’à 1 000 000."));return;}
    const d = {
      ...editing,
      minimumCents,
      name: editing.name.trim(),
      coupon: editing.coupon.trim().toUpperCase(),
    };
    if (
      !valid(d) ||
      !d.name ||
      d.name.length > 80 ||
      !/^([A-Z0-9-]{3,24})?$/.test(d.coupon) ||
      !d.start ||
      !d.end ||
      d.end < d.start
    ) {
      setError(
        t(
          "Check the name, discount (1–90%), minimum quantity, coupon and date range.",
          "Vérifiez le nom, le rabais (1–90 %), la quantité minimale, le code et les dates.",
        ),
      );
      return;
    }
    if (
      drafts.some((x) => x.id !== d.id && d.coupon && x.coupon === d.coupon)
    ) {
      setError(
        t(
          "Another draft uses this coupon. Choose a unique code.",
          "Un autre brouillon utilise ce code. Choisissez un code unique.",
        ),
      );
      return;
    }
    if (await save([...drafts.filter((x) => x.id !== d.id), d])) {
      setEditing(null);
      setNotice(
        t(
          "Draft saved. Publication settings were not changed.",
          "Brouillon enregistré. La publication n’a pas changé.",
        ),
      );
      setError("");
      setTab("drafts");
      setQ("");
    }
  };
  return (
    <OperationsPage
      title={t("Promotions", "Promotions")}
      description={t(
        "Plan thoughtful offers that give collectors a reason to come back.",
        "Préparez des offres qui donnent envie aux collectionneurs de revenir.",
      )}
      actions={
        <Button
          disabled={!key || keyLoaded !== key || !canManage || saving || conflict}
          onClick={() => fresh()}
        >
          {t("+ Create promotion", "+ Créer une promotion")}
        </Button>
      }
    >
      {canManage && seller && <PromotionPublicationPanel key={seller} seller={seller} />}
      <div className="growth-notice">
        <div>
          <strong>
            {t("Your promotion planning space", "Votre espace de préparation")}
          </strong>
          <p>
            {t(
              "Drafts are saved to your store account. Saving does not publish. Use Review publication to explicitly publish a saved draft.",
              "Les brouillons sont enregistrés dans votre compte boutique. Enregistrer ne publie pas. Utilisez Vérifier la publication pour publier un brouillon sauvegardé.",
            )}
          </p>
        </div>
      </div>
      {!!legacy.length && canManage && (
        <div className="growth-notice">
          <p>
            {t(
              "Previous browser drafts are available to import. They are kept until you choose to save them to your store account.",
              "Des brouillons de ce navigateur peuvent être importés. Ils sont conservés jusqu’à leur enregistrement dans votre compte boutique.",
            )}
          </p>
          <Button
            disabled={saving}
            onClick={async () => {
              if (await save([...drafts, ...legacy.filter(d => !drafts.some(remote => remote.id === d.id))])) {
                setLegacy([]);
                setTab("drafts");
                setNotice(
                  t(
                    "Browser drafts imported.",
                    "Brouillons du navigateur importés.",
                  ),
                );
              }
            }}
          >
            {t("Import browser drafts", "Importer les brouillons")}
          </Button>
        </div>
      )}
      <div className="growth-metrics">
        {[
          [
            t("Your drafts", "Vos brouillons"),
            String(keyLoaded === key ? drafts.length : 0),
            t("Ready to refine", "À peaufiner"),
          ],
          [
            t("Published offers", "Offres publiées"),
            "—",
            t("See publication review", "Voir la publication"),
          ],
          [
            t("Attributed revenue", "Revenus attribués"),
            "—",
            t("No connected campaign data", "Aucune donnée de campagne"),
          ],
          [
            t("Redemptions", "Utilisations"),
            "—",
            t("Measured after launch", "Mesurées après le lancement"),
          ],
        ].map(([a, b, c]) => (
          <section className="growth-panel growth-metric" key={a}>
            <span>{a}</span>
            <strong>{b}</strong>
            <small>{c}</small>
          </section>
        ))}
      </div>
      <div className="growth-columns">
        <div className="growth-stack">
          <section className="growth-panel">
            <div className="growth-section-heading">
              <h2>{t("Your promotions", "Vos promotions")}</h2>
              <span>
                {list.length} {t("offers", "offres")}
              </span>
            </div>
            <Tabs value={tab} onValueChange={setTab}>
              <TabsList aria-label={t("Promotion view", "Vue des promotions")}>
                <TabsTrigger value="drafts">
                  {t("My drafts", "Mes brouillons")}
                </TabsTrigger>
                <TabsTrigger value="sample">
                  {t("Sample offers", "Exemples d’offres")}
                </TabsTrigger>
              </TabsList>
              <TabsContent value={tab}>
                <p className="growth-tab-note">
                  {tab === "sample"
                    ? t(
                        "Fictional examples. Use one as a starting point for your own draft.",
                        "Exemples fictifs. Utilisez-en un comme point de départ.",
                      )
                    : t(
                        "Review the saved offer, dates and minimum quantity before publication.",
                        "Vérifiez l’offre sauvegardée, les dates et la quantité minimale avant publication.",
                      )}
                </p>
                <Input
                  aria-label={t(
                    "Search promotions",
                    "Rechercher une promotion",
                  )}
                  placeholder={t(
                    "Search by name or coupon…",
                    "Rechercher un nom ou un code…",
                  )}
                  value={q}
                  onChange={(e) => setQ(e.target.value)}
                />
                <div
                  className="growth-table"
                  style={{ marginTop: 18 }}
                  tabIndex={0}
                  role="region"
                  aria-label={t("Promotions table", "Tableau des promotions")}
                >
                  <table>
                    <thead>
                      <tr>
                        {[
                          t("Offer", "Offre"),
                          t("Discount", "Rabais"),
                          t("Minimum", "Minimum"),
                          t("Dates", "Dates"),
                          t("Status", "Statut"),
                          t("Actions", "Actions"),
                        ].map((h) => (
                          <th key={h}>{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {list.map((d) => (
                        <tr key={d.id}>
                          <td>
                            <strong>{d.name}</strong>
                            <small>
                              {d.coupon || t("No coupon required", "Sans code")}
                            </small>
                          </td>
                          <td>
                            {d.percent}%
                            <small>
                              {t("Merchandise only", "Articles seulement")}
                            </small>
                          </td>
                          <td>
                            {d.minimum}{" "}
                            {d.minimum === 1
                              ? t("card", "carte")
                              : t("cards", "cartes")}
                          </td>
                          <td>
                            {d.start}
                            <small>→ {d.end}</small>
                          </td>
                          <td>
                            <span className="growth-badge">
                              {tab === "sample"
                                ? t("Example", "Exemple")
                                : t("Draft", "Brouillon")}
                            </span>
                          </td>
                          <td>
                            <Button
                              variant="ghost"
                              disabled={!canManage || saving}
                              onClick={() => {
                                setError("");
                                setEditing(
                                  tab === "sample"
                                    ? { ...d, id: crypto.randomUUID() }
                                    : d,
                                );
                              }}
                            >
                              {tab === "sample"
                                ? t("Use template", "Utiliser")
                                : t("Edit", "Modifier")}
                            </Button>
                            {tab === "drafts" && (
                              <Button
                                variant="ghost"
                                disabled={!canManage || saving}
                                aria-label={t("Delete ", "Supprimer ") + d.name}
                                onClick={() => setRemove(d)}
                              >
                                {t("Delete", "Supprimer")}
                              </Button>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                {!list.length && (
                  <div className="growth-empty">
                    <h3>
                      {q
                        ? t("No matching offers", "Aucune offre correspondante")
                        : t(
                            "Make your first offer feel worthwhile",
                            "Préparez une première offre intéressante",
                          )}
                    </h3>
                    <p>
                      {q
                        ? t(
                            "Try another name or coupon code.",
                            "Essayez un autre nom ou code.",
                          )
                        : t(
                            "Start with a small discount or reward collectors who buy several cards.",
                            "Commencez par un petit rabais ou récompensez l’achat de plusieurs cartes.",
                          )}
                    </p>
                    <Button
                      variant="secondary"
                      onClick={() => (q ? setQ("") : fresh())}
                    >
                      {q
                        ? t("Clear search", "Effacer la recherche")
                        : t("Create a draft", "Créer un brouillon")}
                    </Button>
                  </div>
                )}
              </TabsContent>
            </Tabs>
          </section>
          <section className="growth-panel">
            <h2>
              {t(
                "Build an offer that makes sense",
                "Une offre qui fait du sens",
              )}
            </h2>
            <div className="growth-form-pair">
              <div>
                <h3>{t("Protect your margin", "Protégez votre marge")}</h3>
                <p>
                  {t(
                    "Compare the discounted merchandise total with your card costs, fees and shipping before choosing a percentage.",
                    "Comparez le total réduit au coût des cartes, aux frais et à l’expédition avant de choisir un pourcentage.",
                  )}
                </p>
              </div>
              <div>
                <h3>
                  {t(
                    "Keep the conditions simple",
                    "Gardez les conditions simples",
                  )}
                </h3>
                <p>
                  {t(
                    "Use one clear coupon or minimum quantity. This planner does not stack offers or change shipping charges.",
                    "Utilisez un code clair ou une quantité minimale. Cet outil ne cumule pas les offres et ne modifie pas les frais d’expédition.",
                  )}
                </p>
              </div>
            </div>
          </section>
        </div>
        <aside
          className="growth-stack"
          aria-label={t("Tools and guidance", "Outils et conseils")}
        >
          <section className="growth-panel">
            <h2>{t("Promotion templates", "Modèles de promotion")}</h2>
            <p>
              {t(
                "A useful starting point, not a promise of results.",
                "Un point de départ utile, sans promesse de résultats.",
              )}
            </p>
            <div className="growth-tools">
              {[
                [
                  "coupon",
                  t("Create a coupon", "Créer un code"),
                  t(
                    "A memorable code for your collectors.",
                    "Un code facile à retenir.",
                  ),
                ],
                [
                  "bundle",
                  t("Buy more, save more", "Achetez plus, économisez plus"),
                  t(
                    "Reward a minimum number of cards.",
                    "Récompensez une quantité minimale.",
                  ),
                ],
                [
                  "percent",
                  t("Percentage discount", "Rabais en pourcentage"),
                  t(
                    "Plan a simple merchandise discount.",
                    "Préparez un rabais simple sur les articles.",
                  ),
                ],
              ].map(([id, title, sub]) => (
                <button
                  key={id}
                  disabled={!key || keyLoaded !== key || !canManage || saving || conflict}
                  onClick={() => fresh(id)}
                >
                  <strong>{title} →</strong>
                  <small>{sub}</small>
                </button>
              ))}
            </div>
          </section>
          <section className="growth-panel">
            <h2>{t("What comes next", "La suite")}</h2>
            <p>
              {t(
                "Live scheduling, eligible-listing selection, redemption limits and performance reporting need a campaign service before offers can be published.",
                "La planification réelle, la sélection des annonces, les limites d’utilisation et les rapports nécessitent un service de campagnes avant toute publication.",
              )}
            </p>
          </section>
        </aside>
      </div>
      <p className="growth-success" role="status">
        {notice}
      </p>
      {!editing && error && (
        <p role="alert" className="growth-danger">
          {error}
        </p>
      )}
      {!editing && !remove && recovery}
      {readState === "error" && (
        <Button variant="secondary" onClick={() => setReadRevision(v => v + 1)}>
          {t("Retry loading drafts", "Réessayer les brouillons")}
        </Button>
      )}
      {readState === "loading" && key && <p role="status">{t("Loading saved drafts...", "Chargement des brouillons...")}</p>}
      <Dialog
        open={!!editing}
        onOpenChange={(v) => {
          if (!v && !saving) setEditing(null);
        }}
      >
        <DialogContent
          {...dialogFocus}
          closeLabel={t("Close", "Fermer")}
          onPointerDownOutside={(event) => event.preventDefault()}
          aria-describedby="promotion-description"
        >
          <DialogTitle>
            {t("Promotion draft", "Brouillon de promotion")}
          </DialogTitle>
          <p id="promotion-description" className="growth-muted">
            {t(
              "Plan the terms. Saving does not publish or apply a discount.",
              "Préparez les conditions. L’enregistrement ne publie pas l’offre et n’applique aucun rabais.",
            )}
          </p>
          {recovery}
          {editing && (
            <form className="growth-form" onSubmit={submit}>
              <fieldset
                disabled={saving || !canManage || conflict}
                style={{ display: "contents" }}
              >
                <label className="growth-field">
                  {t("Promotion name", "Nom de la promotion")}
                  <Input
                    required
                    maxLength={80}
                    value={editing.name}
                    onChange={(e) =>
                      setEditing({ ...editing, name: e.target.value })
                    }
                  />
                </label>
                <div className="growth-form-pair">
                  <label className="growth-field">
                    {t("Discount (%)", "Rabais (%)")}
                    <Input
                      required
                      type="number"
                      min={1}
                      max={90}
                      step={1}
                      value={editing.percent || ""}
                      onChange={(e) =>
                        setEditing({
                          ...editing,
                          percent: Number(e.target.value),
                        })
                      }
                    />
                  </label>
                  <label className="growth-field">
                    {t("Minimum cards", "Minimum de cartes")}
                    <Input
                      required
                      type="number"
                      min={1}
                      max={10000}
                      step={1}
                      value={editing.minimum || ""}
                      onChange={(e) =>
                        setEditing({
                          ...editing,
                          minimum: Number(e.target.value),
                        })
                      }
                    />
                  </label>
                </div>
                <label className="growth-field">
                  {t(
                    "Coupon code (optional)",
                    "Code promotionnel (facultatif)",
                  )}
                  <Input
                    maxLength={24}
                    value={editing.coupon}
                    onChange={(e) =>
                      setEditing({
                        ...editing,
                        coupon: e.target.value.toUpperCase(),
                      })
                    }
                  />
                  <small>
                    {t(
                      "3–24 letters, numbers or hyphens. Leave blank for an automatic offer.",
                      "3–24 lettres, chiffres ou tirets. Laissez vide pour une offre automatique.",
                    )}
                  </small>
                </label>
                <div className="growth-form-pair">
                  <label className="growth-field">
                    {t("Planned start", "Début prévu")}
                    <Input
                      required
                      type="date"
                      value={editing.start}
                      onChange={(e) =>
                        setEditing({ ...editing, start: e.target.value })
                      }
                    />
                  </label>
                  <label className="growth-field">
                    {t("Planned end", "Fin prévue")}
                    <Input
                      required
                      type="date"
                      min={editing.start || undefined}
                      value={editing.end}
                      onChange={(e) =>
                        setEditing({ ...editing, end: e.target.value })
                      }
                    />
                  </label>
                </div>
                <label className="growth-field">
                  {t("Minimum spend (CAD, optional)", "Dépense minimale (CAD, facultatif)")}
                  <Input name="minimumSpend" inputMode="decimal" maxLength={10} value={minimumSpend} onChange={e=>setMinimumSpend(e.target.value)} />
                  <small>{t("Both minimum quantity and spend must be met. Merchandise before basket discounts, shipping and taxes; blank means no spend minimum.", "Quantité ET dépense minimales requises. Articles avant rabais panier, livraison et taxes; vide signifie sans minimum de dépense.")}</small>
                </label>
                <div className="growth-preview">
                  {t(
                    "Illustrative discount on $100 (not an eligibility quote)",
                    "Rabais illustré sur 100 $ (pas un calcul d’admissibilité)",
                  )}
                  <strong>
                    {money(10000 - Math.round((10000 * editing.percent) / 100))}
                  </strong>
                  {t(
                    "Before shipping and taxes. Both thresholds must be met; this illustration does not check eligibility.",
                    "Avant livraison et taxes. Les deux seuils sont requis; cette illustration ne vérifie pas l’admissibilité.",
                  )}
                </div>
                {error && (
                  <p role="alert" className="growth-danger">
                    {error}
                  </p>
                )}
                <div className="growth-dialog-footer">
                  <Button
                    type="button"
                    variant="secondary"
                    onClick={() => setEditing(null)}
                  >
                    {t("Cancel", "Annuler")}
                  </Button>
                  <Button type="submit">
                    {t("Save draft", "Enregistrer le brouillon")}
                  </Button>
                </div>
              </fieldset>
            </form>
          )}
        </DialogContent>
      </Dialog>
      <Dialog
        open={!!remove}
        onOpenChange={(v) => {
          if (!v && !saving) setRemove(null);
        }}
      >
        <DialogContent
          {...dialogFocus}
          closeLabel={t("Close", "Fermer")}
          aria-describedby="promotion-delete"
        >
          <DialogTitle>
            {t("Delete this draft?", "Supprimer ce brouillon ?")}
          </DialogTitle>
          <p id="promotion-delete">
            {remove?.name} —{" "}
            {t(
              "This removes the saved draft from your store account.",
              "Cela supprime le brouillon enregistré dans votre compte boutique.",
            )}
          </p>
          {recovery}
          {remove && error && (
            <p role="alert" className="growth-danger">
              {error}
            </p>
          )}
          <Button
            disabled={saving}
            variant="secondary"
            onClick={() => setRemove(null)}
          >
            {t("Keep draft", "Conserver")}
          </Button>
          <Button
            disabled={saving || !canManage || conflict}
            onClick={async () => {
              if (
                remove &&
                (await save(drafts.filter((d) => d.id !== remove.id)))
              ) {
                setRemove(null);
                setNotice(t("Draft deleted.", "Brouillon supprimé."));
              }
            }}
          >
            {t("Delete draft", "Supprimer")}
          </Button>
        </DialogContent>
      </Dialog>
    </OperationsPage>
  );
}
