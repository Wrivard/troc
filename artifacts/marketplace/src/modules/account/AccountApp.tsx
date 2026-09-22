import { TrocLogo } from "@workspace/troc-design-system/components/ui/logo";
import { EditorialIntro } from "@workspace/troc-design-system/components/ui/editorial";
import { MarketplaceHeader, MarketplaceFooter } from "../brand/SiteChrome";
import { useEffect, useState, type FormEvent } from "react";
import { Button } from "@workspace/troc-design-system/components/ui/button";
import { Input } from "@workspace/troc-design-system/components/ui/input";
import { LocaleSwitcher } from "@workspace/troc-design-system/components/ui/locale-switcher";
import { ThemeSwitcher } from "@workspace/troc-design-system/components/ui/theme-switcher";
import { Checkbox } from "@workspace/troc-design-system/components/ui/selection-controls";
import { usePreferences } from "@workspace/troc-design-system/hooks/use-preferences";
import { messages, type MessageKey } from "../../messages";
import { api } from "../../api";
type Account = {
  id: string;
  email: string;
  locale: "en" | "fr";
  theme: "dark" | "light";
};
export function AccountApp({ path }: { path: string }) {
  const { locale, setLocale, theme, setTheme } = usePreferences();
  const t = (key: MessageKey) => messages[key][locale === "en" ? 0 : 1];
  const link = (route: string) => `${import.meta.env.BASE_URL}${route}`;
  const [status, setStatus] = useState<MessageKey | null>(null);
  const [busy, setBusy] = useState(false);
  const [user, setUser] = useState<Account | null>(null);
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
      else window.location.assign(link("account"));
    } catch (error) {
      report(error);
    } finally {
      setBusy(false);
    }
  }
  async function save() {
    setBusy(true);
    setStatus(null);
    try {
      await api("/account/preferences", "PATCH", { locale, theme });
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
  return (
    <div className="min-h-screen bg-background text-foreground">
      <MarketplaceHeader
        locale={locale}
        theme={theme}
        onLocale={setLocale}
        onTheme={setTheme}
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
          {busy && <p role="status">{t("loading")}</p>}
          {status && <p role="status">{t(status)}</p>}
          {known && !protectedPage && (
            <form onSubmit={submit} className="grid gap-4">
              <label className="grid gap-2">
                {t("email")}
                <Input
                  name="email"
                  type="email"
                  autoComplete="email"
                  required
                  maxLength={254}
                />
              </label>
              <label className="grid gap-2">
                {t("password")}
                <Input
                  name="password"
                  type="password"
                  autoComplete={signup ? "new-password" : "current-password"}
                  required
                  minLength={8}
                  maxLength={128}
                  aria-describedby={signup ? "password-hint" : undefined}
                />
              </label>
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
              <a
                className="underline"
                href={`${link(signup ? "sign-in" : "sign-up")}?lang=${locale}`}
              >
                {t(signup ? "signIn" : "signUp")}
              </a>
            </form>
          )}
          {user && (
            <div className="grid gap-6">
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
                    onValueChange={setLocale}
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
                    onValueChange={setTheme}
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
