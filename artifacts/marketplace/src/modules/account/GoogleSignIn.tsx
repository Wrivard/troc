import { useEffect, useRef, useState } from "react";
import { GoogleSignInPresentation } from "./google-sign-in-presentation/GoogleSignInPresentation";
import { api } from "../../api";
import { messages, type MessageKey } from "../../messages";
export function GoogleSignIn({
  locale,
  busy,
  setBusy,
  report,
  returnTo: preferredReturnTo,
  signup = false,
}: {
  locale: "en" | "fr";
  busy: boolean;
  setBusy: (value: boolean) => void;
  report: (error: unknown) => void;
  returnTo?: "/early-access";
  signup?: boolean;
}) {
  const [enabled, setEnabled] = useState<boolean | null>(null);
  const [confirmed, setConfirmed] = useState(false);
  const pending = useRef(false),
    active = useRef(true);
  const t = (key: MessageKey) => messages[key][locale === "fr" ? 1 : 0];
  useEffect(() => {
    active.current = true;
    api<{ google: boolean }>("/auth/providers")
      .then((value) => {
        if (active.current) setEnabled(value.google === true);
      })
      .catch(() => {
        if (active.current) setEnabled(false);
      });
    return () => {
      active.current = false;
    };
  }, []);
  async function start() {
    if (!enabled || busy || pending.current) return;

    pending.current = true;
    setBusy(true);
    try {
      const returnTo =
        preferredReturnTo ??
        new URLSearchParams(window.location.search).get("returnTo");
      const result = await api<{ url: string }>("/auth/google", "POST", {
        locale,
        intent: signup ? "signup" : "signin",
        returnTo,
      });
      if (!active.current) return;
      const destination = new URL(result.url);
      if (
        destination.protocol !== "https:" ||
        destination.username ||
        destination.password
      )
        throw new Error("google_auth_failed");
      window.location.assign(destination.href);
    } catch (error) {
      if (active.current) {
        report(error);
        setBusy(false);
      }
      pending.current = false;
    }
  }
  return (
    <GoogleSignInPresentation
      locale={locale}
      enabled={enabled}
      confirmed={confirmed}
      requireConfirmation={false}
      busy={busy}
      onConfirmedChange={setConfirmed}
      onStart={() => void start()}
      labels={{
        action: t("googleSignIn"),
        canada: t("canadaConfirm"),
        loading: t("loading"),
        unavailable: t("googleUnavailable"),
      }}
    />
  );
}
