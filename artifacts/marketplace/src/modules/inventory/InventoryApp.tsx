import { InventoryExport } from "./InventoryExport";
import { SellerLoading } from "../seller-platform/SellerLoading";
import { useSellerWorkspace } from "../seller-platform/SellerShell";
import { InventoryTable } from "./InventoryTable";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@workspace/troc-design-system/components/ui/select";
import { useEffect, useState, type FormEvent } from "react";
import { Button } from "@workspace/troc-design-system/components/ui/button";
import { Input } from "@workspace/troc-design-system/components/ui/input";
import { usePreferences } from "@workspace/troc-design-system/hooks/use-preferences";
import { MarketplaceHeader, MarketplaceFooter } from "../brand/SiteChrome";
import { api } from "../../api";
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
  "storage_location",
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
  ["Storage location", "Emplacement de rangement"],
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
  >([]);
  const { seller, setSeller } = useSellerWorkspace();
  const [items, setItems] = useState<Listing[]>([]),
    [next, setNext] = useState<string | null>(null),
    [after, setAfter] = useState("");
  const [low, setLow] = useState(false);
  const [listState, setListState] = useState<"loading" | "ready" | "error">("loading");
  const [accessRevision, setAccessRevision] = useState(0);
  const [q, setQ] = useState(""),
    [status, setStatus] = useState(() => {
      const value = new URLSearchParams(location.search).get("status") || "";
      return ["active", "sold_out", "paused", "archived", "draft"].includes(value) ? value : "";
    }),
    [source, setSource] = useState(""),
    [sync, setSync] = useState("");
  const [sources, setSources] = useState<{ id: string; label: string }[]>([]),
    [selected, setSelected] = useState<string[]>([]);
  const [sourceState, setSourceState] = useState<"loading" | "ready" | "error">("loading");
  const [mappingState, setMappingState] = useState<"loading" | "ready" | "error">("loading");
  const [sourceRevision, setSourceRevision] = useState(0);
  const [mappingRevision, setMappingRevision] = useState(0);
  const [busy, setBusy] = useState(false),
    [notice, setNotice] = useState(""),
    [accessUnavailable, setAccessUnavailable] = useState(false),
    [loaded, setLoaded] = useState(false),
    [revision, setRevision] = useState(0);
  const [tab, setTab] = useState(() =>
      ["manual", "import"].includes(
        new URLSearchParams(location.search).get("tab") || "",
      )
        ? new URLSearchParams(location.search).get("tab")!
        : "inventory",
    ),
    [cards, setCards] = useState<Card[]>([]),
    [variant, setVariant] = useState("");
  useEffect(() => {
    const url = new URL(window.location.href);
    if (tab === "inventory") url.searchParams.delete("tab");
    else url.searchParams.set("tab", tab);
    if (status) url.searchParams.set("status", status);
    else url.searchParams.delete("status");
    window.history.replaceState(window.history.state, "", url);
  }, [tab, status]);
  const [cardState, setCardState] = useState<"idle" | "loading" | "ready" | "error">("idle");
  const [csv, setCsv] = useState(""),
    [mapping, setMapping] = useState<Record<string, string>>({}),
    [mappingName, setMappingName] = useState(""),
    [mappings, setMappings] = useState<
      { name: string; mapping: Record<string, string> }[]
    >([]),
    [importSource, setImportSource] = useState("csv");
  const [pendingPreview, setPendingPreview] = useState<string | null>(null);
  const [review, setReview] = useState<Review | null>(null),
    [reviewPage, setReviewPage] = useState(0),
    [requestKey, setRequestKey] = useState(() => crypto.randomUUID());
  const [summary, setSummary] = useState<Record<string, number> | null>(null);
  useEffect(() => {
    if (!seller) return;
    let active = true;
    setSummary(null);
    api<Record<string, number>>("/inventory/" + seller + "/summary")
      .then((v) => {
        if (active) setSummary(v);
      })
      .catch(() => {});
    return () => {
      active = false;
    };
  }, [seller, revision]);
  useEffect(() => {
    setAfter("");
    setCards([]);
    setCardState("idle");
    setVariant("");
    setRequestKey(crypto.randomUUID());
  }, [seller]);
  const exportFilters = new URLSearchParams({q,source,status,sync,low: String(low)}).toString();
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
    setLoaded(false);
    setAccessUnavailable(false);
    api<typeof sellers>("/inventory/sellers")
      .then((r) => {
        if (active) {
          setSellers(r);
          setSeller((current) =>
            r.some((s) => s.id === current) ? current : (r[0]?.id ?? ""),
          );
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
  }, [accessRevision]);
  useEffect(() => {
    setReview(null);
    setPendingPreview(null);
    setCsv("");
    setMapping({});
    setMappingName("");
    setImportSource("csv");
  }, [seller]);
  useEffect(() => {
    let active = true;
    setSources([]);
    setSourceState("loading");
    if (seller) void api<typeof sources>(base + "/sources").then((value) => {
      if (active) { setSources(value); setSourceState("ready"); }
    }).catch(() => { if (active) setSourceState("error"); });
    return () => { active = false; };
  }, [seller, sourceRevision]);
  useEffect(() => {
    let active = true;
    if (!seller || tab !== "import") return;
    setMappings([]);
    setMappingState("loading");
    if (seller) void api<typeof mappings>(base + "/mappings").then((value) => {
      if (active) { setMappings(value); setMappingState("ready"); }
    }).catch(() => { if (active) setMappingState("error"); });
    return () => { active = false; };
  }, [seller, mappingRevision, tab]);
  useEffect(() => {
    if (!seller || tab !== "inventory") return;
    let active = true;
    setListState("loading");
    setItems([]);
    setNext(null);
    setSelected([]);
    const params = new URLSearchParams({
      q,
      status,
      source,
      sync,
      after,
      low: String(low),
    });
    api<{ rows: Listing[]; next: string | null }>(base + "/listings?" + params)
      .then((r) => {
        if (active) {
          setListState("ready");
          setItems(r.rows);
          setNext(r.next);
          setSelected([]);
        }
      })
      .catch(() => {
        if (active) setListState("error");
      });
    return () => {
      active = false;
    };
  }, [seller, q, status, source, sync, after, revision, low, tab]);
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
        storageLocation: f.get("storageLocation"),
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
    setBusy(true);
    setNotice("");
    try {
      await api(base + "/bulk", "POST", { changes });
      setRevision((r) => r + 1);
      setNotice(t("Inventory saved.", "Inventaire enregistré."));
      return true;
    } catch (e) {
      report(e);
      return false;
    } finally {
      setBusy(false);
    }
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
        <header className="seller-page-heading">
          <div>
            <h1>{t("Inventory", "Inventaire")}</h1>
            <p>
              {t(
                "Manage listings, pricing, quantity and status across your store.",
                "Gérez les annonces, les prix, les quantités et les statuts de votre boutique.",
              )}
            </p>
          </div>
          <div className="seller-page-actions">
            <Button variant="outline" onClick={() => setTab("import")}>
              {t("Import CSV", "Importer un CSV")}
            </Button>
            <Button onClick={() => setTab("manual")}>
              {t("Add listings", "Ajouter des annonces")}
            </Button>
          </div>
        </header>
        {notice && <p role="status">{notice}</p>}
        {!loaded && <SellerLoading view="inventory" locale={locale} />}
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
              <Button variant="secondary" onClick={() => { setNotice(""); setAccessRevision(value => value + 1); }}>{t("Retry access", "Réessayer l’accès")}</Button>
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
              <div className="inventory-summary">
                {[
                  [
                    "active",
                    t("Active listings", "Annonces actives"),
                    t("Published listings", "Annonces publiées"),
                  ],
                  [
                    "review",
                    t("Needs review", "À vérifier"),
                    t(
                      "Sync errors or conflicts",
                      "Erreurs ou conflits de synchronisation",
                    ),
                  ],
                  [
                    "draft",
                    t("Drafts", "Brouillons"),
                    t("Not published", "Non publiées"),
                  ],
                  [
                    "low",
                    t("Low quantity", "Stock faible"),
                    t(
                      "1–3 cards · active listings",
                      "1–3 cartes · annonces actives",
                    ),
                  ],
                  [
                    "sold_out",
                    t("Sold out", "Épuisées"),
                    t("Sold-out listings", "Annonces épuisées"),
                  ],
                ].map(([key, label, help]) => (
                  <button
                    key={key}
                    type="button"
                    onClick={() => {
                      setTab("inventory");
                      setAfter("");
                      setQ("");
                      setSource("");
                      setLow(key === "low");
                      setSync(key === "review" ? "review" : "");
                      setStatus(
                        ["active", "draft", "sold_out"].includes(key)
                          ? key
                          : "",
                      );
                      setNotice("");
                    }}
                  >
                    <span>{label}</span>
                    <strong>{summary?.[key] ?? "—"}</strong>
                    <small>{help}</small>
                  </button>
                ))}
              </div>
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
                <section className="inventory-workbench">
                  <div className="inventory-primary">
                    {low && (
                      <Button variant="outline" onClick={() => setLow(false)}>
                        {t("Low stock filter ×", "Filtre stock faible ×")}
                      </Button>
                    )}
                    <div className="inventory-section-heading">
                      <h2>{t("Listings", "Annonces")}</h2>
                      <span>
                        {listState === "ready" ? <>{items.length} {t("on this page", "sur cette page")} · {selected.length} {t("selected", "sélectionnées")}</> : listState === "loading" ? t("Loading…", "Chargement…") : t("Listings unavailable", "Annonces indisponibles")}
                      </span>
                    </div>
                    <InventoryExport key={seller + ":" + exportFilters} seller={seller} filters={exportFilters} />
                    <div className="inventory-filters">
                      <label>
                        {t("Name, card number, SKU or location", "Nom, numéro, SKU ou emplacement")}
                        <Input
                          value={q}
                          placeholder={t(
                            "Search your inventory…",
                            "Rechercher dans l’inventaire…",
                          )}
                          onChange={(e) => {
                            setQ(e.target.value);
                            setAfter("");
                          }}
                        />
                      </label>
                      {[
                        [
                          t("Status", "Statut"),
                          status,
                          (v: string) => setStatus(v),
                          [
                            "active",
                            "sold_out",
                            "paused",
                            "archived",
                            "draft",
                          ].map((s) => [s, labels[s]]),
                        ],
                        [
                          t("Source", "Source"),
                          source,
                          (v: string) => setSource(v),
                          sources.map((s) => [s.id, s.label]),
                        ],
                        [
                          t("Sync status", "État de synchronisation"),
                          sync,
                          (v: string) => setSync(v),
                          [
                            "review",
                            "not_connected",
                            "pending",
                            "synced",
                            "error",
                            "conflict",
                          ].map((s) => [
                            s,
                            s === "review"
                              ? t("Needs review", "À vérifier")
                              : labels[s],
                          ]),
                        ],
                      ].map(([label, value, set, options]) => (
                        <label key={String(label)}>
                          {String(label)}
                          <Select
                            value={String(value) || "all"}
                            onValueChange={(v) => {
                              (set as (v: string) => void)(
                                v === "all" ? "" : v,
                              );
                              setAfter("");
                            }}
                          >
                            <SelectTrigger aria-label={String(label)}>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="all">
                                {t("All", "Tous")}
                              </SelectItem>
                              {(options as string[][]).map(([value, label]) => (
                                <SelectItem key={value} value={value}>
                                  {label}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </label>
                      ))}
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
                          disabled={busy || listState !== "ready" || !selected.length}
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
                    {listState === "loading" ? (
                      <SellerLoading view="inventory" locale={locale} rowsOnly />
                    ) : listState === "error" ? (
                      <div role="alert">
                        <p>{t("We couldn’t load these listings. Your filters are still here.", "Impossible de charger les annonces. Vos filtres sont conservés.")}</p>
                        <Button variant="secondary" onClick={() => setRevision(value => value + 1)}>{t("Retry listings", "Réessayer les annonces")}</Button>
                      </div>
                    ) : !items.length ? (
                      <p>
                        {t(
                          q || status || source || sync || low || after ? "No listings match these filters." : "No listings yet. Add a card or import a CSV to get started.",
                          q || status || source || sync || low || after ? "Aucune annonce ne correspond aux filtres." : "Aucune annonce pour le moment. Ajoutez une carte ou importez un CSV pour commencer.",
                        )}
                      </p>
                    ) : (
                      <InventoryTable
                        key={seller}
                        items={items}
                        selected={selected}
                        onSelection={setSelected}
                        onSave={update}
                        busy={busy}
                        labels={labels}
                        locale={locale}
                      />
                    )}
                    {listState === "ready" && next && (
                      <Button
                        variant="secondary"
                        onClick={() => setAfter(next)}
                      >
                        {t("Next 50", "50 suivantes")}
                      </Button>
                    )}
                  </div>
                  <aside className="inventory-tools">
                    <h3>{t("Inventory tools", "Outils d’inventaire")}</h3>
                    <button onClick={() => setTab("manual")}>
                      {t("Add a listing", "Ajouter une annonce")}
                      <small>
                        {t(
                          "Find a canonical card, then set your price and stock.",
                          "Trouvez une carte, puis définissez prix et quantité.",
                        )}
                      </small>
                    </button>
                    <button onClick={() => setTab("import")}>
                      {t("Import from CSV", "Importer un CSV")}
                      <small>
                        {t(
                          "Map, validate and review before publishing.",
                          "Associez, validez et vérifiez avant publication.",
                        )}
                      </small>
                    </button>
                    <button
                      onClick={() => {
                        setLow(false);
                        setQ("");
                        setStatus("");
                        setSync("");
                        setSource("");
                        setAfter("");
                        setSelected([]);
                      }}
                    >
                      {t("Reset filters", "Réinitialiser les filtres")}
                    </button>
                    <p>
                      {t(
                        "Your listing price is not a market-price estimate. External inventory tools are not connected.",
                        "Votre prix demandé n’est pas une estimation du marché. Les outils externes ne sont pas connectés.",
                      )}
                    </p>
                  </aside>
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
                      setCards([]);
                      setVariant("");
                      setCardState("loading");
                      void run(async () => {
                        try {
                          setCards(await api<Card[]>(base + "/catalog?q=" + encodeURIComponent(String(f.get("search")).trim())));
                          setCardState("ready");
                        } catch {
                          setCardState("error");
                        }
                      });
                    }}
                  >
                    <label>
                      {t("Card name", "Nom de carte")}
                      <Input name="search" required minLength={1} />
                    </label>
                    <Button type="submit" disabled={busy}>
                      {t("Search", "Rechercher")}
                    </Button>
                  </form>
                  <p role="status">
                    {cardState === "loading" ? t("Searching the catalogue…", "Recherche dans le catalogue…")
                      : cardState === "error" ? t("The catalogue could not load. Search again to retry; your listing details are preserved.", "Le catalogue n’a pas pu charger. Relancez la recherche; les détails de votre annonce sont conservés.")
                      : cardState === "ready" && cards.length === 0 ? t("No cards match this search. Try a different name or card number.", "Aucune carte ne correspond. Essayez un autre nom ou numéro de carte.") : ""}
                  </p>
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
                        disabled={busy || cardState !== "ready" || cards.length === 0}
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
                      {t("Storage location (optional)", "Emplacement de rangement (facultatif)")}
                      <Input name="storageLocation" maxLength={100} placeholder={t("e.g. Box A - Row 3", "Ex. Boîte A - Rangée 3")} />
                      <small>{t("Private to your store team.", "Visible seulement par votre équipe.")}</small>
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
                  <a
                    className="underline"
                    href={`/help?article=csv&lang=${locale}`}
                  >
                    {t(
                      "Read the CSV import guide",
                      "Lire le guide d’import CSV",
                    )}
                  </a>
                  <p id="csv-format-help">
                    {t(
                      "Use comma-separated columns and a decimal point for prices: 12.50, without a currency symbol. Keep SKU and card-number columns as text to preserve leading zeros.",
                      "Séparez les colonnes par des virgules et utilisez un point décimal pour les prix : 12.50, sans symbole monétaire. Gardez les colonnes SKU et numéro de carte au format texte pour conserver les zéros initiaux.",
                    )}
                  </p>
                  <label>
                    {t("CSV file", "Fichier CSV")}
                    <input
                      type="file"
                      disabled={busy}
                      accept=".csv,text/csv"
                      aria-describedby="csv-format-help"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (!file) return;
                        setCsv("");
                        setReview(null);
                        setPendingPreview(null);
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
                          setPendingPreview(null);
                          setRequestKey(crypto.randomUUID());
                        });
                      }}
                    />
                  </label>
                  {sourceState !== "ready" && (
                    <div role="status">
                      <p>{sourceState === "loading" ? t("Loading inventory sources…", "Chargement des sources…") : t("Inventory sources could not load. Your file and column choices are preserved. Retry before previewing.", "Les sources n’ont pas pu charger. Votre fichier et vos colonnes sont conservés. Réessayez avant l’aperçu.")}</p>
                      {sourceState === "error" && <Button variant="secondary" onClick={() => setSourceRevision((v) => v + 1)}>{t("Retry sources", "Réessayer les sources")}</Button>}
                    </div>
                  )}
                  {mappingState !== "ready" && (
                    <div role="status">
                      <p>{mappingState === "loading" ? t("Loading saved mappings…", "Chargement des correspondances…") : t("Saved mappings could not load. You can still map columns manually and preview your file.", "Les correspondances n’ont pas pu charger. Vous pouvez associer les colonnes manuellement et consulter l’aperçu.")}</p>
                      {mappingState === "error" && <Button variant="secondary" onClick={() => setMappingRevision((v) => v + 1)}>{t("Retry saved mappings", "Réessayer les correspondances")}</Button>}
                    </div>
                  )}
                  {csv && (
                    <>
                      <label>
                        {t("Saved mapping", "Correspondance enregistrée")}
                        <select
                          disabled={busy || mappingState !== "ready"}
                          defaultValue=""
                          onChange={(e) => {
                            const found = mappings.find(
                              (m) => m.name === e.target.value,
                            );
                            if (found) {
                              setMapping(found.mapping);
                              setReview(null);
                              setPendingPreview(null);
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
                                setPendingPreview(null);
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
                          disabled={busy || sourceState !== "ready"}
                          value={importSource}
                          onChange={(e) => {
                            setImportSource(e.target.value);
                            setReview(null);
                            setPendingPreview(null);
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
                        disabled={busy || !!pendingPreview || sourceState !== "ready" || !sources.some((s) => s.id === importSource)}
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
                            setPendingPreview(result.id);
                            await loadReview(result.id);
                            setPendingPreview(null);
                            setMappingRevision((v) => v + 1);
                          })
                        }
                      >
                        {t("Preview import", "Voir l’aperçu")}
                      </Button>
                    </>
                  )}
                  {pendingPreview && !busy && (
                    <div role="status">
                      <p>{t("Your preview was created, but its results could not load. Retry loading the results without uploading again.", "Votre aperçu a été créé, mais ses résultats n’ont pas pu charger. Réessayez de les charger sans importer à nouveau.")}</p>
                      <Button disabled={busy} variant="secondary" onClick={() => void run(async () => {
                        await loadReview(pendingPreview);
                        setPendingPreview(null);
                        setMappingRevision((v) => v + 1);
                      })}>{t("Retry preview results", "Réessayer les résultats")}</Button>
                    </div>
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
