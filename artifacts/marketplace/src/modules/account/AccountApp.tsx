import { useEffect, useState, type FormEvent } from "react";
import { Button } from "@workspace/troc-design-system/components/ui/button";
import { Input } from "@workspace/troc-design-system/components/ui/input";
import { Checkbox } from "@workspace/troc-design-system/components/ui/selection-controls";
import { TrocLogo } from "@workspace/troc-design-system/components/ui/logo";
import { LocaleSwitcher } from "@workspace/troc-design-system/components/ui/locale-switcher";
import { ThemeSwitcher } from "@workspace/troc-design-system/components/ui/theme-switcher";
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
      <header className="flex flex-wrap items-center justify-between gap-4 border-b border-border p-6">
        <a href={link("style-guide")} aria-label="TROC">
          <TrocLogo />
        </a>
        <div className="flex flex-wrap items-center gap-4">
          <LocaleSwitcher
            value={locale}
            onValueChange={setLocale}
            groupLabel={t("language")}
            options={[
              { value: "en", code: "EN", label: "English" },
              { value: "fr", code: "FR", label: "Français" },
            ]}
          />
          <ThemeSwitcher
            value={theme}
            onValueChange={setTheme}
            groupLabel={t("theme")}
            options={[
              { value: "dark", label: "TROC Dark" },
              { value: "light", label: "TROC Light" },
            ]}
            iconOnly
          />
        </div>
      </header>
      <main className="mx-auto grid w-full max-w-lg gap-6 p-6" aria-busy={busy}>
        <h1 className="text-2xl font-bold">
          {t(
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
        </h1>
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
                aria-describedby="password-hint"
              />
            </label>
            <p id="password-hint">{t("passwordHint")}</p>
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
              href={link(signup ? "sign-in" : "sign-up")}
            >
              {t(signup ? "signIn" : "signUp")}
            </a>
          </form>
        )}
        {user && (
          <>
            <p className="break-words">{user.email}</p>
            <Button onClick={save} disabled={busy}>
              {t("save")}
            </Button>
            <a className="underline" href={link("account/settings")}>
              {t("settings")}
            </a>
            <Button variant="secondary" onClick={signOut} disabled={busy}>
              {t("signOut")}
            </Button>
          </>
        )}
        {protectedPage && !user && !busy && (
          <a className="underline" href={link("sign-in")}>
            {t("signIn")}
          </a>
        )}
        <a className="underline" href={link("style-guide")}>
          {t("guide")}
        </a>
      </main>
    </div>
  );
}
