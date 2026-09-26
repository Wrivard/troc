import { ReportDecision } from "./ReportDecision";
import { useEffect, useState } from "react";
import { usePreferences } from "@workspace/troc-design-system/hooks/use-preferences";
import { Button } from "@workspace/troc-design-system/components/ui/button";
import { MarketplaceHeader, MarketplaceFooter } from "../brand/SiteChrome";
import "./admin-reports.css";
type Report = {
  id: string;
  reason: string;
  details: string;
  state: string;
  created_at: string;
  message_body: string;
  subject: string;
  seller_id: string;
  enquiry_id: string;
  reporter_id: string;
  message_id: string;
  review_note?: string | null;
  reviewed_at?: string | null;
};
type Page = { items: Report[]; nextBefore: string | null };
export function AdminReports() {
  const { locale, theme, setLocale, setTheme } = usePreferences();
  const fr = locale === "fr",
    t = (en: string, frText: string) => (fr ? frText : en);
  const [cursors, setCursors] = useState<(string | null)[]>([null]);
  const [revision, setRevision] = useState(0);
  const [data, setData] = useState<Page | null>(null);
  const [error, setError] = useState("");
  const cursor = cursors[cursors.length - 1];
  useEffect(() => {
    document.title =
      (fr ? "Signalements de messages" : "Message reports") + " · TROC";
  }, [fr]);
  useEffect(() => {
    const controller = new AbortController();
    setData(null);
    setError("");
    fetch(
      "/api/seller/admin/enquiry-reports" +
        (cursor ? "?before=" + encodeURIComponent(cursor) : ""),
      {
        credentials: "same-origin",
        signal: AbortSignal.any([
          controller.signal,
          AbortSignal.timeout(15000),
        ]),
      },
    )
      .then(async (response) => {
        if (!response.ok)
          throw Error(
            [401, 403].includes(response.status) ? "forbidden" : "unavailable",
          );
        const page = (await response.json()) as Page;
        if (
          !Array.isArray(page.items) ||
          page.items.length > 50 ||
          !(page.nextBefore === null || typeof page.nextBefore === "string")
        )
          throw Error("unavailable");
        return page;
      })
      .then((page) => {
        if (!controller.signal.aborted) setData(page);
      })
      .catch((e) => {
        if (!controller.signal.aborted) setError(e.message);
      });
    return () => controller.abort();
  }, [cursor, revision]);
  const reasons: Record<string, string> = {
    spam: t("Spam", "Pourriel"),
    harassment: t("Harassment", "Harcèlement"),
    fraud: t("Suspected fraud", "Fraude présumée"),
    other: t("Other", "Autre"),
  };
  const states: Record<string, string> = {
    open: t("Awaiting review", "À examiner"),
    resolved: t("Resolved", "Résolu"),
    dismissed: t("Dismissed", "Classé sans suite"),
  };
  return (
    <div className="min-h-screen bg-background text-foreground">
      <MarketplaceHeader
        locale={locale}
        theme={theme}
        onLocale={setLocale}
        onTheme={setTheme}
      />
      <main id="main-content" className="workspace-page admin-reports">
        <header className="workspace-heading">
          <p className="workspace-eyebrow">ADMINISTRATION</p>
          <h1>{t("Message reports", "Signalements de messages")}</h1>
          <p>
            {t(
              "Private reports from pre-sale conversations. Review the original message and the reporter’s context.",
              "Signalements privés de conversations avant achat. Examinez le message original et le contexte fourni.",
            )}
          </p>
        </header>
        <div className="report-toolbar">
          <p>
            {t(
              "Record a private review decision. Account, order and conversation access remain unchanged.",
              "Enregistrez une décision privée. Les accès aux comptes, commandes et conversations restent inchangés.",
            )}
          </p>
          <Button
            variant="outline"
            disabled={!data && !error}
            onClick={() => {
              setCursors([null]);
              setRevision((n) => n + 1);
            }}
          >
            {t("Refresh", "Actualiser")}
          </Button>
        </div>
        {error ? (
          <div role="alert">
            <p>
              {error === "forbidden"
                ? t(
                    "Administrator access required.",
                    "Accès administrateur requis.",
                  )
                : t(
                    "Reports could not be loaded. Please try again.",
                    "Impossible de charger les signalements. Veuillez réessayer.",
                  )}
            </p>
            {error !== "forbidden" && (
              <Button
                variant="outline"
                onClick={() => setRevision((n) => n + 1)}
              >
                {t("Try again", "Réessayer")}
              </Button>
            )}
          </div>
        ) : !data ? (
          <p role="status">
            {t("Loading reports…", "Chargement des signalements…")}
          </p>
        ) : (
          <>
            <p role="status">
              {data.items.length
                ? t(
                    "Reports on this page: ",
                    "Signalements sur cette page : ",
                  ) + data.items.length
                : t(
                    "No reports on this page.",
                    "Aucun signalement sur cette page.",
                  )}
            </p>
            <div className="report-list">
              {data.items.map((report) => (
                <article
                  className="report-card"
                  key={report.id}
                  aria-labelledby={"report-" + report.id}
                >
                  <div className="report-card-heading">
                    <div>
                      <p className="report-reason">
                        {reasons[report.reason] ||
                          t("Unknown reason", "Motif inconnu")}
                      </p>
                      <h2 id={"report-" + report.id}>{report.subject}</h2>
                    </div>
                    <span className="report-state">
                      {states[report.state] ||
                        t("Unknown status", "État inconnu")}
                    </span>
                  </div>
                  <p className="report-date">
                    {new Intl.DateTimeFormat(fr ? "fr-CA" : "en-CA", {
                      dateStyle: "medium",
                      timeStyle: "short",
                    }).format(new Date(report.created_at))}
                  </p>
                  <div className="report-content">
                    <section>
                      <h3>{t("Reported message", "Message signalé")}</h3>
                      <blockquote>{report.message_body}</blockquote>
                    </section>
                    <section>
                      <h3>{t("Reporter’s notes", "Notes de la personne")}</h3>
                      <p>
                        {report.details ||
                          t(
                            "No additional context provided.",
                            "Aucun contexte supplémentaire fourni.",
                          )}
                      </p>
                    </section>
                  </div>
                  {report.state === "open" ? (
                    <ReportDecision
                      id={report.id}
                      subject={report.subject}
                      locale={locale}
                      onComplete={() => setRevision((n) => n + 1)}
                    />
                  ) : report.review_note ? (
                    <section className="report-review">
                      <h3>{t("Review decision", "Décision d’examen")}</h3>
                      <p>{report.review_note}</p>
                      {report.reviewed_at && (
                        <p className="report-date">
                          {t("Reviewed", "Examiné")} ·{" "}
                          {new Intl.DateTimeFormat(fr ? "fr-CA" : "en-CA", {
                            dateStyle: "medium",
                            timeStyle: "short",
                          }).format(new Date(report.reviewed_at))}
                        </p>
                      )}
                    </section>
                  ) : null}
                  <details>
                    <summary>
                      {t("Reference IDs", "Identifiants de référence")}
                    </summary>
                    <dl>
                      {[
                        [t("Report", "Signalement"), report.id],
                        [t("Store", "Boutique"), report.seller_id],
                        [t("Conversation", "Conversation"), report.enquiry_id],
                        [t("Message", "Message"), report.message_id],
                        [
                          t("Reporter", "Auteur du signalement"),
                          report.reporter_id,
                        ],
                      ].map(([label, value]) => (
                        <div key={label}>
                          <dt>{label}</dt>
                          <dd>{value}</dd>
                        </div>
                      ))}
                    </dl>
                  </details>
                </article>
              ))}
            </div>
          </>
        )}
        <nav
          className="report-pagination"
          aria-label={t("Report pages", "Pages de signalements")}
        >
          <Button
            variant="outline"
            disabled={cursors.length === 1 || !data}
            onClick={() => setCursors((v) => v.slice(0, -1))}
          >
            {t("Previous", "Précédent")}
          </Button>
          <span>
            {t("Page", "Page")} {cursors.length}
          </span>
          <Button
            variant="outline"
            disabled={!data?.nextBefore || cursors.includes(data.nextBefore)}
            onClick={() => {
              if (data?.nextBefore) setCursors((v) => [...v, data.nextBefore]);
            }}
          >
            {t("Next", "Suivant")}
          </Button>
        </nav>
      </main>
      <MarketplaceFooter locale={locale} />
    </div>
  );
}
