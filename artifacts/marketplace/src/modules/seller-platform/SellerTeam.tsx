import { TeamInvitationsPanel } from "./TeamInvitationsPanel";
import { SellerLoading } from "./SellerLoading";
import { useEffect, useState } from "react";
import { Button } from "@workspace/troc-design-system/components/ui/button";
import { Input } from "@workspace/troc-design-system/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogTitle,
} from "@workspace/troc-design-system/components/ui/dialog";
import { useSellerWorkspace } from "./SellerShell";
import { useSession } from "../account/Workspace";
import {
  OperationsPage,
  OperationsState,
  Choice,
  useSellerCopy,
} from "./operations-ui";
import { api } from "../../api";
type Member = { user_id: string; email: string; role: string; status: string };
export function SellerTeam() {
  const { seller, directoryState, reloadDirectory } = useSellerWorkspace();
  const { t } = useSellerCopy();
  if (!seller || directoryState !== "ready")
    return (
      <OperationsPage
        title={t("Team", "Équipe")}
        description={t(
          "Manage access to your store.",
          "Gérez les accès à votre boutique.",
        )}
      >
        <OperationsState
          error={directoryState === "error"}
          reload={reloadDirectory}
        />
      </OperationsPage>
    );
  return <SellerTeamContent key={seller} />;
}
function SellerTeamContent() {
  const { seller } = useSellerWorkspace(),
    { user } = useSession(),
    { t, locale } = useSellerCopy();
  const [members, setMembers] = useState<Member[] | null>(null),
    [error, setError] = useState(""),
    [revision, setRevision] = useState(0),
    [page, setPage] = useState(0),
    [editing, setEditing] = useState<Member | null | undefined>(undefined),
    [email, setEmail] = useState(""),
    [role, setRole] = useState("inventory"),
    [busy, setBusy] = useState(false),
    [notice, setNotice] = useState("");
  const roles: [string, string, string][] = [
    [
      "owner",
      t("Owner", "Propriétaire"),
      t(
        "Manage the store, settings and team. Full seller access.",
        "Gère la boutique, les paramètres et l’équipe. Accès vendeur complet.",
      ),
    ],
    [
      "manager",
      t("Manager", "Gestionnaire"),
      t(
        "Inventory, orders, refunds and buyer messages.",
        "Inventaire, commandes, remboursements et messages.",
      ),
    ],
    [
      "inventory",
      t("Inventory", "Inventaire"),
      t(
        "Add listings, adjust stock and prices. No order access.",
        "Annonces, stock et prix. Aucun accès aux commandes.",
      ),
    ],
    [
      "fulfillment",
      t("Fulfilment", "Expédition"),
      t(
        "View orders and prepare shipments. No refunds or replies.",
        "Commandes et expédition. Aucun remboursement ou réponse.",
      ),
    ],
    [
      "customer_service",
      t("Customer service", "Service client"),
      t(
        "Read order details and reply to buyers.",
        "Consulte les commandes et répond aux acheteurs.",
      ),
    ],
  ];
  useEffect(() => {
    let active = true;
    setMembers(null);
    setError("");
    setEditing(undefined);
    if (seller)
      api<Member[]>("/seller/platform/" + seller + "/team?page=" + page)
        .then((v) => {
          if (active) setMembers(v);
        })
        .catch((e) => {
          if (active) setError(e.message);
        });
    return () => {
      active = false;
    };
  }, [seller, revision, page]);
  useEffect(() => {
    const guard = (e: Event) => {
      if (busy) e.preventDefault();
    };
    window.addEventListener("troc:seller-change", guard);
    return () => window.removeEventListener("troc:seller-change", guard);
  }, [busy]);
  function open(m: Member | null) {
    setEditing(m);
    setEmail(m?.email || "");
    setRole(m?.role || "inventory");
    setNotice("");
  }
  async function save() {
    if (busy) return;
    setBusy(true);
    setNotice("");
    try {
      await api(
        "/seller/platform/" + seller + (editing ? "/team" : "/invitations"),
        "POST",
        {
          ...(editing ? { userId: editing.user_id } : { email: email.trim() }),
          role: role === "remove" ? null : role,
        },
      );
      setEditing(undefined);
      setRevision((n) => n + 1);
      setNotice(
        editing
          ? t("Team access updated.", "Accès de l’équipe mis à jour.")
          : t(
              "Invitation created. Access starts after acceptance.",
              "Invitation créée. L’accès commence après acceptation.",
            ),
      );
    } catch (e) {
      setNotice(
        e instanceof Error && e.message === "last_owner"
          ? t(
              "Keep at least one active owner.",
              "Conservez au moins un propriétaire actif.",
            )
          : e instanceof Error && e.message === "member_unavailable"
            ? t(
                "No active TROC account matches this email.",
                "Aucun compte TROC actif ne correspond à ce courriel.",
              )
            : t(
                "Access was not changed. Check the details and retry.",
                "Accès non modifié. Vérifiez les détails et réessayez.",
              ),
      );
    } finally {
      setBusy(false);
    }
  }
  return (
    <OperationsPage
      title={t("Team", "Équipe")}
      description={t(
        "Give each person the access they need to run your store.",
        "Donnez à chacun les accès nécessaires pour gérer votre boutique.",
      )}
      actions={
        <Button disabled={!members} onClick={() => open(null)}>
          {t("Invite a teammate", "Inviter un membre")}
        </Button>
      }
    >
      {error ? (
        <section className="ops-empty" role="alert">
          <h2>
            {error === "forbidden"
              ? t(
                  "Only owners can manage this team",
                  "Seuls les propriétaires gèrent l’équipe",
                )
              : t("Team could not load", "Chargement impossible")}
          </h2>
          <p>
            {t(
              "Store owners and TROC administrators manage team access.",
              "Les propriétaires et administrateurs TROC gèrent les accès.",
            )}
          </p>
          <Button variant="secondary" onClick={() => setRevision((n) => n + 1)}>
            {t("Retry", "Réessayer")}
          </Button>
        </section>
      ) : !members ? (
        <SellerLoading view="team" locale={locale} />
      ) : (
        <>
          <section className="ops-panel">
            <h2>{t("People with access", "Personnes autorisées")}</h2>
            <div className="team-members">
              {members.map((m) => (
                <div className="team-member" key={m.user_id}>
                  <span className="ops-avatar" aria-hidden="true">
                    {m.email[0].toUpperCase()}
                  </span>
                  <div>
                    <strong>
                      {m.email}
                      {m.user_id === user?.id ? " · " + t("You", "Vous") : ""}
                    </strong>
                    <p>
                      {roles.find((r) => r[0] === m.role)?.[1]} ·{" "}
                      {m.status === "active"
                        ? t("Active", "Actif")
                        : t("Inactive", "Inactif")}
                    </p>
                  </div>
                  <Button variant="secondary" onClick={() => open(m)}>
                    {t("Manage access", "Gérer l’accès")}
                  </Button>
                </div>
              ))}
            </div>
            {(page > 0 || members.length === 50) && (
              <div className="ops-pagination">
                <Button
                  variant="secondary"
                  disabled={!page}
                  onClick={() => setPage((n) => n - 1)}
                >
                  {t("Previous", "Précédent")}
                </Button>
                <Button
                  variant="secondary"
                  disabled={members.length < 50}
                  onClick={() => setPage((n) => n + 1)}
                >
                  {t("Next", "Suivant")}
                </Button>
              </div>
            )}
          </section>
          <TeamInvitationsPanel key={seller + ":" + revision} seller={seller} />
          <section className="team-role-guide">
            <h2>{t("Choose the right role", "Choisir le bon rôle")}</h2>
            <div>
              {roles.map(([id, label, description]) => (
                <article key={id}>
                  <h3>{label}</h3>
                  <p>{description}</p>
                </article>
              ))}
            </div>
          </section>
        </>
      )}
      {notice && editing === undefined && (
        <p role="status" className="ops-scope">
          {notice}
        </p>
      )}
      <Dialog
        open={editing !== undefined}
        onOpenChange={(v) => {
          if (!v && !busy) setEditing(undefined);
        }}
      >
        <DialogContent
          closeLabel={t("Close", "Fermer")}
          aria-describedby="team-access-help"
        >
          <DialogTitle>
            {editing
              ? t("Manage team access", "Gérer l’accès")
              : t("Invite a teammate", "Inviter un membre")}
          </DialogTitle>
          <p id="team-access-help" className="ops-scope">
            {t(
              "Use an existing TROC account. New teammates accept in Account preferences before receiving access. Existing member changes apply immediately. No email is sent.",
              "Utilisez un compte TROC existant. Les nouveaux membres acceptent dans les préférences du compte avant de recevoir l’accès. Les modifications des membres existants sont immédiates. Aucun courriel n’est envoyé.",
            )}
          </p>
          <form
            className="team-access-form"
            onSubmit={(e) => {
              e.preventDefault();
              void save();
            }}
          >
            <label>
              {t("Account email", "Courriel du compte")}
              <Input
                type="email"
                required
                maxLength={254}
                value={email}
                disabled={!!editing || busy}
                onChange={(e) => setEmail(e.target.value)}
              />
            </label>
            <Choice
              label={t("Role", "Rôle")}
              disabled={busy}
              value={role}
              onChange={setRole}
              items={[
                ...roles
                  .filter(([v]) => editing || v !== "owner")
                  .map(([v, l]) => [v, l] as [string, string]),
                ...(editing
                  ? [
                      [
                        "remove",
                        t(
                          "Remove store access",
                          "Retirer l’accès à la boutique",
                        ),
                      ] as [string, string],
                    ]
                  : []),
              ]}
            />
            <p className="ops-scope">
              {role === "remove"
                ? t(
                    "This person will lose store access. Their personal account stays available.",
                    "Cette personne perdra l’accès à la boutique. Son compte personnel reste disponible.",
                  )
                : roles.find((r) => r[0] === role)?.[2]}
            </p>
            {notice && <p role="alert">{notice}</p>}
            <div className="seller-page-actions">
              <Button
                variant="secondary"
                type="button"
                disabled={busy}
                onClick={() => setEditing(undefined)}
              >
                {t("Cancel", "Annuler")}
              </Button>
              <Button disabled={busy} type="submit">
                {busy
                  ? t("Saving…", "Enregistrement…")
                  : role === "remove"
                    ? t("Confirm removal", "Confirmer le retrait")
                    : editing
                      ? t("Confirm access", "Confirmer l’accès")
                      : t("Create invitation", "Créer l’invitation")}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </OperationsPage>
  );
}
