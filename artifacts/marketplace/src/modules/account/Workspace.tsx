import { SellerRouteLoading } from "../seller-platform/SellerRouteLoading";
import {SellerShell} from "../seller-platform/SellerShell";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@workspace/troc-design-system/components/ui/select";
import {
  createContext,
  useContext,
  useEffect,
  useState,
  useCallback,
  type ReactNode,
} from "react";
import { usePreferences } from "@workspace/troc-design-system/hooks/use-preferences";
import { MarketplaceHeader, MarketplaceFooter } from "../brand/SiteChrome";
import "./workspace.css";
export type Identity = {
  id: string;
  email: string;
  displayName?: string;
  locale: "en" | "fr";
  theme: "light" | "dark";
  roles?: string[];
  memberships?: { sellerId: string; active: boolean }[];
};
type Session = {
  user: Identity | null;
  state: "loading" | "ready" | "error";
  reload: () => void;
};
const Context = createContext<Session>({
  user: null,
  state: "loading",
  reload: () => {},
});
export const useSession = () => useContext(Context);
export function SessionProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<Identity | null>(null),
    [state, setState] = useState<Session["state"]>("loading"),
    [version, setVersion] = useState(0);
  const reload = useCallback(() => setVersion((v) => v + 1), []);
  useEffect(() => {
    const c = new AbortController();
    fetch("/api/account", {
      cache: "no-store",
      signal: AbortSignal.any([c.signal, AbortSignal.timeout(10000)]),
    })
      .then(async (r) => {
        if (r.status === 401) return null;
        if (!r.ok) throw Error();
        return r.json();
      })
      .then((v) => {
        if (!c.signal.aborted) {
          setUser(v);
          setState("ready");
        }
      })
      .catch(() => {
        if (!c.signal.aborted) {
          setUser(null);
          setState("error");
        }
      });
    return () => c.abort();
  }, [version]);
  useEffect(() => {
    window.addEventListener("focus", reload);
    return () => window.removeEventListener("focus", reload);
  }, [reload]);
  return (
    <Context.Provider value={{ user, state, reload }}>
      {children}
    </Context.Provider>
  );
}
export const isSeller = (u: Identity | null) =>
  !!u && (u.roles?.includes("admin") || u.memberships?.some((m) => m.active));
export function WorkspaceNavigation({ locale }: { locale: "en" | "fr" }) {
  const { user } = useSession();
  if (!user || typeof window === "undefined" || window.location.pathname.startsWith("/seller/")) return null;
  const path =
    window.location.pathname === "/early-access/admin"
      ? "/admin/waitlist"
      : window.location.pathname;
  if (!/^\/(account|seller|admin)(\/|$)/.test(path)) return null;
  const fr = locale === "fr";
  const groups = [
    {
      name: fr ? "Mon compte" : "My account",
      links: [
        ["/account", fr ? "Vue d’ensemble" : "Overview"],
        ["/account/orders", fr ? "Mes commandes" : "My orders"],
        ["/account/settings", fr ? "Préférences" : "Preferences"],
      ],
    },
    ...(isSeller(user)
      ? [
          {
            name: fr ? "Espace vendeur" : "Seller Hub",
            links: [
              ["/seller/dashboard", fr ? "Tableau de bord" : "Dashboard"],
              ["/seller/inventory", fr ? "Inventaire" : "Inventory"],
              ["/seller/orders", fr ? "Ventes" : "Sales"],
              ["/seller/team", fr ? "Équipe" : "Team"],
            ],
          },
        ]
      : []),
    ...(user.roles?.includes("admin")
      ? [
          {
            name: "Administration",
            links: [
              ["/admin/waitlist", fr ? "Liste d’attente" : "Waitlist"],
 ["/admin/reports", fr ? "Signalements" : "Message reports"],
              [
                "/admin/seller-applications",
                fr ? "Demandes vendeurs" : "Seller applications",
              ],
            ],
          },
        ]
      : []),
  ];
  const active =
    groups.find((g) =>
      g.links.some(([url]) => path === url || path.startsWith(url + "/")),
    ) ?? groups[0];
  const current = path.startsWith("/seller/")
    ? groups.find((g) => g.links[0][0].startsWith("/seller"))
    : path.startsWith("/admin/")
      ? groups.find((g) => g.name === "Administration")
      : active;
  const group = current ?? groups[0];
  return (
    <nav
      className="workspace-navigation workspace-context"
      aria-label={fr ? "Navigation de votre espace" : "Workspace navigation"}
    >
      <Select
        value={group.name}
        onValueChange={(v) => {
          const next = groups.find((g) => g.name === v);
          if (next)
            window.location.assign(next.links[0][0] + "?lang=" + locale);
        }}
      >
        <SelectTrigger
          aria-label={fr ? "Changer d’espace" : "Switch workspace"}
          className="workspace-switch"
        >
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {groups.map((g) => (
            <SelectItem key={g.name} value={g.name}>
              {g.name}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      <div className="workspace-context-links">
        {group.links.map(([url, label]) => (
          <a
            key={url}
            href={url + "?lang=" + locale}
            aria-current={
              path === url || (url !== "/account" && path.startsWith(url + "/"))
                ? "page"
                : undefined
            }
          >
            {label}
          </a>
        ))}
      </div>
    </nav>
  );
}

export function WorkspaceBoundary({
  path,
  children,
}: {
  path: string;
  children: ReactNode;
}) {
  const { user, state, reload } = useSession(),
    { locale, theme, setLocale, setTheme } = usePreferences();
  const fr = locale === "fr";
  const protectedPath =
    /^\/(account|seller|admin)(\/|$)/.test(path) &&
    path !== "/seller/apply" &&
    path !== "/seller";
  if (!protectedPath) return children;
  const denied =
    user &&
    ((path.startsWith("/admin") && !user.roles?.includes("admin")) ||
      (path.startsWith("/seller/") && !isSeller(user)));
  if (state === "loading" && path.startsWith("/seller/")) return <SellerRouteLoading path={path} standalone />;
  if (state === "ready" && user && !denied) return path.startsWith("/seller/")?<SellerShell userId={user.id}>{children}</SellerShell>:children;
  return (
    <div className="min-h-screen bg-background text-foreground">
      <MarketplaceHeader
        locale={locale}
        theme={theme}
        onLocale={setLocale}
        onTheme={setTheme}
      />
      <main id="main-content" className="workspace-page">
        <h1>
          {state === "loading"
            ? fr
              ? "Ouverture de votre espace…"
              : "Opening your workspace…"
            : denied
              ? fr
                ? "Cet espace nécessite un autre accès"
                : "This workspace requires different access"
              : state === "error"
                ? fr
                  ? "Votre compte est temporairement indisponible"
                  : "Your account is temporarily unavailable"
                : fr
                  ? "Connectez-vous pour continuer"
                  : "Sign in to continue"}
        </h1>
        <p>
          {denied
            ? fr
              ? "Votre compte reste accessible. Cette page nécessite les permissions correspondant à cet espace."
              : "Your account remains available. This page requires the permissions for this workspace."
            : state === "error"
              ? fr
                ? "Vos données sont conservées. Réessayez."
                : "Your data is safe. Please retry."
              : state === "loading"
                ? ""
                : fr
                  ? "Vous retrouverez cette page après la connexion."
                  : "You will return to this page after signing in."}
        </p>
        {state === "error" ? (
          <button onClick={reload}>{fr ? "Réessayer" : "Retry"}</button>
        ) : (
          state !== "loading" && (
            <a
              href={
                denied
                  ? "/account?lang=" + locale
                  : "/sign-in?lang=" +
                    locale +
                    "&returnTo=" +
                    encodeURIComponent(path)
              }
            >
              {denied
                ? fr
                  ? "Mon compte"
                  : "My account"
                : fr
                  ? "Connexion"
                  : "Sign in"}
            </a>
          )
        )}
      </main>
      <MarketplaceFooter locale={locale} />
    </div>
  );
}
