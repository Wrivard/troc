import { useEffect, useRef, useState, type FormEvent } from "react";
import { Button } from "@workspace/troc-design-system/components/ui/button";
import { Input } from "@workspace/troc-design-system/components/ui/input";
import { api } from "../../api";
export function PasswordRecovery({
  locale,
  onClose,
}: {
  locale: "en" | "fr";
  onClose: () => void;
}) {
  const c = (en: string, fr: string) => (locale === "fr" ? fr : en);
  const [email, setEmail] = useState(""),
    [token, setToken] = useState(""),
    [password, setPassword] = useState("");
  const [sent, setSent] = useState(false),
    [done, setDone] = useState(false),
    [busy, setBusy] = useState(false),
    [error, setError] = useState(false);
  const title = useRef<HTMLHeadingElement>(null);
  useEffect(() => {
    title.current?.focus();
  }, []);
  const lock = useRef(false);
  async function submit(e: FormEvent) {
    e.preventDefault();
    if (lock.current) return;
    lock.current = true;
    setBusy(true);
    setError(false);
    try {
      if (sent) {
        await api("/auth/recovery/finish", "POST", { email, token, password });
        setPassword("");
        setDone(true);
      } else {
        await api("/auth/recovery/start", "POST", { email });
        setSent(true);
      }
    } catch {
      setError(true);
    } finally {
      lock.current = false;
      setBusy(false);
    }
  }
  return (
    <section className="grid gap-4" aria-labelledby="recovery-title">
      <h2 id="recovery-title" ref={title} tabIndex={-1}>
        {c("Reset your password", "Réinitialiser votre mot de passe")}
      </h2>
      {done ? (
        <p role="status">
          {c(
            "Your password has been updated. Sign in with your new password.",
            "Votre mot de passe a été modifié. Connectez-vous avec le nouveau.",
          )}
        </p>
      ) : (
        <form onSubmit={submit} className="grid gap-4">
          <p>
            {sent
              ? c(
                  "If this address has an account, check your email for the recovery code. Enter it here. Your saved signup answers are unaffected.",
                  "Si cette adresse possède un compte, consultez le code reçu par courriel. Saisissez-le ici. Votre brouillon d’inscription est conservé.",
                )
              : c(
                  "Enter your account email to receive a recovery code.",
                  "Indiquez le courriel de votre compte pour recevoir un code de récupération.",
                )}
          </p>
          <label>
            {c("Email", "Courriel")}
            <Input
              type="email"
              autoComplete="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              maxLength={254}
              disabled={busy || sent}
            />
          </label>
          {sent && (
            <>
              <label>
                {c("Recovery code", "Code de récupération")}
                <Input
                  value={token}
                  onChange={(e) => setToken(e.target.value)}
                  required
                  inputMode="numeric"
                  autoComplete="one-time-code"
                  pattern="[0-9]{6,10}"
                  maxLength={10}
                />
              </label>
              <label>
                {c(
                  "New password · 8–128 characters",
                  "Nouveau mot de passe · 8 à 128 caractères",
                )}
                <Input
                  type="password"
                  autoComplete="new-password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  minLength={8}
                  maxLength={128}
                />
              </label>
            </>
          )}
          <Button disabled={busy} type="submit">
            {busy
              ? c("Please wait…", "Un instant…")
              : sent
                ? c("Update password", "Modifier le mot de passe")
                : c("Send recovery code", "Envoyer le code")}
          </Button>
          {sent && (
            <Button
              variant="ghost"
              type="button"
              disabled={busy}
              onClick={() => {
                setSent(false);
                setToken("");
                setPassword("");
              }}
            >
              {c(
                "Change email or request a new code",
                "Changer le courriel ou demander un nouveau code",
              )}
            </Button>
          )}
        </form>
      )}
      {error && (
        <p role="alert">
          {c(
            "We couldn’t complete this request. Check the code or try again later.",
            "Impossible de terminer. Vérifiez le code ou réessayez plus tard.",
          )}
        </p>
      )}
      <Button variant="ghost" disabled={busy} onClick={onClose}>
        {c("Back to sign in", "Retour à la connexion")}
      </Button>
    </section>
  );
}
