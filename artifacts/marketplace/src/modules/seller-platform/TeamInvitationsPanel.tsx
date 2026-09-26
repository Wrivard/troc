import { useEffect, useRef, useState } from "react";
import { Button } from "@workspace/troc-design-system/components/ui/button";
import { api } from "../../api";
import { useSellerCopy } from "./operations-ui";
import { useSession } from "../account/Workspace";
type Row = {
  id: string;
  sellerId: string;
  storeName: string;
  recipientEmail: string;
  inviterEmail: string;
  role: string;
  status: string;
  expiresAt: string;
};
type Page = { invitations: Row[]; nextCursor: string | null };
export function TeamInvitationsPanel({ seller }: { seller?: string }) {
  const { t, locale } = useSellerCopy(),
    { reload } = useSession();
  const [nav, setNav] = useState({ page: 0, cursors: [""] }),
    [revision, setRevision] = useState(0),
    [result, setResult] = useState<{
      key: string;
      data?: Page;
      error?: boolean;
    }>(),
    [busy, setBusy] = useState(false),
    [notice, setNotice] = useState("");
  const mounted = useRef(true),
    saving = useRef(false);
  useEffect(() => {
    mounted.current = true;
    return () => {
      mounted.current = false;
    };
  }, []);
  const path = seller
    ? "/seller/platform/" + seller + "/invitations"
    : "/seller/invitations";
  const key = JSON.stringify([path, nav.cursors[nav.page], revision]);
  useEffect(() => {
    let active = true;
    api<Page>(
      path +
        (nav.cursors[nav.page]
          ? "?cursor=" + encodeURIComponent(nav.cursors[nav.page])
          : ""),
    )
      .then((data) => {
        if (active) setResult({ key, data });
      })
      .catch(() => {
        if (active) setResult({ key, error: true });
      });
    return () => {
      active = false;
    };
  }, [key, path]);
  const data = result?.key === key ? result.data : undefined,
    error = result?.key === key && result.error;
  const labels: Record<string, string> = {
    pending: t("Pending", "En attente"),
    accepted: t("Accepted", "Acceptée"),
    declined: t("Declined", "Refusée"),
    revoked: t("Revoked", "Révoquée"),
    expired: t("Expired", "Expirée"),
    manager: t("Manager", "Gestionnaire"),
    inventory: t("Inventory", "Inventaire"),
    fulfillment: t("Fulfilment", "Expédition"),
    customer_service: t("Customer service", "Service client"),
  };
  async function resolve(row: Row, action: string) {
    if (saving.current) return;
    saving.current = true;
    setBusy(true);
    setNotice("");
    try {
      const response = await api<{ status: string }>(
        "/seller/platform/" +
          row.sellerId +
          "/invitations/" +
          row.id +
          "/" +
          action,
        "POST",
        {},
      );
      if (!mounted.current) return;
      setNotice(labels[response.status] ?? response.status);
      setRevision((v) => v + 1);
      if (response.status === "accepted") await reload();
    } catch {
      if (mounted.current)
        setNotice(
          t(
            "Action not confirmed. Refresh the list or try again.",
            "Action non confirmée. Actualisez la liste ou réessayez.",
          ),
        );
    } finally {
      saving.current = false;
      if (mounted.current) setBusy(false);
    }
  }
  return (
    <section
      id="team-invitations"
      className="ops-panel team-invitations"
      aria-busy={busy}
    >
      <h2>{t("Team invitations", "Invitations d’équipe")}</h2>
      <p>
        {seller
          ? t(
              "Invitations appear in the recipient’s account preferences. Access begins only after acceptance. No email is sent.",
              "Les invitations apparaissent dans les préférences du destinataire. L’accès commence après acceptation. Aucun courriel n’est envoyé.",
            )
          : t(
              "Review the store and role before accepting. Invitations expire after seven days.",
              "Vérifiez la boutique et le rôle avant d’accepter. Les invitations expirent après sept jours.",
            )}
      </p>
      <Button
        variant="secondary"
        disabled={busy}
        onClick={() => {
          setNav({ page: 0, cursors: [""] });
          setRevision((v) => v + 1);
        }}
      >
        {t("Refresh invitations", "Actualiser les invitations")}
      </Button>
      {notice && <p role="status">{notice}</p>}
      {error ? (
        <p role="alert">
          {t(
            "Invitations could not load. Use Refresh invitations to retry.",
            "Impossible de charger les invitations. Utilisez Actualiser les invitations pour réessayer.",
          )}
        </p>
      ) : !data ? (
        <p role="status">
          {t("Loading invitations…", "Chargement des invitations…")}
        </p>
      ) : (
        <>
          {!data.invitations.length && (
            <p>{t("No invitations.", "Aucune invitation.")}</p>
          )}
          <div className="team-members">
            {data.invitations.map((row) => (
              <article className="team-member" key={row.id}>
                <div>
                  <strong>{seller ? row.recipientEmail : row.storeName}</strong>
                  <p>
                    {labels[row.role]} · {labels[row.status]}
                  </p>
                  {!seller && (
                    <p>
                      {t("Invited by", "Invitation de")} {row.inviterEmail}
                    </p>
                  )}
                  <p>
                    {t("Expires", "Expiration")}{" "}
                    {new Date(row.expiresAt).toLocaleDateString(
                      locale === "fr" ? "fr-CA" : "en-CA",
                    )}
                  </p>
                </div>
                {row.status === "pending" && (
                  <div className="seller-page-actions">
                    {seller ? (
                      <Button
                        variant="secondary"
                        disabled={busy}
                        onClick={() => resolve(row, "revoke")}
                      >
                        {t("Revoke", "Révoquer")}
                      </Button>
                    ) : (
                      <>
                        <Button
                          disabled={busy}
                          onClick={() => resolve(row, "accept")}
                        >
                          {t("Accept", "Accepter")}
                        </Button>
                        <Button
                          variant="secondary"
                          disabled={busy}
                          onClick={() => resolve(row, "decline")}
                        >
                          {t("Decline", "Refuser")}
                        </Button>
                      </>
                    )}
                  </div>
                )}
              </article>
            ))}
          </div>
          <div className="ops-pagination">
            <Button
              variant="secondary"
              disabled={busy || nav.page === 0}
              onClick={() => setNav({ ...nav, page: nav.page - 1 })}
            >
              {t("Previous", "Précédent")}
            </Button>
            <span>
              {t("Page", "Page")} {nav.page + 1}
            </span>
            <Button
              variant="secondary"
              disabled={busy || !data.nextCursor}
              onClick={() => {
                if (data.nextCursor)
                  setNav({
                    page: nav.page + 1,
                    cursors: [
                      ...nav.cursors.slice(0, nav.page + 1),
                      data.nextCursor,
                    ],
                  });
              }}
            >
              {t("Next", "Suivant")}
            </Button>
          </div>
        </>
      )}
    </section>
  );
}
