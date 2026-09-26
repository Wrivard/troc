import { useGrowthDialogFocus } from "./growth-dialog-focus";
import { useState } from "react";
import { Button } from "@workspace/troc-design-system/components/ui/button";
import { Input } from "@workspace/troc-design-system/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogTitle,
} from "@workspace/troc-design-system/components/ui/dialog";
import { OperationsPage, Choice, useSellerCopy } from "./operations-ui";
import "./seller-growth.css";
const transfers = [
  {
    id: "SAMPLE-0142",
    date: "2026-09-20",
    gross: 118630,
    fees: 6180,
    refunds: 10000,
    status: "paid",
  },
  {
    id: "SAMPLE-0138",
    date: "2026-09-13",
    gross: 89215,
    fees: 4620,
    refunds: 2500,
    status: "paid",
  },
  {
    id: "SAMPLE-0134",
    date: "2026-09-06",
    gross: 75540,
    fees: 3910,
    refunds: 0,
    status: "paid",
  },
  {
    id: "SAMPLE-0130",
    date: "2026-08-30",
    gross: 102480,
    fees: 5330,
    refunds: 5000,
    status: "paid",
  },
  {
    id: "SAMPLE-0126",
    date: "2026-08-23",
    gross: 62035,
    fees: 3210,
    refunds: 0,
    status: "transit",
  },
  {
    id: "SAMPLE-0122",
    date: "2026-08-16",
    gross: 43890,
    fees: 2430,
    refunds: 0,
    status: "pending",
  },
];
export function downloadRows(name: string, rows: (string | number)[][]) {
  const csv = rows
    .map((row) =>
      row.map((v) => '"' + String(v).replace(/"/g, '""') + '"').join(","),
    )
    .join("\r\n");
  const url = URL.createObjectURL(
    new Blob(["\uFEFF" + csv], { type: "text/csv;charset=utf-8" }),
  );
  const a = document.createElement("a");
  a.href = url;
  a.download = name;
  a.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
export function SellerPayouts() {
  const dialogFocus = useGrowthDialogFocus();
  const { t, money, href } = useSellerCopy();
  const [sample, setSample] = useState(true),
    [query, setQuery] = useState(""),
    [status, setStatus] = useState("all"),
    [detail, setDetail] = useState<(typeof transfers)[number] | null>(null),
    [account, setAccount] = useState(false);
  const label = (s: string) =>
    s === "paid"
      ? t("Paid", "Payé")
      : s === "transit"
        ? t("In transit", "En transit")
        : t("Pending", "En attente");
  const rows = sample
    ? transfers.filter(
        (r) =>
          (status === "all" || status === r.status) &&
          r.id.toLowerCase().includes(query.toLowerCase()),
      )
    : [];
  const net = (r: (typeof transfers)[number]) => r.gross - r.fees - r.refunds;
  return (
    <OperationsPage
      title={t("Payouts", "Versements")}
      description={t(
        "Understand your balance and follow every transfer.",
        "Comprenez votre solde et suivez chaque versement.",
      )}
      actions={
        <>
          <Button
            variant="secondary"
            disabled={!rows.length}
            onClick={() =>
              downloadRows("troc-sample-payouts.csv", [
                [
                  t("Sample payout", "Versement fictif"),
                  "Date",
                  "Gross CAD",
                  "Fees CAD",
                  "Refunds CAD",
                  "Net CAD",
                  "Status",
                ],
                ...rows.map((r) => [
                  r.id,
                  r.date,
                  (r.gross / 100).toFixed(2),
                  (r.fees / 100).toFixed(2),
                  (r.refunds / 100).toFixed(2),
                  (net(r) / 100).toFixed(2),
                  label(r.status),
                ]),
              ])
            }
          >
            {t("Export sample payouts", "Exporter les exemples")}
          </Button>
          <Button onClick={() => setAccount(true)}>
            {t("Payout account", "Compte de versement")}
          </Button>
        </>
      }
    >
      <div className="growth-notice">
        <div>
          <strong>
            {sample
              ? t("Sample payout workspace", "Aperçu de versements fictifs")
              : t(
                  "Payout connection pending",
                  "Connexion des versements en attente",
                )}
          </strong>
          <p>
            {t(
              "No live balance, bank account or transfer is connected. Sample amounts are for exploring this screen.",
              "Aucun solde réel, compte bancaire ou transfert n’est connecté. Les montants fictifs servent à explorer cette page.",
            )}
          </p>
        </div>
        <Button variant="secondary" onClick={() => setSample(!sample)}>
          {sample
            ? t("Hide sample data", "Masquer les exemples")
            : t("Explore sample data", "Explorer les exemples")}
        </Button>
      </div>
      <div className="growth-metrics">
        {[
          [
            t("Available balance", "Solde disponible"),
            money(41235),
            t("Eligible in this sample", "Admissible dans cet exemple"),
          ],
          [
            t("Pending balance", "Solde en attente"),
            money(29820),
            t("Awaiting settlement", "En attente de règlement"),
          ],
          [
            t("Last paid transfer", "Dernier versement payé"),
            money(102450),
            "2026-09-20",
          ],
          [
            t("On hold / reserve", "Retenue / réserve"),
            money(8500),
            t("Separate from available funds", "Exclue du solde disponible"),
          ],
        ].map(([a, b, c]) => (
          <section className="growth-panel growth-metric" key={a}>
            <span>{a}</span>
            <strong>{sample ? b : "—"}</strong>
            <small>{sample ? c : t("Not connected", "Non connecté")}</small>
          </section>
        ))}
      </div>
      <div className="growth-columns">
        <div className="growth-stack">
          <section className="growth-panel">
            <div className="growth-section-heading">
              <div>
                <h2>
                  {t(
                    "Transfer history at a glance",
                    "Les versements en un coup d’œil",
                  )}
                </h2>
                <p>
                  {t(
                    "Net amount per sample transfer · CAD",
                    "Montant net par versement fictif · CAD",
                  )}
                </p>
              </div>
            </div>
            {sample ? (
              <>
                <div
                  className="payout-chart"
                  role="img"
                  aria-label={t(
                    "Six sample net transfers; exact values appear in the table below.",
                    "Six versements nets fictifs; les valeurs exactes figurent au tableau.",
                  )}
                >
                  {[...transfers].reverse().map((r) => (
                    <div key={r.id}>
                      <span>{money(net(r))}</span>
                      <i
                        style={{ height: Math.round((net(r) / 102450) * 150) }}
                      />
                      <small>{r.date.slice(5)}</small>
                    </div>
                  ))}
                </div>
                <p className="growth-muted">
                  {t(
                    "Sample timeline: August–September 2026. These are not sales or a forecast.",
                    "Période fictive : août–septembre 2026. Ce ne sont ni des ventes ni une prévision.",
                  )}
                </p>
              </>
            ) : (
              <div className="growth-empty">
                {t(
                  "Your confirmed transfers will appear here once payouts are connected.",
                  "Vos versements confirmés apparaîtront ici après la connexion du service.",
                )}
              </div>
            )}
          </section>
          <section className="growth-panel">
            <div className="growth-section-heading">
              <h2>{t("Payout history", "Historique des versements")}</h2>
              <span>
                {rows.length} {t("transfers", "versements")}
              </span>
            </div>
            <div className="growth-filters">
              <Input
                aria-label={t("Search payout ID", "Rechercher un versement")}
                placeholder={t("Search payout ID…", "Numéro de versement…")}
                value={query}
                onChange={(e) => setQuery(e.target.value)}
              />
              <Choice
                label={t("Status", "Statut")}
                value={status}
                onChange={setStatus}
                items={[
                  ["all", t("All statuses", "Tous les statuts")],
                  ["paid", label("paid")],
                  ["transit", label("transit")],
                  ["pending", label("pending")],
                ]}
              />
            </div>
            <div
              className="growth-table"
              tabIndex={0}
              role="region"
              aria-label={t("Payout history table", "Tableau des versements")}
            >
              <table>
                <thead>
                  <tr>
                    {[
                      t("Payout ID", "Versement"),
                      t("Initiated", "Initié"),
                      t("Gross sales", "Ventes brutes"),
                      t("Fees", "Frais"),
                      t("Refunds", "Remboursements"),
                      t("Net payout", "Versement net"),
                      t("Status", "Statut"),
                    ].map((x) => (
                      <th key={x}>{x}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {rows.map((r) => (
                    <tr key={r.id}>
                      <td>
                        <button
                          className="growth-link"
                          onClick={() => setDetail(r)}
                        >
                          {r.id}
                        </button>
                      </td>
                      <td>{r.date}</td>
                      <td>{money(r.gross)}</td>
                      <td>−{money(r.fees)}</td>
                      <td>−{money(r.refunds)}</td>
                      <td>
                        <strong>{money(net(r))}</strong>
                      </td>
                      <td>
                        <span className={"growth-badge " + r.status}>
                          {label(r.status)}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            {!rows.length && (
              <div className="growth-empty">
                {sample
                  ? t(
                      "No matching transfers. Try another ID or status.",
                      "Aucun versement correspondant. Modifiez la recherche ou le statut.",
                    )
                  : t(
                      "No connected transfers yet.",
                      "Aucun versement connecté pour le moment.",
                    )}
              </div>
            )}
          </section>
        </div>
        <aside
          className="growth-stack"
          aria-label={t("Tools and guidance", "Outils et conseils")}
        >
          <section className="growth-panel">
            <h2>{t("Payout account", "Compte de versement")}</h2>
            <span className="growth-badge">
              {t("Not connected", "Non connecté")}
            </span>
            <p>
              {t(
                "Bank verification and transfers will be handled through the payment provider.",
                "La vérification bancaire et les transferts passeront par le fournisseur de paiement.",
              )}
            </p>
            <Button variant="secondary" onClick={() => setAccount(true)}>
              {t("View connection details", "Voir les détails")}
            </Button>
          </section>
          <section className="growth-panel">
            <h2>{t("Next payout", "Prochain versement")}</h2>
            <strong className="growth-large">—</strong>
            <p>
              {t(
                "No confirmed date. A sample balance does not schedule a transfer.",
                "Aucune date confirmée. Un solde fictif ne programme pas de transfert.",
              )}
            </p>
          </section>
          <section className="growth-panel">
            <h2>{t("Know your numbers", "Comprendre vos montants")}</h2>
            <p>
              {t(
                "Gross sales − fees − refunds = net payout. Pending funds and reserves are not available to withdraw.",
                "Ventes brutes − frais − remboursements = versement net. Les fonds en attente et les réserves ne sont pas disponibles.",
              )}
            </p>
            <a
              className="growth-link"
              href={href("/seller/help?article=payout-timing")}
            >
              {t("Read the payout guide", "Lire le guide des versements")} →
            </a>
          </section>
        </aside>
      </div>
      <Dialog
        open={!!detail || account}
        onOpenChange={(v) => {
          if (!v) {
            setDetail(null);
            setAccount(false);
          }
        }}
      >
        <DialogContent
          {...dialogFocus}
          closeLabel={t("Close", "Fermer")}
          aria-describedby="payout-description"
        >
          <DialogTitle>
            {detail
              ? detail.id
              : t("Connect payouts", "Connecter les versements")}
          </DialogTitle>
          <p id="payout-description">
            {detail
              ? t(
                  "Fictional transfer breakdown. No money was moved.",
                  "Détail d’un versement fictif. Aucun argent n’a été transféré.",
                )
              : t(
                  "Payment-provider onboarding is not available in this preview. Bank details are not collected here. Your store setup and sample workspace remain available.",
                  "L’inscription au fournisseur de paiement n’est pas disponible dans cet aperçu. Aucune coordonnée bancaire n’est recueillie ici. La configuration de votre boutique et les exemples restent accessibles.",
                )}
          </p>
          {detail && (
            <dl className="growth-breakdown">
              {[
                [t("Gross sales", "Ventes brutes"), detail.gross],
                [t("Fees deducted", "Frais déduits"), -detail.fees],
                [
                  t("Refunds deducted", "Remboursements déduits"),
                  -detail.refunds,
                ],
                [t("Net payout", "Versement net"), net(detail)],
              ].map(([k, v]) => (
                <div key={k}>
                  <dt>{k}</dt>
                  <dd>{money(Number(v))}</dd>
                </div>
              ))}
            </dl>
          )}
        </DialogContent>
      </Dialog>
    </OperationsPage>
  );
}
