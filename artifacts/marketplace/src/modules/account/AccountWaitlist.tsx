import { useEffect, useState } from "react";
import { Button } from "@workspace/troc-design-system/components/ui/button";
import { onboardingRequest } from "../prelaunch/draft-api";
export function AccountWaitlist({ locale }: { locale: "en" | "fr" }) {
  const c = (en: string, fr: string) => (locale === "fr" ? fr : en);
  const [profile, setProfile] = useState<{
      status: string;
      payload: { intent: string };
    } | null>(null),
    [loading, setLoading] = useState(true),
    [busy, setBusy] = useState(false),
    [error, setError] = useState(false),
    [confirm, setConfirm] = useState(false),
    [reloadKey, setReloadKey] = useState(0);
  useEffect(() => {
    let active = true;
    setLoading(true);
    setError(false);
    setConfirm(false);
    onboardingRequest("onboarding/profile")
      .then((v) => {
        const value = v?.profile;
        if (
          value !== null &&
          (!value ||
            !["waitlisted", "withdrawn"].includes(value.status) ||
            !["buyer", "seller", "both"].includes(value.payload?.intent))
        )
          throw new Error("invalid_profile");
        if (active) setProfile(value);
      })
      .catch(() => {
        if (active) setError(true);
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, [reloadKey]);
  async function edit() {
    setBusy(true);
    try {
      await onboardingRequest("onboarding/edit", "POST", {});
      location.assign(import.meta.env.BASE_URL + "sign-up?lang=" + locale);
    } catch {
      setError(true);
      setBusy(false);
    }
  }
  return (
    <section className="grid gap-4 border-b border-border pb-6">
      <h2>{c("Your early access", "Votre accès anticipé")}</h2>
      {loading ? (
        <p role="status">
          {c("Loading your registration…", "Chargement de votre inscription…")}
        </p>
      ) : error ? (
        <div className="grid gap-3" role="alert">
          <p>
            {c(
              "We couldn’t confirm your registration status or latest change. Check its status before trying another action.",
              "Impossible de confirmer votre inscription ou la dernière modification. Vérifiez son statut avant de refaire une action.",
            )}
          </p>
          <Button
            variant="outline"
            onClick={() => setReloadKey((key) => key + 1)}
          >
            {c("Check registration status", "Vérifier mon inscription")}
          </Button>
        </div>
      ) : profile ? (
        <>
          <p>
            {profile.status === "withdrawn"
              ? c(
                  "You have withdrawn from the waitlist. Your account remains available.",
                  "Vous avez quitté la liste d’attente. Votre compte reste accessible.",
                )
              : c(
                  "You’re on the waitlist. Your account is available while we prepare launch.",
                  "Vous êtes sur la liste d’attente. Votre compte est accessible pendant la préparation du lancement.",
                )}
          </p>
          <p>
            {c("Interest: ", "Intérêt : ")}
            {
              (
                {
                  buyer: c("Buying", "Acheter"),
                  seller: c("Selling", "Vendre"),
                  both: c("Buying and selling", "Acheter et vendre"),
                } as Record<string, string>
              )[profile.payload.intent]
            }
          </p>
          <Button onClick={() => void edit()} disabled={busy}>
            {profile.status === "withdrawn"
              ? c("Rejoin the waitlist", "Rejoindre la liste d’attente")
              : c(
                  "Review my answers & preferences",
                  "Revoir mes réponses et préférences",
                )}
          </Button>
          {profile.status !== "withdrawn" &&
            (confirm ? (
              <div className="grid gap-2">
                <p>
                  {c(
                    "Leave the waitlist and stop its marketing updates? Your account will stay open.",
                    "Quitter la liste et arrêter ses nouvelles promotionnelles? Votre compte restera ouvert.",
                  )}
                </p>
                <Button
                  variant="outline"
                  disabled={busy}
                  onClick={async () => {
                    setBusy(true);
                    try {
                      await onboardingRequest(
                        "onboarding/withdraw",
                        "POST",
                        {},
                      );
                      setProfile({ ...profile, status: "withdrawn" });
                      setConfirm(false);
                    } catch {
                      setError(true);
                    } finally {
                      setBusy(false);
                    }
                  }}
                >
                  {c("Confirm withdrawal", "Confirmer le retrait")}
                </Button>
                <Button
                  variant="ghost"
                  disabled={busy}
                  onClick={() => setConfirm(false)}
                >
                  {c("Keep my registration", "Conserver mon inscription")}
                </Button>
              </div>
            ) : (
              <Button
                variant="ghost"
                disabled={busy}
                onClick={() => setConfirm(true)}
              >
                {c("Leave the waitlist", "Quitter la liste d’attente")}
              </Button>
            ))}
        </>
      ) : (
        <>
          <p>
            {c(
              "Your registration isn’t complete yet. Continue your saved answers to join the waitlist.",
              "Votre inscription n’est pas encore complète. Reprenez vos réponses pour rejoindre la liste d’attente.",
            )}
          </p>
          <a href={import.meta.env.BASE_URL + "sign-up?lang=" + locale}>
            {c("Continue registration", "Poursuivre l’inscription")}
          </a>
        </>
      )}
    </section>
  );
}
