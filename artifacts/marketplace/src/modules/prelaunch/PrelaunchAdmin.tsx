import { useState, type FormEvent } from "react";
import { Button } from "@workspace/troc-design-system/components/ui/button";
import { usePreferences } from "@workspace/troc-design-system/hooks/use-preferences";
import { api } from "../../api";
import { copy, options, type CopyKey } from "./copy";
type Lead = {
  id: string;
  email: string;
  locale: string;
  details: Record<string, string | string[]>;
  acquisition: { source: string; referral: string | null };
  cohort: string;
  lead_status: string;
  revision: number;
  unsubscribed_at: string | null;
};
export function PrelaunchAdmin() {
  const [referralLinks, setReferralLinks] = useState<Record<string, string>>(
    {},
  );
  const { locale } = usePreferences(),
    lang = locale === "fr" ? 1 : 0,
    t = (k: CopyKey) => copy[k][lang];
  const [leads, setLeads] = useState<Lead[]>([]),
    [filters, setFilters] = useState("kind=seller"),
    [page, setPage] = useState(0),
    [loaded, setLoaded] = useState(false),
    [error, setError] = useState<CopyKey | null>(null),
    [busy, setBusy] = useState(false);
  function errorKey(error: unknown): CopyKey {
    const code = error instanceof Error ? error.message : "";
    if (code === "unauthorized") return "adminSignIn";
    if (code === "forbidden") return "adminForbidden";
    if (code === "lead_conflict") return "adminConflict";
    return "adminUnavailable";
  }
  const [metrics, setMetrics] = useState<{
    events: { kind: string; name: string; provenance: string; count: number }[];
  } | null>(null);
  async function load(query = filters, index = page) {
    setBusy(true);
    setError(null);
    try {
      const [rows, counts] = await Promise.all([
        api<Lead[]>("/prelaunch/admin/leads?" + query + "&page=" + index),
        api<{
          events: {
            kind: string;
            name: string;
            provenance: string;
            count: number;
          }[];
        }>("/prelaunch/admin/metrics"),
      ]);
      setLeads(rows);
      setMetrics(counts);
      setLoaded(true);
      setPage(index);
      setFilters(query);
    } catch (error) {
      setLeads([]);
      setMetrics(null);
      setError(errorKey(error));
    } finally {
      setBusy(false);
    }
  }
  function filter(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    void load(
      new URLSearchParams(
        new FormData(event.currentTarget) as unknown as Record<string, string>,
      ).toString(),
      0,
    );
  }
  async function save(event: FormEvent<HTMLFormElement>, lead: Lead) {
    event.preventDefault();
    setBusy(true);
    setError(null);
    try {
      await api(
        "/prelaunch/admin/leads/" +
          new URLSearchParams(filters).get("kind") +
          "/" +
          lead.id,
        "PATCH",
        {
          ...Object.fromEntries(new FormData(event.currentTarget)),
          revision: lead.revision,
        },
      );
      await load();
    } catch (error) {
      setError(errorKey(error));
    } finally {
      setBusy(false);
    }
  }
  function select(name: CopyKey, value = "", all = true) {
    return (
      <label>
        {t(name)}
        <select name={name} defaultValue={value}>
          {all && <option value="">{locale === "fr" ? "Tous" : "All"}</option>}
          {options[name].map(([v, en, fr]) => (
            <option key={v} value={v}>
              {lang ? fr : en}
            </option>
          ))}
        </select>
      </label>
    );
  }
  function label(field: string, value: string) {
    return options[field]?.find((o) => o[0] === value)?.[lang + 1] ?? value;
  }
  return (
    <>
      <h1>{t("admin")}</h1>
      <form onSubmit={filter}>
        <label>
          {t("choose")}
          <select name="kind" defaultValue="seller">
            <option value="seller">{t("seller")}</option>
            <option value="collector">{t("collector")}</option>
          </select>
        </label>
        <div className="prelaunch-grid">
          {(
            [
              "province",
              "games",
              "inventory",
              "software",
              "experience",
              "sellerType",
              "channels",
              "cohort",
              "status",
            ] as const
          ).map((k) => (
            <div key={k}>{select(k)}</div>
          ))}
        </div>
        <Button type="submit" disabled={busy}>
          {t("load")}
        </Button>
      </form>
      {error && (
        <div>
          <p role="alert">{t(error)}</p>
          <Button type="button" disabled={busy} onClick={() => void load()}>
            {t("reload")}
          </Button>
        </div>
      )}
      {loaded && !leads.length && !error && <p>{t("empty")}</p>}
      {leads.slice(0, 50).map((lead) => (
        <article className="prelaunch-lead" key={`${lead.id}:${lead.revision}`}>
          <h2>{lead.email}</h2>
          <p>
            {lead.unsubscribed_at
              ? lang
                ? "Consentement retiré"
                : "Consent withdrawn"
              : lang
                ? "Consentement enregistré · Courriel non vérifié"
                : "Consent recorded · Email unverified"}
          </p>
          <dl>
            {Object.entries(lead.details).map(([field, value]) => (
              <div key={field}>
                <dt>{field in copy ? t(field as CopyKey) : field}</dt>
                <dd>
                  {(Array.isArray(value) ? value : [value])
                    .map((v) => label(field, v))
                    .join(", ") || "—"}
                </dd>
              </div>
            ))}
          </dl>
          <p>
            {lang
              ? "Source déclarée (non vérifiée)"
              : "Reported source (unverified)"}
            : {lead.acquisition.source ?? "—"} ·{" "}
            {lang ? "Référence" : "Referral"}:{" "}
            {lead.acquisition.referral ?? "—"}
          </p>
          <form onSubmit={(e) => void save(e, lead)}>
            <div className="prelaunch-grid">
              {select("cohort", lead.cohort, false)}
              {select("status", lead.lead_status, false)}
            </div>
            <Button type="submit" disabled={busy}>
              {t("save")}
            </Button>
          </form>
          <Button
            variant="secondary"
            disabled={busy || !!lead.unsubscribed_at}
            onClick={async () => {
              setBusy(true);
              setError(null);
              try {
                const result = await api<{ code: string }>(
                  "/prelaunch/admin/referrals",
                  "POST",
                  {
                    kind: new URLSearchParams(filters).get("kind"),
                    leadId: lead.id,
                  },
                );
                setReferralLinks((previous) => ({
                  ...previous,
                  [lead.id]: `${window.location.origin}${import.meta.env.BASE_URL}early-access?ref=${result.code}`,
                }));
              } catch (error) {
                setError(errorKey(error));
              } finally {
                setBusy(false);
              }
            }}
          >
            {lang ? "Créer un lien de référence" : "Create referral link"}
          </Button>
          {referralLinks[lead.id] && (
            <p>
              <a href={referralLinks[lead.id]}>{referralLinks[lead.id]}</a>
            </p>
          )}
        </article>
      ))}
      {loaded && (
        <div className="prelaunch-checks">
          <Button
            variant="secondary"
            disabled={busy || page === 0}
            onClick={() => void load(filters, page - 1)}
          >
            {t("previous")}
          </Button>
          <Button
            variant="secondary"
            disabled={busy || leads.length <= 50}
            onClick={() => void load(filters, page + 1)}
          >
            {t("next")}
          </Button>
        </div>
      )}
      {metrics && (
        <section>
          <h2>{t("metrics")}</h2>
          <p>{t("unknown")}</p>
          <ul>
            {metrics.events.map((e) => (
              <li key={e.kind + e.name}>
                {e.kind === "landing"
                  ? lang
                    ? "Parcours non choisi"
                    : "Path not selected"
                  : t(e.kind === "seller" ? "seller" : "collector")}{" "}
                ·{" "}
                {
                  ({
                    landing_visit: ["Landing visit", "Visite de la page"],
                    cta: ["Path selected", "Parcours choisi"],
                    form_start: [
                      "Form activity observed",
                      "Activité du formulaire observée",
                    ],
                    completion: ["New interest entry", "Nouvelle inscription"],
                    referral: ["Attributed referral", "Référence attribuée"],
                  }[e.name] ?? [e.name, e.name])[lang]
                }{" "}
                ·{" "}
                {e.provenance === "server_recorded"
                  ? lang
                    ? "Confirmé par le serveur"
                    : "Server recorded"
                  : lang
                    ? "Observation du navigateur"
                    : "Browser observed"}
                : {e.count}
              </li>
            ))}
          </ul>
        </section>
      )}
    </>
  );
}
