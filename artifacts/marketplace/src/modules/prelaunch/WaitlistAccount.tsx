import { useEffect, useRef, useState, type FormEvent } from "react";
import { Button } from "@workspace/troc-design-system/components/ui/button";
import { Input } from "@workspace/troc-design-system/components/ui/input";
import { GoogleSignIn } from "../account/GoogleSignIn";
import { onboardingRequest } from "./draft-api";
export function WaitlistAccount({
  locale,
  onReady,
  totalSteps,
  onBack,
  awaitingEmail = false,
}: {
  locale: "en" | "fr";
  onReady: () => void;
  totalSteps: number;
  onBack: () => void;
  awaitingEmail?: boolean;
}) {
  const c = (en: string, fr: string) => (locale === "fr" ? fr : en);
  const [email, setEmail] = useState(""),
    [password, setPassword] = useState(""),
    [visible, setVisible] = useState(false);
  const [busy, setBusy] = useState(false),
    [error, setError] = useState(""),
    [checkEmail, setCheckEmail] = useState(awaitingEmail),
    [user, setUser] = useState<{ email: string } | null>(null),
    [checking, setChecking] = useState(true),
    [cooldown, setCooldown] = useState(0);
  const locked = useRef(false);
  useEffect(() => {
    let active = true;
    onboardingRequest("account")
      .then((v) => {
        if (active && v?.id && v.email) setUser(v);
      })
      .catch(() => {})
      .finally(() => {
        if (active) setChecking(false);
      });
    return () => {
      active = false;
    };
  }, []);
  useEffect(() => {
    if (!cooldown) return;
    const timer = setTimeout(() => setCooldown((v) => v - 1), 1000);
    return () => clearTimeout(timer);
  }, [cooldown]);
  async function finish() {
    if (locked.current) return;
    locked.current = true;
    setBusy(true);
    setError("");
    try {
      const result = await onboardingRequest("onboarding/finalize", "POST", {});
      if (result.completed !== true || result.status!=="waitlisted") throw Error();
      onReady();
    } catch (e) {
      setError(e instanceof Error ? e.message : "unavailable");
    } finally {
      locked.current = false;
      setBusy(false);
    }
  }
  async function submit(e: FormEvent) {
    e.preventDefault();
    if (locked.current) return;
    locked.current = true;
    setBusy(true);
    setError("");
    try {
      const result = await onboardingRequest("auth/sign-up", "POST", {
        email: email.trim(),
        password,
        country: "CA",
        canadaConfirmed: true,
        onboarding: true,
      });
      if (result.code !== "check_email") throw Error();
      setPassword("");
      setCheckEmail(true);
      setCooldown(60);
    } catch (e) {
      setError(e instanceof Error ? e.message : "unavailable");
    } finally {
      locked.current = false;
      setBusy(false);
    }
  }
  const signin =
    import.meta.env.BASE_URL +
    "sign-in?lang=" +
    locale +
    "&returnTo=%2Fearly-access";
  return (
    <section className="wl-account wl-form" aria-labelledby="wl-account-title">
      <div className="wl-progress">
        <span>
          {c("Step", "Étape")} {totalSteps} / {totalSteps}
        </span>
        <span>{c("Your account", "Votre compte")}</span>
        <progress
          max={totalSteps}
          value={totalSteps}
          aria-label={c("Form progress", "Progression")}
        />
      </div>
      <h2 id="wl-account-title">
        {c("Your answers. Your account.", "Vos réponses. Votre compte.")}
      </h2>
      <p>
        {c(
          "Your answers are saved in this browser’s private draft for seven days. Finish creating your account to join the waitlist.",
          "Vos réponses sont enregistrées dans un brouillon privé lié à ce navigateur pendant sept jours. Créez votre compte pour rejoindre la liste d’attente.",
        )}
      </p>
      {checking ? (
        <p role="status">
          {c("Checking your session…", "Vérification de votre session…")}
        </p>
      ) : user ? (
        <div className="grid gap-4">
          <p>
            {c(
              "Save these answers to",
              "Enregistrer ces réponses dans le compte",
            )}{" "}
            <strong>{user.email}</strong>
          </p>
          <Button
            className="wl-primary"
            disabled={busy}
            onClick={() => void finish()}
          >
            {busy
              ? c("Saving…", "Enregistrement…")
              : c("Confirm my registration", "Confirmer mon inscription")}
          </Button>
          <Button
            variant="ghost"
            disabled={busy}
            onClick={async () => {
              try {
                await onboardingRequest("auth/sign-out", "POST", {});
                setUser(null);
              } catch {
                setError("unavailable");
              }
            }}
          >
            {c("Use a different account", "Utiliser un autre compte")}
          </Button>
        </div>
      ) : checkEmail ? (
        <div className="grid gap-4">
          <h3>{c("Check your email", "Vérifiez vos courriels")}</h3>
          <p>
            {c(
              "If this address can be registered, a confirmation email is on its way. Open the link in this browser, then continue. Your answers remain saved. Already registered? Sign in instead.",
              "Si cette adresse peut être inscrite, un courriel de confirmation est en route. Ouvrez le lien dans ce navigateur, puis continuez. Vos réponses restent enregistrées. Déjà inscrit? Connectez-vous.",
            )}
          </p>
          {awaitingEmail && (
            <label>
              {c(
                "Email for resending · optional",
                "Courriel pour renvoyer · facultatif",
              )}
              <Input
                type="email"
                autoComplete="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </label>
          )}
          <a className="wl-primary" href={signin}>
            {c("Sign in & finish", "Connexion et finalisation")}
          </a>
          <Button
            variant="outline"
            disabled={busy || cooldown > 0 || !email}
            onClick={async () => {
              setBusy(true);
              try {
                await onboardingRequest("auth/resend", "POST", {
                  email,
                  locale,
                });
                setCooldown(60);
              } catch {
                setError("unavailable");
              } finally {
                setBusy(false);
              }
            }}
          >
            {cooldown
              ? c(
                  "Resend in " + cooldown + "s",
                  "Renvoyer dans " + cooldown + "s",
                )
              : c("Resend confirmation", "Renvoyer la confirmation")}
          </Button>
          <Button variant="ghost" onClick={() => setCheckEmail(false)}>
            {c("Change email", "Modifier le courriel")}
          </Button>
        </div>
      ) : (
        <>
          <GoogleSignIn
            locale={locale}
            busy={busy}
            setBusy={setBusy}
            report={() => setError("unavailable")}
            returnTo="/early-access"
            signup
          />
          <div className="wl-account-divider">
            <span>{c("or create with email", "ou créer par courriel")}</span>
          </div>
          <form className="wl-account-form" onSubmit={submit}>
            <label htmlFor="wl-account-email">{c("Email", "Courriel")}</label>
            <Input
              id="wl-account-email"
              type="email"
              autoComplete="email"
              required
              maxLength={254}
              disabled={busy}
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
            <label htmlFor="wl-account-password">
              {c("Password", "Mot de passe")}
            </label>
            <Input
              id="wl-account-password"
              type={visible ? "text" : "password"}
              autoComplete="new-password"
              minLength={8}
              maxLength={128}
              required
              disabled={busy}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              aria-describedby="wl-password-hint"
            />
            <div className="wl-password-tools">
              <small id="wl-password-hint">
                {c(
                  "8–128 characters. Use a unique passphrase.",
                  "8 à 128 caractères. Utilisez une phrase secrète unique.",
                )}
              </small>
              <Button
                type="button"
                variant="ghost"
                aria-pressed={visible}
                onClick={() => setVisible((v) => !v)}
              >
                {visible ? c("Hide", "Masquer") : c("Show", "Afficher")}
              </Button>
            </div>
            <Button type="submit" className="wl-primary" disabled={busy}>
              {busy
                ? c("Creating account…", "Création du compte…")
                : c("Create my account", "Créer mon compte")}
            </Button>
          </form>
          <p className="signin-register">
            <span>{c("Already have an account?", "Déjà un compte?")}</span>
            <a className="underline" href={signin}>
              {c("Sign in", "Se connecter")}
            </a>
          </p>
        </>
      )}
      {error && (
        <p role="alert" className="wl-error">
          {error === "profile_exists"
            ? c(
                "This account already has a waitlist profile. Open your account to edit it; your draft has not replaced it.",
                "Ce compte possède déjà un profil d’attente. Modifiez-le depuis votre compte; ce brouillon ne l’a pas remplacé.",
              )
            : c(
                "We could not finish. Your saved answers are still here. Try again; if you registered before, sign in.",
                "Impossible de terminer. Vos réponses enregistrées sont conservées. Réessayez ou connectez-vous si vous êtes déjà inscrit.",
              )}
        </p>
      )}
      {error === "profile_exists" && (
        <a href={import.meta.env.BASE_URL + "account?lang=" + locale}>
          {c("Open my account", "Accéder à mon compte")}
        </a>
      )}
      <Button variant="ghost" disabled={busy} onClick={onBack}>
        {c("Back to my answers", "Revoir mes réponses")}
      </Button>
    </section>
  );
}
