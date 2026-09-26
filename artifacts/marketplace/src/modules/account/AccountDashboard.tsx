import { TeamInvitationsPanel } from "../seller-platform/TeamInvitationsPanel";
import { useEffect, useRef, useState } from "react";
import { usePreferences } from "@workspace/troc-design-system/hooks/use-preferences";
import { Button } from "@workspace/troc-design-system/components/ui/button";
import { MarketplaceHeader, MarketplaceFooter } from "../brand/SiteChrome";
import { AccountWaitlist } from "./AccountWaitlist";
import { useSession, isSeller } from "./Workspace";
import { api } from "../../api";
export function AccountDashboard({ path }: { path: string }) {
  const { user, reload } = useSession(),
    { locale, theme, setLocale, setTheme } = usePreferences();
  const fr = locale === "fr",
    settings = path.endsWith("/settings");
  const [saving, setSaving] = useState(false),
    [status, setStatus] = useState("");
  const currentPreferences = useRef({ locale, theme });
  useEffect(() => {
    currentPreferences.current = { locale, theme };
    setStatus("");
  }, [locale, theme]);
  useEffect(() => {
    document.title =
      (settings
        ? fr
          ? "Préférences"
          : "Preferences"
        : fr
          ? "Mon compte"
          : "My account") + " · TROC";
  }, [settings, fr]);
  useEffect(() => {
    if (user && path === "/account")
      window.location.replace(
        (isSeller(user) ? "/seller/dashboard" : "/account/orders") +
          "?lang=" +
          locale,
      );
  }, [user, path, locale]);
  useEffect(() => {
    if (user && settings && location.hash === "#early-access") {
      document.getElementById("early-access")?.scrollIntoView();
    }
  }, [user, settings]);
  if (!user || path === "/account") return null;
  const links = [
    [
      "/account/orders",
      fr ? "Vos commandes" : "Your orders",
      fr
        ? "Retrouvez les achats, les suivis et les échanges liés à vos commandes."
        : "Find purchases, tracking and conversations linked to your orders.",
    ],
    [
      "/account/settings",
      fr ? "Vos préférences" : "Your preferences",
      fr
        ? "Langue et apparence, enregistrées sur votre compte."
        : "Language and appearance, saved to your account.",
    ],
    ...(isSeller(user)
      ? [
          [
            "/seller/dashboard",
            fr ? "Votre espace vendeur" : "Your seller workspace",
            fr
              ? "Gérez les annonces, les ventes et votre équipe."
              : "Manage listings, sales and your team.",
          ],
        ]
      : [
          [
            "/seller/apply",
            fr ? "Envie de vendre ?" : "Interested in selling?",
            fr
              ? "Présentez votre activité pour demander un accès vendeur."
              : "Tell us about your activity to apply for seller access.",
          ],
        ]),
    ...(user.roles?.includes("admin")
      ? [
          [
            "/admin/waitlist",
            fr ? "Administration de la waitlist" : "Waitlist administration",
            fr
              ? "Consultez les inscriptions finalisées et les réponses déclarées."
              : "Review completed registrations and self-reported answers.",
          ],
        ]
      : []),
  ];
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
          <p className="workspace-eyebrow">{fr ? "VOTRE TROC" : "YOUR TROC"}</p>
          <h1>
            {settings
              ? fr
                ? "Vos préférences"
                : "Your preferences"
              : (fr ? "Bonjour, " : "Welcome back, ") +
                (user.displayName || user.email)}
          </h1>
          <p>
            {settings
              ? fr
                ? "Choisissez votre langue et votre apparence."
                : "Choose your language and appearance."
              : fr
                ? "Un compte pour acheter, et les bons outils lorsque vous vendez."
                : "One account for buying, with the right tools when you sell."}
          </p>
          <span className="workspace-badge">
            {user.roles?.includes("admin")
              ? "Admin"
              : isSeller(user)
                ? fr
                  ? "Acheteur et vendeur"
                  : "Buyer & seller"
                : fr
                  ? "Acheteur"
                  : "Buyer"}
          </span>
        </div>
        {settings ? (
          <section className="workspace-panel">
            <h2>{fr ? "Langue et apparence" : "Language & appearance"}</h2>
            <fieldset>
              <legend>{fr ? "Langue" : "Language"}</legend>
              <div className="workspace-actions">
                <Button
                  variant={locale === "en" ? "primary" : "secondary"}
                  aria-pressed={locale === "en"}
                  disabled={saving}
                  onClick={() => setLocale("en")}
                >
                  English
                </Button>
                <Button
                  variant={locale === "fr" ? "primary" : "secondary"}
                  aria-pressed={locale === "fr"}
                  disabled={saving}
                  onClick={() => setLocale("fr")}
                >
                  Français
                </Button>
              </div>
            </fieldset>
            <fieldset>
              <legend>{fr ? "Apparence" : "Appearance"}</legend>
              <div className="workspace-actions">
                <Button
                  variant={theme === "light" ? "primary" : "secondary"}
                  aria-pressed={theme === "light"}
                  disabled={saving}
                  onClick={() => setTheme("light")}
                >
                  {fr ? "Clair" : "Light"}
                </Button>
                <Button
                  variant={theme === "dark" ? "primary" : "secondary"}
                  aria-pressed={theme === "dark"}
                  disabled={saving}
                  onClick={() => setTheme("dark")}
                >
                  {fr ? "Sombre" : "Dark"}
                </Button>
              </div>
            </fieldset>
            <Button
              disabled={saving}
              onClick={async () => {
                setSaving(true);
                setStatus("");
                try {
                  await api("/account/preferences", "PATCH", { locale, theme });
                  setStatus(
                    fr ? "Préférences enregistrées." : "Preferences saved.",
                  );
                  reload();
                } catch {
                  setStatus(
                    fr
                      ? "Enregistrement impossible. Vos choix restent sur cet appareil."
                      : "Could not save. Your choices remain on this device.",
                  );
                } finally {
                  setSaving(false);
                }
              }}
            >
              {saving
                ? fr
                  ? "Enregistrement…"
                  : "Saving…"
                : fr
                  ? "Enregistrer sur mon compte"
                  : "Save to my account"}
            </Button>
            <p role="status">{status}</p>
            <div className="workspace-note">
              {fr
                ? "La gestion des adresses, de la sécurité et des sessions sera ajoutée dans des sections distinctes."
                : "Address, security and session management will be added in separate sections."}
            </div>
          </section>
        ) : (
          <>
            <div className="workspace-cards">
              {links.map(([url, title, description]) => (
                <a
                  className="workspace-card"
                  href={url + "?lang=" + locale}
                  key={url}
                >
                  <h2>
                    {title}
                    <span aria-hidden="true"> ↗</span>
                  </h2>
                  <p>{description}</p>
                </a>
              ))}
            </div>
          </>
        )}
        <TeamInvitationsPanel key={user.id} />
        <section id="early-access" className="workspace-panel scroll-mt-48">
          <AccountWaitlist locale={locale} />
        </section>
        <details className="workspace-details">
          <summary>{fr ? "Identité du compte" : "Account identity"}</summary>
          <p>{user.email}</p>
          <p>
            {fr ? "Identifiant" : "ID"} : <code>{user.id}</code>
          </p>
        </details>
      </main>
      <MarketplaceFooter locale={locale} />
    </div>
  );
}
