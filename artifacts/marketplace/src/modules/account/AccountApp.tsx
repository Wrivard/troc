import { AccountDashboard } from "./AccountDashboard";
import { PasswordRecovery } from "./PasswordRecovery";
import { AccountWaitlist } from "./AccountWaitlist";
import "./sign-in-presentation/sign-in-reference.css";
import { SignInLayout } from "./sign-in-presentation/SignInLayout";
import { WaitlistOnboarding } from "../prelaunch/WaitlistOnboarding";
import { GoogleSignIn } from "./GoogleSignIn";
import { TrocLogo } from "@workspace/troc-design-system/components/ui/logo";
import { EditorialIntro } from "@workspace/troc-design-system/components/ui/editorial";
import { MarketplaceHeader, MarketplaceFooter } from "../brand/SiteChrome";
import { useEffect, useRef, useState, type FormEvent } from "react";
import { Button } from "@workspace/troc-design-system/components/ui/button";
import { Input } from "@workspace/troc-design-system/components/ui/input";
import { LocaleSwitcher } from "@workspace/troc-design-system/components/ui/locale-switcher";
import { ThemeSwitcher } from "@workspace/troc-design-system/components/ui/theme-switcher";
import { Checkbox } from "@workspace/troc-design-system/components/ui/selection-controls";
import { usePreferences } from "@workspace/troc-design-system/hooks/use-preferences";
import { messages, type MessageKey } from "../../messages";
import { api } from "../../api";
type Account = {
  roles?: string[];
  memberships?: { sellerId: string; active: boolean }[];
  id: string;
  email: string;
  locale: "en" | "fr";
  theme: "dark" | "light";
};
export function AccountApp({ path }: { path: string }) {
  if (path === "/account" || path === "/account/settings")
    return <AccountDashboard path={path} />;
  return path === "/sign-up" ? (
    <WaitlistOnboarding path={path} />
  ) : (
    <AccountPage path={path} />
  );
}
function AccountPage({ path }: { path: string }) {
  const { locale, setLocale, theme, setTheme } = usePreferences();
  const t = (key: MessageKey) => messages[key][locale === "en" ? 0 : 1];
  const link = (route: string) => `${import.meta.env.BASE_URL}${route}`;
  const [status, setStatus] = useState<MessageKey | null>(null);
  const [busy, setBusy] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [recovering, setRecovering] = useState(false);
  const recoveryTrigger = useRef<HTMLButtonElement>(null);
  const submitLock = useRef(false);
  const oauthFailure =
    typeof window !== "undefined" &&
    new URLSearchParams(window.location.search).has("authError");
  const [user, setUser] = useState<Account | null>(null);
  const currentPreferences = useRef({ locale, theme });
  useEffect(() => {
    currentPreferences.current = { locale, theme };
  }, [locale, theme]);
  const changeLocale = (next: Account["locale"]) => {
    currentPreferences.current = {
      ...currentPreferences.current,
      locale: next,
    };
    setLocale(next);
    if (status === "saved" && next !== locale) setStatus(null);
  };
  const changeTheme = (next: Account["theme"]) => {
    currentPreferences.current = { ...currentPreferences.current, theme: next };
    setTheme(next);
    if (status === "saved" && next !== theme) setStatus(null);
  };
  const signup = path === "/sign-up";
  const protectedPage = path === "/account" || path === "/account/settings";
  const known = protectedPage || signup || path === "/sign-in";
  const report = (error: unknown) =>
    setStatus(
      error instanceof Error && error.message in messages
        ? (error.message as MessageKey)
        : "service_unavailable",
    );
  useEffect(() => {
    if (!protectedPage) return;
    let active = true;
    setBusy(true);
    api<Account>("/account")
      .then((value) => {
        if (!active) return;
        setUser(value);
        // Explicit device preferences win; saved account defaults apply on a new device.
        try {
          if (!localStorage.getItem("troc.locale")) setLocale(value.locale);
          if (!localStorage.getItem("troc.theme")) setTheme(value.theme);
        } catch {
          /* Session preferences continue when storage is unavailable. */
        }
      })
      .catch((error) => {
        if (active) report(error);
      })
      .finally(() => {
        if (active) setBusy(false);
      });
    return () => {
      active = false;
    };
  }, [protectedPage]);
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (submitLock.current) return;
    submitLock.current = true;
    setBusy(true);
    setStatus(null);
    const values = new FormData(event.currentTarget);
    try {
      await api(`/auth/${signup ? "sign-up" : "sign-in"}`, "POST", {
        email: values.get("email"),
        password: values.get("password"),
        country: "CA",
        canadaConfirmed: values.get("canada") === "on",
      });
      if (signup) setStatus("check_email");
      else {
        const requested =
          new URLSearchParams(window.location.search).get("returnTo") ||
          "/account";
        const safe =
          /^\/(?:account(?:\/(?:settings|orders(?:\/[a-f0-9-]{36})?))?|seller\/(?:dashboard|inventory|team|orders(?:\/[a-f0-9-]{36})?)|admin\/(?:waitlist|seller-applications)|early-access|cart|checkout|smart-cart|store[/][a-z0-9][a-z0-9-]{0,119})$/.test(
            requested,
          )
            ? requested
            : "/account";
        window.location.assign(safe + "?lang=" + locale);
      }
    } catch (error) {
      report(error);
    } finally {
      submitLock.current = false;
      setBusy(false);
    }
  }
  async function save() {
    setBusy(true);
    setStatus(null);
    try {
      const submitted = { locale, theme };
      await api("/account/preferences", "PATCH", submitted);
      if (
        currentPreferences.current.locale === submitted.locale &&
        currentPreferences.current.theme === submitted.theme
      )
        setStatus("saved");
    } catch (error) {
      report(error);
    } finally {
      setBusy(false);
    }
  }
  async function signOut() {
    setBusy(true);
    try {
      await api("/auth/sign-out", "POST");
      window.location.assign(link("sign-in"));
    } catch (error) {
      report(error);
      setBusy(false);
    }
  }
  const authContent = (
    <>
      {oauthFailure && (
        <p role="alert">
          {locale === "fr"
            ? "L’authentification n’a pas abouti ou le lien a expiré. Réessayez. Si vous découvrez TROC, créez votre compte. Vos réponses enregistrées sont conservées."
            : "Authentication did not finish or the link expired. Retry, or create your account if you’re new to TROC. Saved answers are preserved."}
        </p>
      )}
      {busy && <p role="status">{t("loading")}</p>}
      {status && <p role="status">{t(status)}</p>}
      {known && !protectedPage && (
        <GoogleSignIn
          locale={locale}
          busy={busy}
          setBusy={setBusy}
          report={report}
        />
      )}
      {known && !protectedPage && (
        <form onSubmit={submit} className="grid gap-4">
          {path === "/sign-in" && (
            <div className="signin-divider">
              <span>{locale === "fr" ? "ou" : "or"}</span>
            </div>
          )}
          <label className="grid gap-2">
            {t("email")}
            <Input
              name="email"
              placeholder="you@example.com"
              type="email"
              autoComplete="email"
              required
              maxLength={254}
            />
          </label>
          <div className="signin-password-field">
            <label htmlFor="signin-password">{t("password")}</label>
            <div className="signin-password-control">
              <Input
                id="signin-password"
                name="password"
                type={showPassword ? "text" : "password"}
                autoComplete={signup ? "new-password" : "current-password"}
                required
                minLength={8}
                maxLength={128}
                placeholder="••••••••"
                aria-describedby={signup ? "password-hint" : undefined}
              />
              <Button
                type="button"
                variant="ghost"
                className="signin-reveal"
                aria-pressed={showPassword}
                aria-label={
                  locale === "fr"
                    ? showPassword
                      ? "Masquer le mot de passe"
                      : "Afficher le mot de passe"
                    : showPassword
                      ? "Hide password"
                      : "Show password"
                }
                onClick={() => setShowPassword((value) => !value)}
              >
                <svg
                  width="18"
                  height="18"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.6"
                  aria-hidden="true"
                >
                  <path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7S2 12 2 12Z" />
                  <circle cx="12" cy="12" r="3" />
                  {showPassword && <path d="m3 3 18 18" />}
                </svg>
              </Button>
            </div>
          </div>
          {signup && <p id="password-hint">{t("passwordHint")}</p>}
          {signup && (
            <>
              <p>{t("country")}</p>
              <label className="flex items-center gap-2">
                <Checkbox required name="canada" />
                {t("canadaConfirm")}
              </label>
            </>
          )}
          <Button type="submit" disabled={busy}>
            {t(signup ? "signUp" : "signIn")}
          </Button>
          {path === "/sign-in" && (
            <Button
              type="button"
              variant="ghost"
              disabled={busy}
              ref={recoveryTrigger}
              onClick={() => setRecovering(true)}
            >
              {locale === "fr" ? "Mot de passe oublié?" : "Forgot password?"}
            </Button>
          )}
          <div className="signin-register">
            {path === "/sign-in" && (
              <span className="signin-register-prompt">
                {locale === "fr"
                  ? "Pas encore de compte?"
                  : "Don’t have an account?"}
              </span>
            )}
            <a
              className="underline"
              href={`${link(signup ? "sign-in" : "sign-up")}?lang=${locale}`}
            >
              {t(signup ? "signIn" : "signUp")}
            </a>
          </div>
        </form>
      )}
    </>
  );
  if (path === "/sign-in")
    return (
      <div className="wl-site min-h-screen bg-background text-foreground">
        <MarketplaceHeader
          locale={locale}
          theme={theme}
          onLocale={changeLocale}
          onTheme={changeTheme}
        />
        <div className="wl-page signin-reference" data-stage="sign-in">
          <SignInLayout
            locale={locale}
            busy={busy}
            copy={{
              heading:
                locale === "fr" ? "Heureux de vous revoir" : "Welcome back",
              support:
                locale === "fr"
                  ? ["Connectez-vous à votre compte.", ""]
                  : ["Sign in to your account", ""],
            }}
          >
            <div className="wl-form wl-login">
              {recovering ? (
                <PasswordRecovery
                  locale={locale}
                  onClose={() => {
                    setRecovering(false);
                    requestAnimationFrame(() =>
                      recoveryTrigger.current?.focus(),
                    );
                  }}
                />
              ) : (
                authContent
              )}
            </div>
          </SignInLayout>
        </div>
        <MarketplaceFooter locale={locale} />
      </div>
    );
  return (
    <div className="min-h-screen bg-background text-foreground">
      <MarketplaceHeader
        locale={locale}
        theme={theme}
        onLocale={changeLocale}
        onTheme={changeTheme}
      />

      <main id="main-content" className="troc-auth-layout" aria-busy={busy}>
        <div className="troc-auth-form">
          <EditorialIntro
            level={1}
            compact
            className="troc-page-opening"
            eyebrow="TROC · CANADA"
            title={t(
              !known
                ? "notFound"
                : protectedPage
                  ? path.endsWith("settings")
                    ? "settings"
                    : "account"
                  : signup
                    ? "signUp"
                    : "signIn",
            )}
            description={
              locale === "fr"
                ? protectedPage
                  ? "Vos commandes, vos préférences et votre place dans la communauté TROC."
                  : "Retrouvez vos cartes et vos commandes. Un compte pour votre passion."
                : protectedPage
                  ? "Your orders, your preferences and your place in the TROC community."
                  : "Keep your cards and orders together. One account for your hobby."
            }
          />
          {authContent}
          {user && (
            <div className="grid gap-6">
              <div id="early-access">
                <AccountWaitlist locale={locale} />
              </div>
              <nav
                className="flex flex-wrap items-center gap-4"
                aria-label={
                  locale === "fr"
                    ? "Destinations du compte"
                    : "Account destinations"
                }
              >
                <Button
                  asChild
                  variant={path.endsWith("settings") ? "secondary" : "primary"}
                >
                  <a href={`${link("account/orders")}?lang=${locale}`}>
                    {locale === "fr" ? "Vos commandes" : "Your orders"}
                  </a>
                </Button>
                <a
                  className="underline"
                  href={`${link(path.endsWith("settings") ? "account" : "account/settings")}?lang=${locale}`}
                >
                  {path.endsWith("settings") ? t("account") : t("settings")}
                </a>
                {(user.roles?.includes("admin") ||
                  user.memberships?.some((m) => m.active)) && (
                  <a
                    className="underline"
                    href={"/seller/dashboard?lang=" + locale}
                  >
                    {locale === "fr" ? "Espace vendeur" : "Seller workspace"}
                  </a>
                )}
                {user.roles?.includes("admin") && (
                  <a
                    className="underline"
                    href={"/admin/seller-applications?lang=" + locale}
                  >
                    Administration
                  </a>
                )}
              </nav>
              <section
                className="grid gap-4"
                aria-labelledby="account-preferences-title"
              >
                <h2
                  id="account-preferences-title"
                  className="text-lg font-semibold"
                >
                  {locale === "fr" ? "Vos préférences" : "Your preferences"}
                </h2>
                <p className="text-sm text-muted-foreground">
                  {locale === "fr"
                    ? "Ces choix s’appliquent à cet appareil. Enregistrez-les aussi dans votre compte."
                    : "These choices apply on this device. Save them to your account as well."}
                </p>
                <fieldset className="grid gap-2">
                  <legend className="mb-2 text-sm font-medium">
                    {locale === "fr" ? "Langue" : "Language"}
                  </legend>
                  <LocaleSwitcher
                    value={locale}
                    onValueChange={changeLocale}
                    disabled={busy}
                    groupLabel={
                      locale === "fr" ? "Langue du compte" : "Account language"
                    }
                    options={[
                      { value: "en", code: "EN", label: "English" },
                      { value: "fr", code: "FR", label: "Français" },
                    ]}
                  />
                </fieldset>
                <fieldset className="grid gap-2">
                  <legend className="mb-2 text-sm font-medium">
                    {locale === "fr" ? "Apparence" : "Appearance"}
                  </legend>
                  <ThemeSwitcher
                    value={theme}
                    onValueChange={changeTheme}
                    disabled={busy}
                    groupLabel={
                      locale === "fr"
                        ? "Apparence du compte"
                        : "Account appearance"
                    }
                    options={[
                      {
                        value: "light",
                        label: locale === "fr" ? "Clair" : "Light",
                      },
                      {
                        value: "dark",
                        label: locale === "fr" ? "Sombre" : "Dark",
                      },
                    ]}
                  />
                </fieldset>
                <Button
                  variant={path.endsWith("settings") ? "primary" : "secondary"}
                  onClick={save}
                  disabled={busy}
                >
                  {t("save")}
                </Button>
              </section>
              <section
                className="grid gap-4 border-t border-border pt-4"
                aria-labelledby="account-details-title"
              >
                <h2
                  id="account-details-title"
                  className="text-lg font-semibold"
                >
                  {locale === "fr" ? "Détails du compte" : "Account details"}
                </h2>
                <p className="break-words">{user.email}</p>
                <label className="grid gap-2">
                  {locale === "fr" ? "Identifiant du compte" : "Account ID"}
                  <Input readOnly value={user.id} autoComplete="off" />
                </label>
                <Button variant="secondary" onClick={signOut} disabled={busy}>
                  {t("signOut")}
                </Button>
              </section>
            </div>
          )}
          {protectedPage && !user && !busy && (
            <a className="underline" href={link("sign-in")}>
              {t("signIn")}
            </a>
          )}
        </div>
        <aside className="troc-auth-aside">
          <div className="troc-auth-art" aria-hidden="true">
            <span className="troc-card-back" />
            <span className="troc-card-back">
              <TrocLogo variant="compact" height={32} />
            </span>
            <span className="troc-card-back" />
          </div>
          <h2>
            {locale === "fr"
              ? "Votre passion. Un seul compte."
              : "Your hobby. One account."}
          </h2>
          <p>
            {locale === "fr"
              ? "Vos commandes aujourd’hui. Votre collection et vos vendeurs favoris dans les outils à venir."
              : "Your orders today. Your collection and favourite sellers in the tools to come."}
          </p>
        </aside>
      </main>
      <MarketplaceFooter locale={locale} />
    </div>
  );
}


