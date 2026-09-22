import { useEffect, useState, type FormEvent } from "react";
import { Button } from "@workspace/troc-design-system/components/ui/button";
import { Input } from "@workspace/troc-design-system/components/ui/input";
import { EditorialIntro } from "@workspace/troc-design-system/components/ui/editorial";
import { usePreferences } from "@workspace/troc-design-system/hooks/use-preferences";
import { MarketplaceHeader, MarketplaceFooter } from "../brand/SiteChrome";
import { api } from "../../api";
import { catalogMessages, type CatalogMessage } from "../catalog/messages";
import "./inventory.css";

type Listing = {
  id: string;
  name_en: string;
  name_fr: string;
  language?: string | null;
  finish?: string | null;
  collector_number?: string | null;
  condition: string;
  quantity: number;
  unit_price_cents: number;
  inventory_version: number;
  status: string;
  source_platform: string;
  sync_status: string;
  sync_error: string | null;
  seller_sku: string;
};
type Card = {
  id: string;
  name_en: string;
  name_fr: string;
  set: string;
  number: string;
  language: string;
  finish: string;
};
type Review = {
  id: string;
  status: string;
  summary: Record<string, number>;
  rows: {
    row: number;
    status: string;
    reason: string;
    variantId: string | null;
    candidates: string[];
    input: { seller_sku: string; name: string };
    priceCents: number;
    quantity: number;
  }[];
  next: number | null;
};
const columns = [
  "variant_id",
  "provider",
  "external_catalog_id",
  "name",
  "set",
  "number",
  "language",
  "finish",
  "condition",
  "price",
  "quantity",
  "seller_sku",
  "external_sku",
  "external_listing_id",
];
const columnLabels = [
  ["TROC card ID", "Identifiant de carte TROC"],
  ["Catalog provider", "Fournisseur du catalogue"],
  ["External card ID", "Identifiant de carte externe"],
  ["Card name", "Nom de la carte"],
  ["Set code", "Code de série"],
  ["Card number", "Numéro de carte"],
  ["Language", "Langue"],
  ["Finish", "Finition"],
  ["Condition", "État"],
  ["Price (CAD)", "Prix (CAD)"],
  ["Quantity", "Quantité"],
  ["Seller SKU", "SKU vendeur"],
  ["External SKU", "SKU externe"],
  ["External listing ID", "Identifiant d’annonce externe"],
];
function headers(csv: string) {
  const out: string[] = [];
  let cell = "",
    quoted = false;
  for (let i = 0; i < csv.length; i++) {
    const c = csv[i];
    if (c === '"') {
      if (quoted && csv[i + 1] === '"') {
        cell += '"';
        i++;
      } else quoted = !quoted;
    } else if (c === "," && !quoted) {
      out.push(cell.trim());
      cell = "";
    } else if ((c === "\n" || c === "\r") && !quoted) break;
    else cell += c;
    if (cell.length > 500 || out.length > 49) throw new Error("invalid_csv");
  }
  out.push(cell.trim());
  if (quoted || out.some((h) => !h) || new Set(out).size !== out.length)
    throw new Error("invalid_csv");
  return out;
}
export function InventoryApp() {
  const { locale, theme, setLocale, setTheme } = usePreferences(),
    fr = locale === "fr",
    t = (en: string, frText: string) => (fr ? frText : en);
  const [sellers, setSellers] = useState<
      { id: string; display_name: string }[]
    >([]),
    [seller, setSeller] = useState("");
  const [items, setItems] = useState<Listing[]>([]),
    [next, setNext] = useState<string | null>(null),
    [after, setAfter] = useState("");
  const [q, setQ] = useState(""),
    [status, setStatus] = useState(""),
    [source, setSource] = useState(""),
    [sync, setSync] = useState("");
  const [sources, setSources] = useState<{ id: string; label: string }[]>([]),
    [selected, setSelected] = useState<string[]>([]);
  const [busy, setBusy] = useState(false),
    [notice, setNotice] = useState(""),
    [accessUnavailable, setAccessUnavailable] = useState(false),
    [loaded, setLoaded] = useState(false),
    [revision, setRevision] = useState(0);
  const [tab, setTab] = useState("inventory"),
    [cards, setCards] = useState<Card[]>([]),
    [variant, setVariant] = useState("");
  const [csv, setCsv] = useState(""),
    [mapping, setMapping] = useState<Record<string, string>>({}),
    [mappingName, setMappingName] = useState(""),
    [mappings, setMappings] = useState<
      { name: string; mapping: Record<string, string> }[]
    >([]),
    [importSource, setImportSource] = useState("csv");
  const [review, setReview] = useState<Review | null>(null),
    [reviewPage, setReviewPage] = useState(0),
    [requestKey, setRequestKey] = useState(() => crypto.randomUUID());
  const base = `/inventory/${seller}`;
  const errors: Record<string, [string, string]> = {
    unauthorized: [
      "Sign in to manage your inventory.",
      "Connectez-vous pour gérer votre inventaire.",
    ],
    forbidden: [
      "You do not have inventory access for this seller.",
      "Vous n’avez pas accès à cet inventaire.",
    ],
    service_unavailable: [
      "Inventory is unavailable. Please try again later.",
      "L’inventaire est indisponible. Réessayez plus tard.",
    ],
    inventory_changed: [
      "Stock changed. Refresh and review before saving again.",
      "Le stock a changé. Actualisez et vérifiez avant de réessayer.",
    ],
    inventory_reserved: [
      "A checkout is reserving these cards. Try again after it finishes.",
      "Un paiement réserve ces cartes. Réessayez lorsqu’il sera terminé.",
    ],
    mapping_required: [
      "Map the required columns and a card identifier.",
      "Associez les colonnes requises et un identifiant de carte.",
    ],
    import_needs_review: [
      "Correct every flagged row, then upload a new preview.",
      "Corrigez chaque ligne signalée, puis importez un nouvel aperçu.",
    ],
    inventory_changed_repreview: [
      "Inventory changed since this preview. Upload again to review duplicates.",
      "L’inventaire a changé. Importez à nouveau pour vérifier les doublons.",
    ],
    preview_expired: [
      "This preview expired. Upload the file again.",
      "Cet aperçu a expiré. Importez le fichier à nouveau.",
    ],
    listing_photos_required: [
      "This listing needs photos before activation.",
      "Cette annonce nécessite des photos avant son activation.",
    ],
    price_below_sale: [
      "The regular price cannot be below the current sale price.",
      "Le prix régulier ne peut pas être inférieur au prix promotionnel actuel.",
    ],
    rate_limited: [
      "Too many requests. Wait a moment and try again.",
      "Trop de demandes. Patientez un instant et réessayez.",
    ],
  };
  const report = (e: unknown) => {
    const code = e instanceof Error ? e.message : "";
    const pair = errors[code];
    setNotice(
      pair
        ? pair[fr ? 1 : 0]
        : t(
            "Check the file or values. Refresh inventory before retrying if the connection was interrupted.",
            "Vérifiez le fichier ou les valeurs. Actualisez l’inventaire avant de réessayer si la connexion a été interrompue.",
          ),
    );
  };
  async function run(work: () => Promise<void>) {
    setBusy(true);
    setNotice("");
    try {
      await work();
    } catch (e) {
      report(e);
    } finally {
      setBusy(false);
    }
  }
  useEffect(() => {
    let active = true;
    api<typeof sellers>("/inventory/sellers")
      .then((r) => {
        if (active) {
          setSellers(r);
          setSeller(r[0]?.id ?? "");
        }
      })
      .catch((e) => {
        if (active) {
          setAccessUnavailable(
            !(e instanceof Error) ||
              !["unauthorized", "forbidden"].includes(e.message),
          );
          report(e);
        }
      })
      .finally(() => {
        if (active) setLoaded(true);
      });
    return () => {
      active = false;
    };
  }, []);
  useEffect(() => {
    if (!seller) return;
    let active = true;
    setItems([]);
    setSelected([]);
    setReview(null);
    Promise.all([
      api<typeof sources>(base + "/sources"),
      api<typeof mappings>(base + "/mappings"),
    ])
      .then(([s, m]) => {
        if (active) {
          setSources(s);
          setMappings(m);
        }
      })
      .catch((e) => {
        if (active) report(e);
      });
    return () => {
      active = false;
    };
  }, [seller]);
  useEffect(() => {
    if (!seller) return;
    let active = true;
    const params = new URLSearchParams({ q, status, source, sync, after });
    api<{ rows: Listing[]; next: string | null }>(base + "/listings?" + params)
      .then((r) => {
        if (active) {
          setItems(r.rows);
          setNext(r.next);
          setSelected([]);
        }
      })
      .catch((e) => {
        if (active) report(e);
      });
    return () => {
      active = false;
    };
  }, [seller, q, status, source, sync, after, revision]);
  const labels: Record<string, string> = {
    matched: t("Matched", "Correspondances"),
    unmatched: t("Unmatched", "Sans correspondance"),
    ambiguous: t("Ambiguous", "Ambiguës"),
    invalid: t("Invalid", "Invalides"),
    duplicate: t("Duplicates", "Doublons"),
    total: t("Total", "Total"),
    active: t("Active", "Active"),
    sold_out: t("Sold out", "Épuisée"),
    paused: t("Paused", "En pause"),
    archived: t("Archived", "Archivée"),
    draft: t("Draft", "Brouillon"),
    not_connected: t("Not connected", "Non connecté"),
    pending: t("Pending", "En attente"),
    synced: t("Synced", "Synchronisé"),
    error: t("Error", "Erreur"),
    conflict: t("Conflict", "Conflit"),
  };
  const loadReview = async (id: string, page = 0) => {
    setReview(await api<Review>(base + `/imports/${id}?page=${page}`));
    setReviewPage(page);
  };
  async function manual(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const f = new FormData(e.currentTarget);
    await run(async () => {
      await api(base + "/listings", "POST", {
        variantId: variant,
        condition: f.get("condition"),
        priceCents: Math.round(Number(f.get("price")) * 100),
        quantity: Number(f.get("quantity")),
        sellerSku: f.get("sku"),
        requestKey,
      });
      setRequestKey(crypto.randomUUID());
      setRevision((r) => r + 1);
      setNotice(
        t(
          "Listing saved. Check its status in Inventory.",
          "Annonce enregistrée. Vérifiez son statut dans Inventaire.",
        ),
      );
    });
  }
  async function update(changes: unknown[]) {
    await run(async () => {
      await api(base + "/bulk", "POST", { changes });
      setRevision((r) => r + 1);
      setNotice(t("Inventory saved.", "Inventaire enregistré."));
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
      <main id="main-content" className="marketplace-main inventory-app">
        <EditorialIntro
          level={1}
          compact
          className="troc-page-opening"
          eyebrow={`TROC · ${t("Seller tools", "Outils vendeur")}`}
          title={t("Your inventory", "Votre inventaire")}
          description={t(
            "Bring your cards to TROC. Review every import before publishing.",
            "Ajoutez vos cartes à TROC. Vérifiez chaque importation avant de publier.",
          )}
        />
        {notice && <p role="status">{notice}</p>}
        {!loaded && <p role="status">{t("Loading…", "Chargement…")}</p>}
        {loaded && !sellers.length ? (
          accessUnavailable ? (
            <section>
              <h2>{t("Inventory unavailable", "Inventaire indisponible")}</h2>
              <p>
                {t(
                  "We could not load seller access. Please try again later.",
                  "Nous n’avons pas pu charger l’accès vendeur. Réessayez plus tard.",
                )}
              </p>
            </section>
          ) : (
            <section>
              <h2>{t("Seller access required", "Accès vendeur requis")}</h2>
              <p>
                {t(
                  "An active seller account with inventory permission is required.",
                  "Un compte vendeur actif avec la permission de gérer l’inventaire est requis.",
                )}
              </p>
              <a href={`${import.meta.env.BASE_URL}sign-in?lang=${locale}`}>
                {t("Sign in", "Se connecter")}
              </a>
            </section>
          )
        ) : (
          seller && (
            <>
              <label>
                {t("Seller", "Vendeur")}
                <select
                  value={seller}
                  disabled={busy}
                  onChange={(e) => {
                    setSeller(e.target.value);
                    setAfter("");
                    setCards([]);
                    setVariant("");
                    setRequestKey(crypto.randomUUID());
                  }}
                >
                  {sellers.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.display_name}
                    </option>
                  ))}
                </select>
              </label>
              <nav
                aria-label={t("Inventory tools", "Outils d’inventaire")}
                className="inventory-actions"
              >
                {[
                  ["inventory", t("Inventory", "Inventaire")],
                  ["manual", t("Add a listing", "Ajouter une annonce")],
                  ["import", t("Import CSV", "Importer un CSV")],
                ].map(([value, label]) => (
                  <Button
                    key={value}
                    variant={tab === value ? "primary" : "secondary"}
                    onClick={() => setTab(value)}
                  >
                    {label}
                  </Button>
                ))}
              </nav>
              {tab === "inventory" && (
                <section>
                  <h2>{t("Listings", "Annonces")}</h2>
                  <div className="inventory-filters">
                    <label>
                      {t("Search name or SKU", "Nom ou SKU")}
                      <Input
                        value={q}
                        onChange={(e) => {
                          setQ(e.target.value);
                          setAfter("");
                        }}
                      />
                    </label>
                    <label>
                      {t("Status", "Statut")}
                      <select
                        value={status}
                        onChange={(e) => {
                          setStatus(e.target.value);
                          setAfter("");
                        }}
                      >
                        <option value="">{t("All", "Tous")}</option>
                        {[
                          "active",
                          "sold_out",
                          "paused",
                          "archived",
                          "draft",
                        ].map((s) => (
                          <option key={s} value={s}>
                            {labels[s]}
                          </option>
                        ))}
                      </select>
                    </label>
                    <label>
                      {t("Source", "Source")}
                      <select
                        value={source}
                        onChange={(e) => {
                          setSource(e.target.value);
                          setAfter("");
                        }}
                      >
                        <option value="">{t("All", "Toutes")}</option>
                        {sources.map((s) => (
                          <option key={s.id} value={s.id}>
                            {s.label}
                          </option>
                        ))}
                      </select>
                    </label>
                    <label>
                      {t("Sync status", "État de synchronisation")}
                      <select
                        value={sync}
                        onChange={(e) => {
                          setSync(e.target.value);
                          setAfter("");
                        }}
                      >
                        <option value="">{t("All", "Tous")}</option>
                        {[
                          "not_connected",
                          "pending",
                          "synced",
                          "error",
                          "conflict",
                        ].map((s) => (
                          <option key={s} value={s}>
                            {labels[s]}
                          </option>
                        ))}
                      </select>
                    </label>
                  </div>
                  <div className="inventory-actions">
                    <Button
                      variant="secondary"
                      onClick={() => {
                        setAfter("");
                        setRevision((r) => r + 1);
                      }}
                    >
                      {t("Refresh", "Actualiser")}
                    </Button>
                    {["active", "paused", "archived"].map((state) => (
                      <Button
                        key={state}
                        variant="secondary"
                        disabled={busy || !selected.length}
                        onClick={() =>
                          void update(
                            items
                              .filter((i) => selected.includes(i.id))
                              .map((i) => ({
                                id: i.id,
                                version: i.inventory_version,
                                status: state,
                              })),
                          )
                        }
                      >
                        {t("Set selected: ", "Sélection : ") + labels[state]}
                      </Button>
                    ))}
                  </div>
                  {!items.length ? (
                    <p>
                      {t(
                        "No listings match these filters.",
                        "Aucune annonce ne correspond aux filtres.",
                      )}
                    </p>
                  ) : (
                    <ul className="inventory-list">
                      {items.map((item) => (
                        <li key={`${item.id}-${item.inventory_version}`}>
                          <form
                            onSubmit={(e) => {
                              e.preventDefault();
                              const f = new FormData(e.currentTarget);
                              void update([
                                {
                                  id: item.id,
                                  version: item.inventory_version,
                                  quantity: Number(f.get("quantity")),
                                  priceCents: Math.round(
                                    Number(f.get("price")) * 100,
                                  ),
                                },
                              ]);
                            }}
                          >
                            <label className="inventory-check">
                              <input
                                type="checkbox"
                                checked={selected.includes(item.id)}
                                onChange={(e) =>
                                  setSelected((v) =>
                                    e.target.checked
                                      ? [...v, item.id]
                                      : v.filter((id) => id !== item.id),
                                  )
                                }
                              />
                              <span>
                                <strong>
                                  {fr ? item.name_fr : item.name_en}
                                </strong>
                                {" · "}
                                {[
                                  item.language === "en"
                                    ? catalogMessages.english[fr ? 1 : 0]
                                    : item.language === "ja"
                                      ? catalogMessages.japanese[fr ? 1 : 0]
                                      : item.language,
                                  item.finish &&
                                  Object.hasOwn(catalogMessages, item.finish)
                                    ? catalogMessages[
                                        item.finish as CatalogMessage
                                      ][fr ? 1 : 0]
                                    : item.finish,
                                  item.collector_number
                                    ? `#${item.collector_number}`
                                    : null,
                                  item.condition,
                                  item.seller_sku,
                                ]
                                  .filter(Boolean)
                                  .join(" · ")}
                              </span>
                            </label>
                            <p>
                              {labels[item.status]} · {item.source_platform} ·{" "}
                              {labels[item.sync_status]}
                            </p>
                            {item.sync_error && (
                              <p>
                                {t(
                                  "Synchronization needs attention.",
                                  "La synchronisation nécessite une vérification.",
                                )}
                              </p>
                            )}
                            <div className="inventory-filters">
                              <label>
                                {t("Quantity", "Quantité")}
                                <Input
                                  name="quantity"
                                  type="number"
                                  min="0"
                                  max="1000000"
                                  step="1"
                                  defaultValue={item.quantity}
                                  required
                                />
                              </label>
                              <label>
                                {t("Price (CAD)", "Prix (CAD)")}
                                <Input
                                  name="price"
                                  type="number"
                                  min="0.01"
                                  max="1000000"
                                  step="0.01"
                                  defaultValue={(
                                    item.unit_price_cents / 100
                                  ).toFixed(2)}
                                  required
                                />
                              </label>
                              <Button disabled={busy} type="submit">
                                {t("Save", "Enregistrer")}
                              </Button>
                            </div>
                          </form>
                        </li>
                      ))}
                    </ul>
                  )}
                  {next && (
                    <Button variant="secondary" onClick={() => setAfter(next)}>
                      {t("Next 50", "50 suivantes")}
                    </Button>
                  )}
                </section>
              )}
              {tab === "manual" && (
                <section>
                  <h2>
                    {t(
                      "Select a canonical card",
                      "Sélectionnez une carte du catalogue",
                    )}
                  </h2>
                  <form
                    onSubmit={(e) => {
                      e.preventDefault();
                      const f = new FormData(e.currentTarget);
                      void run(async () => {
                        setCards(
                          await api<Card[]>(
                            base +
                              "/catalog?q=" +
                              encodeURIComponent(String(f.get("search"))),
                          ),
                        );
                        setVariant("");
                      });
                    }}
                  >
                    <label>
                      {t("Card name", "Nom de carte")}
                      <Input name="search" required minLength={2} />
                    </label>
                    <Button type="submit" disabled={busy}>
                      {t("Search", "Rechercher")}
                    </Button>
                  </form>
                  <form
                    onSubmit={manual}
                    onChange={() => setRequestKey(crypto.randomUUID())}
                  >
                    <label>
                      {t(
                        "Card / printing / finish",
                        "Carte / impression / finition",
                      )}
                      <select
                        required
                        value={variant}
                        onChange={(e) => {
                          setVariant(e.target.value);
                          setRequestKey(crypto.randomUUID());
                        }}
                      >
                        <option value="">
                          {t("Choose a card", "Choisir une carte")}
                        </option>
                        {cards.map((c) => (
                          <option key={c.id} value={c.id}>
                            {fr ? c.name_fr : c.name_en} · {c.set} · {c.number}{" "}
                            · {c.language} · {c.finish}
                          </option>
                        ))}
                      </select>
                    </label>
                    <p>
                      {t(
                        "Raw singles are supported. Graded and sealed items need their later listing workflows. Listings requiring photos stay in draft; photo upload is not available here yet.",
                        "Les cartes à l’unité non gradées sont prises en charge. Les produits gradés et scellés nécessitent leurs futurs parcours. Les annonces exigeant des photos restent en brouillon; l’ajout de photos n’est pas encore disponible ici.",
                      )}
                    </p>
                    <label>
                      {t("Condition", "État")}
                      <select name="condition">
                        {["NM", "LP", "MP", "HP", "DMG"].map((c) => (
                          <option key={c}>{c}</option>
                        ))}
                      </select>
                    </label>
                    <label>
                      {t("Your unique SKU", "Votre SKU unique")}
                      <Input name="sku" required maxLength={100} />
                    </label>
                    <label>
                      {t("Price (CAD)", "Prix (CAD)")}
                      <Input
                        name="price"
                        type="number"
                        min="0.01"
                        max="1000000"
                        step="0.01"
                        required
                      />
                    </label>
                    <label>
                      {t("Quantity", "Quantité")}
                      <Input
                        name="quantity"
                        type="number"
                        min="0"
                        max="1000000"
                        step="1"
                        required
                      />
                    </label>
                    <Button type="submit" disabled={busy || !variant}>
                      {t("Publish listing", "Publier l’annonce")}
                    </Button>
                  </form>
                </section>
              )}
              {tab === "import" && (
                <section>
                  <h2>{t("Import and review", "Importer et vérifier")}</h2>
                  <p>
                    {t(
                      "CSV imports create new raw-single listings. Existing SKUs are flagged as duplicates; stock is never silently overwritten. Listings requiring photos stay in draft. Maximum 20,000 rows and 4 MB. Prices are in CAD.",
                      "Les CSV créent des annonces de cartes à l’unité non gradées. Les SKU existants sont signalés comme doublons; le stock n’est jamais écrasé automatiquement. Les annonces exigeant des photos restent en brouillon. Maximum : 20 000 lignes et 4 Mo. Prix en CAD.",
                    )}
                  </p>
                  <p>
                    {t(
                      "Use a TROC card ID, an external catalog ID with its provider, or exact name, set code, card number, language and finish.",
                      "Utilisez un identifiant TROC, un identifiant externe et son fournisseur, ou le nom exact, code de série, numéro, langue et finition.",
                    )}
                  </p>
                  <label>
                    {t("CSV file", "Fichier CSV")}
                    <input
                      type="file"
                      disabled={busy}
                      accept=".csv,text/csv"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (!file) return;
                        setCsv("");
                        setReview(null);
                        void run(async () => {
                          if (file.size > 4194304)
                            throw new Error("invalid_csv");
                          const content = (await file.text()).replace(
                            /^\uFEFF/,
                            "",
                          );
                          const detected = headers(content);
                          setCsv(content);
                          setMapping(
                            Object.fromEntries(
                              detected.map((h) => [
                                h.toLowerCase().replace(/[ -]/g, "_"),
                                h,
                              ]),
                            ),
                          );
                          setReview(null);
                          setRequestKey(crypto.randomUUID());
                        });
                      }}
                    />
                  </label>
                  {csv && (
                    <>
                      <label>
                        {t("Saved mapping", "Correspondance enregistrée")}
                        <select
                          defaultValue=""
                          onChange={(e) => {
                            const found = mappings.find(
                              (m) => m.name === e.target.value,
                            );
                            if (found) {
                              setMapping(found.mapping);
                              setReview(null);
                              setRequestKey(crypto.randomUUID());
                            }
                          }}
                        >
                          <option value="">
                            {t("Detected columns", "Colonnes détectées")}
                          </option>
                          {mappings.map((m) => (
                            <option key={m.name}>{m.name}</option>
                          ))}
                        </select>
                      </label>
                      <div className="inventory-filters">
                        {columns.map((c, i) => (
                          <label key={c}>
                            {columnLabels[i][fr ? 1 : 0]}
                            <select
                              value={mapping[c] ?? ""}
                              onChange={(e) => {
                                setMapping((m) => ({
                                  ...m,
                                  [c]: e.target.value,
                                }));
                                setReview(null);
                                setRequestKey(crypto.randomUUID());
                              }}
                            >
                              <option value="">
                                {t("Not mapped", "Non associée")}
                              </option>
                              {headers(csv).map((h) => (
                                <option key={h}>{h}</option>
                              ))}
                            </select>
                          </label>
                        ))}
                      </div>
                      <label>
                        {t(
                          "Save mapping as (optional)",
                          "Nom de correspondance (facultatif)",
                        )}
                        <Input
                          value={mappingName}
                          maxLength={60}
                          onChange={(e) => setMappingName(e.target.value)}
                        />
                      </label>
                      <label>
                        {t("Inventory source", "Source de l’inventaire")}
                        <select
                          value={importSource}
                          onChange={(e) => {
                            setImportSource(e.target.value);
                            setReview(null);
                            setRequestKey(crypto.randomUUID());
                          }}
                        >
                          {sources.map((s) => (
                            <option key={s.id} value={s.id}>
                              {s.label}
                            </option>
                          ))}
                        </select>
                      </label>
                      <p>
                        {t(
                          "A source label does not connect an account or enable live synchronization.",
                          "Une étiquette de source ne connecte aucun compte et n’active pas la synchronisation.",
                        )}
                      </p>
                      <Button
                        disabled={busy}
                        onClick={() =>
                          void run(async () => {
                            const result = await api<{ id: string }>(
                              base + "/imports",
                              "POST",
                              {
                                csv,
                                mapping,
                                mappingName,
                                source: importSource,
                                requestKey,
                              },
                            );
                            await loadReview(result.id);
                            setMappings(
                              await api<typeof mappings>(base + "/mappings"),
                            );
                          })
                        }
                      >
                        {t("Preview import", "Voir l’aperçu")}
                      </Button>
                    </>
                  )}
                  {review && (
                    <div>
                      <h3>
                        {t("Review results", "Résultats de vérification")}
                      </h3>
                      <p>
                        {Object.entries(review.summary)
                          .map(([k, v]) => `${labels[k] ?? k}: ${v}`)
                          .join(" · ")}
                      </p>
                      <p>
                        {t(
                          "Correct flagged rows in your file and upload again. Ambiguous rows show candidate TROC IDs; choose the correct variant before publishing.",
                          "Corrigez les lignes signalées dans votre fichier et importez-le à nouveau. Les lignes ambiguës affichent les identifiants TROC possibles; choisissez la bonne variante avant de publier.",
                        )}
                      </p>
                      <ul className="inventory-list">
                        {review.rows.map((r) => (
                          <li key={r.row}>
                            {t("Row", "Ligne")} {r.row} · {r.input.seller_sku} ·{" "}
                            {labels[r.status]} ·{" "}
                            {(r.priceCents / 100).toFixed(2)} CAD · {r.quantity}
                            <br />
                            {r.variantId ?? r.candidates.join(", ")}
                            {r.status === "invalid" && (
                              <p>
                                {t(
                                  "Check required card fields, condition, SKU, quantity and price.",
                                  "Vérifiez les champs de carte, état, SKU, quantité et prix.",
                                )}
                              </p>
                            )}
                          </li>
                        ))}
                      </ul>
                      <div className="inventory-actions">
                        {reviewPage > 0 && (
                          <Button
                            variant="secondary"
                            onClick={() =>
                              void run(() =>
                                loadReview(review.id, reviewPage - 1),
                              )
                            }
                          >
                            {t("Previous", "Précédent")}
                          </Button>
                        )}
                        {review.next !== null && (
                          <Button
                            variant="secondary"
                            onClick={() =>
                              void run(() =>
                                loadReview(review.id, review.next!),
                              )
                            }
                          >
                            {t("Next", "Suivant")}
                          </Button>
                        )}
                        <Button
                          disabled={
                            busy ||
                            review.status === "published" ||
                            review.summary.matched !== review.summary.total
                          }
                          onClick={() =>
                            void run(async () => {
                              await api(
                                base + `/imports/${review.id}/publish`,
                                "POST",
                                {},
                              );
                              await loadReview(review.id, reviewPage);
                              setRevision((r) => r + 1);
                              setNotice(
                                t(
                                  "Import saved. Check listing statuses in Inventory.",
                                  "Importation enregistrée. Vérifiez les statuts dans Inventaire.",
                                ),
                              );
                            })
                          }
                        >
                          {review.status === "published"
                            ? t("Published", "Publié")
                            : t(
                                "Publish all reviewed rows",
                                "Publier toutes les lignes vérifiées",
                              )}
                        </Button>
                      </div>
                    </div>
                  )}
                </section>
              )}
            </>
          )
        )}
      </main>
      <MarketplaceFooter locale={locale} />
    </>
  );
}
