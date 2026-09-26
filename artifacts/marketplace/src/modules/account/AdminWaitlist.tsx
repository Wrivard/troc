import { options } from "../prelaunch/copy";
import { useEffect, useRef, useState } from "react";
import { usePreferences } from "@workspace/troc-design-system/hooks/use-preferences";
import { Button } from "@workspace/troc-design-system/components/ui/button";
import { Input } from "@workspace/troc-design-system/components/ui/input";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@workspace/troc-design-system/components/ui/select";
import { MarketplaceHeader, MarketplaceFooter } from "../brand/SiteChrome";
type Profile = {
  email: string;
  user_id: string;
  status: string;
  created_at: string;
  intent: string;
  answers: Record<string, string>;
  selections: Record<string, string[]>;
  confirmations: Record<string, boolean>;
};
type Summary = {
  segments: { intent: string; people: number }[];
  regions: { province: string; people: number }[];
};
export function AdminWaitlist() {
  const { locale, theme, setLocale, setTheme } = usePreferences(),
    fr = locale === "fr";
  const [summary, setSummary] = useState<Summary | null>(null),
    [items, setItems] = useState<Profile[]>([]),
    [hasMore, setMore] = useState(false),
    [offset, setOffset] = useState(0),
    [filters, setFilters] = useState({
      q: "",
      intent: "all",
      status: "all",
      province: "all",
    }),
    [query, setQuery] = useState(""),
    [busy, setBusy] = useState(true),
    [error, setError] = useState(""),
    [revision, setRevision] = useState(0),
    [selected, setSelected] = useState<Profile | null>(null);
  const detail = useRef<HTMLElement>(null);
  useEffect(() => {
    const c = new AbortController();
    fetch("/api/onboarding/admin/summary", { signal: c.signal })
      .then((r) => {
        if (!r.ok) throw Error();
        return r.json();
      })
      .then(setSummary)
      .catch(() => {});
    return () => c.abort();
  }, [revision]);
  useEffect(() => {
    const c = new AbortController();
    setBusy(true);
    setError("");
    setSelected(null);
    fetch("/api/onboarding/admin/profiles?offset=" + offset + "&" + query, {
      signal: AbortSignal.any([c.signal, AbortSignal.timeout(10000)]),
    })
      .then(async (r) => {
        if (!r.ok) throw Error(r.status === 403 ? "forbidden" : "unavailable");
        return r.json();
      })
      .then((v) => {
        if (!c.signal.aborted) {
          setItems(v.items);
          setMore(v.hasMore);
        }
      })
      .catch((e) => {
        if (!c.signal.aborted) setError(e.message);
      })
      .finally(() => {
        if (!c.signal.aborted) setBusy(false);
      });
    return () => c.abort();
  }, [query, offset, revision]);
  useEffect(() => {
    if (selected) detail.current?.focus();
  }, [selected]);
  const intent = (v: string) =>
    ({
      buyer: fr ? "Acheteur" : "Buyer",
      seller: fr ? "Vendeur" : "Seller",
      both: fr ? "Les deux" : "Both",
    })[v] || v;
  const labels: Record<string, string> = fr
    ? {
        contact: "Nom",
        city: "Ville",
        province: "Province",
        contactLanguage: "Langue de contact",
        sellerType: "Type de vendeur",
        inventory: "Inventaire déclaré",
        initialListings: "Première mise en ligne envisagée",
        readiness: "Disponibilité",
        frequency: "Fréquence d’achat",
        budget: "Budget",
        storeName: "Nom de boutique",
        frustrations: "Difficultés actuelles",
        wishlist: "Attentes",
        games: "Jeux",
        software: "Outils",
        channels: "Canaux",
        features: "Fonctions recherchées",
        canada: "Résidence canadienne déclarée",
        adult: "Majorité déclarée",
        consent: "Consentement aux réponses",
        marketing: "Communications promotionnelles",
      }
    : {
        contact: "Name",
        city: "City",
        province: "Province",
        contactLanguage: "Contact language",
        sellerType: "Seller type",
        inventory: "Declared inventory",
        initialListings: "Hypothetical first listings",
        readiness: "Readiness",
        frequency: "Buying frequency",
        budget: "Budget",
        storeName: "Store name",
        frustrations: "Current difficulties",
        wishlist: "Requested features",
        games: "Games",
        software: "Tools",
        channels: "Channels",
        features: "Requested features",
        canada: "Self-reported Canadian residence",
        adult: "Self-reported adult",
        consent: "Answer consent",
        marketing: "Marketing updates",
      };
  const rawReadable = (v: string) =>
    v.replaceAll("_", " ").replace(/(\d) (\d)/g, "$1–$2");
  const readable = (v: string) =>
    Object.values(options)
      .flat()
      .find((row) => row[0] === v)?.[fr ? 2 : 1] || rawReadable(v);
  const select = (
    key: "intent" | "status" | "province",
    label: string,
    options: string[],
  ) => (
    <label>
      {label}
      <Select
        value={filters[key]}
        onValueChange={(v) => setFilters((f) => ({ ...f, [key]: v }))}
      >
        <SelectTrigger aria-label={label}>
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {options.map((v) => (
            <SelectItem key={v} value={v}>
              {v === "all"
                ? fr
                  ? "Tous"
                  : "All"
                : key === "intent"
                  ? intent(v)
                  : v === "waitlisted"
                    ? fr
                      ? "Inscrit"
                      : "Waitlisted"
                    : v === "withdrawn"
                      ? fr
                        ? "Retiré"
                        : "Withdrawn"
                      : v}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </label>
  );
  return (
    <div className="min-h-screen bg-background text-foreground">
      <MarketplaceHeader
        locale={locale}
        theme={theme}
        onLocale={setLocale}
        onTheme={setTheme}
      />
      <main id="main-content" className="workspace-page">
        <div className="workspace-heading">
          <p className="workspace-eyebrow">ADMINISTRATION</p>
          <h1>
            {fr
              ? "La communauté qui prépare TROC"
              : "The community shaping TROC"}
          </h1>
          <p>
            {fr
              ? "Inscriptions finalisées, liées à un compte. Les réponses décrivent des intentions, pas des ventes réalisées."
              : "Completed registrations linked to accounts. Answers describe intentions, not completed sales."}
          </p>
        </div>
        {summary ? (
          <div className="workspace-metrics">
            {["buyer", "seller", "both"].map((k) => (
              <div key={k}>
                <strong>
                  {summary.segments.find((v) => v.intent === k)?.people ?? 0}
                </strong>
                <span>{intent(k)}</span>
              </div>
            ))}
          </div>
        ) : (
          <p>
            {fr
              ? "Résumé indisponible pour le moment."
              : "Summary currently unavailable."}
          </p>
        )}
        <p className="workspace-note">
          {fr
            ? "Totaux de toutes les inscriptions actives, sans les retraits. Dans cet environnement local, les comptes et les chiffres sont des tests. Les volumes de cartes sont déclaratifs et hypothétiques."
            : "Totals cover all active registrations, excluding withdrawals. Accounts and figures in this local environment are test data. Card volumes are self-reported and hypothetical."}
        </p>
        <section className="workspace-panel">
          <h2>{fr ? "Inscriptions" : "Registrations"}</h2>
          <form
            className="workspace-filters"
            onSubmit={(e) => {
              e.preventDefault();
              setOffset(0);
              setQuery(new URLSearchParams(filters).toString());
            }}
          >
            <label>
              {fr ? "Nom, ville ou courriel" : "Name, city or email"}
              <Input
                value={filters.q}
                maxLength={100}
                onChange={(e) => setFilters({ ...filters, q: e.target.value })}
              />
            </label>
            {select("intent", fr ? "Intérêt" : "Interest", [
              "all",
              "buyer",
              "seller",
              "both",
            ])}
            {select("status", fr ? "Statut" : "Status", [
              "all",
              "waitlisted",
              "withdrawn",
            ])}
            {select("province", "Province", [
              "all",
              "AB",
              "BC",
              "MB",
              "NB",
              "NL",
              "NS",
              "NT",
              "NU",
              "ON",
              "PE",
              "QC",
              "SK",
              "YT",
            ])}
            <Button type="submit" disabled={busy}>
              {fr ? "Appliquer" : "Apply"}
            </Button>
            <Button
              type="button"
              variant="ghost"
              onClick={() => {
                setFilters({
                  q: "",
                  intent: "all",
                  status: "all",
                  province: "all",
                });
                setQuery("");
                setOffset(0);
              }}
            >
              {fr ? "Réinitialiser" : "Reset"}
            </Button>
          </form>
          {busy ? (
            <p role="status">
              {fr ? "Chargement des inscriptions…" : "Loading registrations…"}
            </p>
          ) : error ? (
            <div role="alert">
              <p>
                {error === "forbidden"
                  ? fr
                    ? "Accès réservé aux administrateurs."
                    : "Administrator access required."
                  : fr
                    ? "Les inscriptions sont indisponibles."
                    : "Registrations are unavailable."}
              </p>
              <Button onClick={() => setRevision((v) => v + 1)}>
                {fr ? "Réessayer" : "Retry"}
              </Button>
            </div>
          ) : items.length === 0 ? (
            <p>
              {fr
                ? "Aucune inscription ne correspond à ces filtres."
                : "No registrations match these filters."}
            </p>
          ) : (
            <div className="workspace-table-wrap">
              <table className="workspace-table">
                <thead>
                  <tr>
                    {[
                      fr ? "Personne" : "Person",
                      fr ? "Intérêt" : "Interest",
                      "Province",
                      fr ? "Statut" : "Status",
                      fr ? "Inscription" : "Registered",
                      fr ? "Réponses" : "Answers",
                    ].map((h) => (
                      <th key={h} scope="col">
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {items.map((p) => (
                    <tr key={p.user_id}>
                      <td>
                        {p.answers.contact || p.user_id.slice(0, 8)}
                        <br />
                        <small>{p.email}</small>
                      </td>
                      <td>{intent(p.intent)}</td>
                      <td>{p.answers.province || "—"}</td>
                      <td>
                        {p.status === "withdrawn"
                          ? fr
                            ? "Retiré"
                            : "Withdrawn"
                          : fr
                            ? "Inscrit"
                            : "Waitlisted"}
                      </td>
                      <td>
                        {new Date(p.created_at).toLocaleDateString(
                          fr ? "fr-CA" : "en-CA",
                        )}
                      </td>
                      <td>
                        <button onClick={() => setSelected(p)}>
                          {fr ? "Consulter" : "View"}
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
          {!busy && !error && (offset > 0 || hasMore) && (
            <div className="workspace-pagination">
              <Button
                disabled={!offset}
                onClick={() => setOffset((v) => Math.max(0, v - 50))}
              >
                {fr ? "Précédent" : "Previous"}
              </Button>
              <span>
                {fr ? "Page" : "Page"} {offset / 50 + 1}
              </span>
              <Button
                disabled={!hasMore}
                onClick={() => setOffset((v) => v + 50)}
              >
                {fr ? "Suivant" : "Next"}
              </Button>
            </div>
          )}
        </section>
        {selected && (
          <section
            ref={detail}
            tabIndex={-1}
            className="workspace-panel"
            aria-labelledby="waitlist-detail"
          >
            <div className="workspace-actions">
              <h2 id="waitlist-detail">
                {selected.answers.contact || selected.user_id}
              </h2>
              <Button variant="ghost" onClick={() => setSelected(null)}>
                {fr ? "Fermer" : "Close"}
              </Button>
            </div>
            <p>
              {fr
                ? "Réponses déclarées. Les coordonnées postales complètes ne sont pas exposées dans cette vue."
                : "Self-reported answers. Full postal addresses are not exposed in this view."}
            </p>
            <dl className="workspace-answer-list">
              {Object.entries({
                ...selected.answers,
                ...selected.selections,
                ...selected.confirmations,
              }).map(([key, value]) => (
                <div key={key} style={{ display: "contents" }}>
                  <dt>{labels[key] || readable(key)}</dt>
                  <dd>
                    {typeof value === "boolean"
                      ? value
                        ? fr
                          ? "Oui"
                          : "Yes"
                        : fr
                          ? "Non"
                          : "No"
                      : Array.isArray(value)
                        ? value.map(readable).join(", ") || "—"
                        : readable(String(value)) || "—"}
                  </dd>
                </div>
              ))}
            </dl>
          </section>
        )}
      </main>
      <MarketplaceFooter locale={locale} />
    </div>
  );
}
