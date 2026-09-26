import { useEffect, useState } from "react";
export function LocalAccountSwitcher({ locale }: { locale: "en" | "fr" }) {
  const [state, setState] = useState<{
    current: string | null;
    accounts: { role: string; email: string }[];
  } | null>(null);
  const [busy, setBusy] = useState(false),
    [error, setError] = useState(false);
  useEffect(() => {
    if (!import.meta.env.DEV) return;
    let active = true;
    fetch("/api/dev/accounts")
      .then((r) => (r.ok ? r.json() : null))
      .then((v) => {
        if (active && v?.local) setState(v);
      })
      .catch(() => {});
    return () => {
      active = false;
    };
  }, []);
  if (!state) return null;
  const fr = locale === "fr";
  async function select(role: string) {
    setBusy(true);
    setError(false);
    try {
      const r = await fetch("/api/dev/session", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ role }),
      });
      if (!r.ok) throw new Error();
      const path = window.location.pathname;
      window.location.assign(
        (path === "/sign-up" || path === "/early-access"
          ? path
          : role === "seller"
            ? "/seller/dashboard"
            : role === "admin"
              ? "/admin/seller-applications"
              : "/account") +
          "?lang=" +
          locale,
      );
    } catch {
      setError(true);
      setBusy(false);
    }
  }
  return (
    <div
      style={{
        background: "#25171a",
        color: "#fff",
        borderBottom: "1px solid #76313c",
        padding: "8px 16px",
        display: "flex",
        gap: 12,
        alignItems: "center",
        justifyContent: "center",
        flexWrap: "wrap",
        fontSize: 12,
      }}
      aria-label={fr ? "Comptes de test locaux" : "Local test accounts"}
    >
      <strong>{fr ? "TEST LOCAL" : "LOCAL TEST"}</strong>
      <span>{state.current ?? (fr ? "Non connecté" : "Signed out")}</span>
      {state.accounts.map((a) => (
        <button
          key={a.role}
          type="button"
          disabled={busy}
          aria-pressed={state.current === a.email}
          onClick={() => void select(a.role)}
          style={{
            border: "1px solid #ac707a",
            borderRadius: 6,
            padding: "5px 12px",
            background: state.current === a.email ? "#d91936" : "transparent",
            color: "white",
            cursor: "pointer",
          }}
        >
          {a.role === "buyer"
            ? fr
              ? "Acheteur"
              : "Buyer"
            : a.role === "seller"
              ? fr
                ? "Vendeur"
                : "Seller"
              : "Admin"}
        </button>
      ))}
      <span>
        {fr
          ? "Données fictives • aucun courriel envoyé"
          : "Test data • no emails sent"}
      </span>
      {error && (
        <span role="alert">
          {fr
            ? "Connexion impossible. Réessaie."
            : "Could not connect. Try again."}
        </span>
      )}
    </div>
  );
}
