import { useState } from "react";
import { createRoot } from "react-dom/client";
import { GoogleSignInPresentation } from "../GoogleSignInPresentation";
import { SignInLayout } from "../../sign-in-presentation/SignInLayout";
import { Button } from "@workspace/troc-design-system/components/ui/button";
import { Input } from "@workspace/troc-design-system/components/ui/input";
import { TrocLogo } from "@workspace/troc-design-system/components/ui/logo";
import "@workspace/troc-design-system/styles.css";
import "./harness.css";
function Harness() {
  const params = new URLSearchParams(location.search),
    locale = params.get("lang") === "fr" ? "fr" : "en",
    fr = locale === "fr";
  const [enabled, setEnabled] = useState<boolean | null>(true),
    [confirmed, setConfirmed] = useState(false),
    [busy, setBusy] = useState(false),
    [status, setStatus] = useState(""),
    [starts, setStarts] = useState(0);
  document.documentElement.className =
    params.get("theme") === "light" ? "light" : "dark";
  document.documentElement.lang = locale;
  const labels = {
    action: fr ? "Continuer avec Google" : "Continue with Google",
    canada: fr ? "Je réside au Canada." : "I live in Canada.",
    loading: fr ? "Chargement…" : "Loading…",
    unavailable: fr
      ? "La connexion Google n’est pas disponible actuellement."
      : "Google sign-in is currently unavailable.",
  };
  return (
    <>
      <header className="google-harness-header">
        <TrocLogo />
        <p>
          {fr
            ? "Banc d’essai visuel · aucune authentification réelle"
            : "Presentation harness · no real authentication"}
        </p>
      </header>
      <SignInLayout locale={locale} busy={busy}>
        {busy && <p role="status">{labels.loading}</p>}
        {status && <p role="status">{status}</p>}
        <form
          className="google-harness-email"
          onSubmit={(event) => {
            event.preventDefault();
            setStatus(
              fr
                ? "Formulaire de démonstration uniquement."
                : "Demonstration form only.",
            );
          }}
        >
          <label>
            {fr ? "Courriel" : "Email"}
            <Input name="email" type="email" disabled={busy} />
          </label>
          <label>
            {fr ? "Mot de passe" : "Password"}
            <Input name="password" type="password" disabled={busy} />
          </label>
          <Button type="submit" disabled={busy}>
            {fr ? "Connexion" : "Sign in"}
          </Button>
        </form>
        <GoogleSignInPresentation
          locale={locale}
          enabled={enabled}
          confirmed={confirmed}
          busy={busy}
          labels={labels}
          onConfirmedChange={setConfirmed}
          onStart={() => {
            setStarts((value) => value + 1);
            setBusy(true);
            setStatus("");
          }}
        />
        <aside
          className="google-harness-scenarios"
          aria-label={fr ? "Scénarios du banc d’essai" : "Harness scenarios"}
        >
          <p>
            {fr
              ? "États simulés; aucune requête OAuth."
              : "Simulated states; no OAuth requests."}
          </p>
          <div>
            {["available", "checking", "unavailable", "busy", "error"].map(
              (state) => (
                <Button
                  key={state}
                  type="button"
                  variant="secondary"
                  size="sm"
                  onClick={() => {
                    setBusy(state === "busy");
                    setEnabled(
                      state === "checking" ? null : state !== "unavailable",
                    );
                    setStatus(
                      state === "error"
                        ? fr
                          ? "La connexion Google n’a pas abouti. Réessayez ou utilisez votre courriel et votre mot de passe."
                          : "Google sign-in did not finish. Please try again or use your email and password."
                        : "",
                    );
                  }}
                >
                  {state}
                </Button>
              ),
            )}
          </div>
          <output data-starts>{starts}</output>
        </aside>
      </SignInLayout>
    </>
  );
}
createRoot(document.getElementById("root")!).render(<Harness />);
