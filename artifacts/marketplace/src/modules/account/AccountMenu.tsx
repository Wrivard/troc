import {
  House,
  Package,
  ClipboardList,
  Users,
  Settings,
  Store,
  MessageSquare,
  ChevronRight,
  Clock,
} from "@workspace/troc-design-system/components/ui/seller-icons";
import { useSession } from "./Workspace";
import { useRef, useState } from "react";
import {
  User,
  ChevronDown,
  X,
  LogOut,
} from "@workspace/troc-design-system/components/ui/account-icons";
import {
  Popover,
  PopoverTrigger,
  PopoverContent,
} from "@workspace/troc-design-system/components/ui/popover";
import { Button } from "@workspace/troc-design-system/components/ui/button";
import "./account-menu.css";
export function AccountMenu({
  locale,
  base = "",
}: {
  locale: "en" | "fr";
  base?: string;
}) {
  const fr = locale === "fr";
  const triggerRef = useRef<HTMLButtonElement>(null);
  const { user, state } = useSession();
  const [open, setOpen] = useState(false),
    [busy, setBusy] = useState(false),
    [error, setError] = useState(false);
  const href = (path: string) => {
    const [route, hash] = path.split("#");
    return base + route + "?lang=" + locale + (hash ? "#" + hash : "");
  };
  if (state === "loading")
    return (
      <span
        className="troc-site-account troc-account-loading"
        aria-label={fr ? "Chargement du compte" : "Loading account"}
        aria-busy="true"
      >
        <User size={20} aria-hidden="true" />
      </span>
    );
  if (!user)
    return (
      <Button
        type="button"
        variant={state === "error" ? "secondary" : "primary"}
        size="sm"
        className="troc-site-sign-in"
        onClick={() =>
          window.location.assign(
            href(state === "error" ? "/account" : "/sign-in"),
          )
        }
      >
        <User size={18} aria-hidden="true" />
        <span className="troc-site-sign-in-label">
          {state === "error"
            ? fr
              ? "Mon compte"
              : "My account"
            : fr
              ? "Connexion"
              : "Sign in"}
        </span>
      </Button>
    );
  const admin = user.roles?.includes("admin"),
    seller = admin || user.memberships?.some((m) => m.active);
  const sections = [
    {
      title: fr ? "Votre compte" : "Your account",
      links: [
        ["/account", fr ? "Vue d’ensemble" : "Overview"],
        ["/account/orders", fr ? "Historique des commandes" : "Order history"],
        [
          "/account/settings",
          fr ? "Préférences du compte" : "Account preferences",
        ],
        [
          "/account/settings#early-access",
          fr ? "Votre inscription à la waitlist" : "Your waitlist registration",
        ],
      ],
    },
    {
      title: fr ? "Vendre" : "Sell",
      links: seller
        ? [
            [
              "/seller/dashboard",
              fr ? "Tableau de bord vendeur" : "Seller dashboard",
            ],
            [
              "/seller/inventory",
              fr ? "Inventaire et import" : "Inventory & import",
            ],
            ["/seller/orders", fr ? "Commandes à traiter" : "Seller orders"],
            ["/seller/team", fr ? "Équipe et accès" : "Team & access"],
          ]
        : [
            ["/sell", fr ? "Vendre sur TROC" : "Selling on TROC"],
            ["/seller/apply", fr ? "Devenir vendeur" : "Apply to sell"],
          ],
    },
    {
      title: fr ? "Aide" : "Help",
      links: [
        ["/help", fr ? "Centre d’aide" : "Help centre"],
        ["/condition-guide", fr ? "Guide des conditions" : "Condition guide"],
      ],
    },
    ...(admin
      ? [
          {
            title: "Administration",
            links: [
              ["/admin/waitlist", fr ? "Liste d’attente" : "Waitlist"],
              ["/admin/reports", fr ? "Signalements" : "Message reports"],
            ],
          },
        ]
      : []),
  ];
  const icons: Record<string, typeof User> = {
    "/account": House,
    "/account/orders": Package,
    "/account/settings": Settings,
    "/account/settings#early-access": Clock,
    "/seller/dashboard": Store,
    "/seller/inventory": Package,
    "/seller/orders": ClipboardList,
    "/seller/team": Users,
    "/help": MessageSquare,
    "/condition-guide": ClipboardList,
  };
  const current =
    typeof window === "undefined"
      ? ""
      : window.location.pathname + window.location.hash;
  async function signOut() {
    setBusy(true);
    setError(false);
    try {
      const r = await fetch(base + "/api/auth/sign-out", { method: "POST" });
      if (!r.ok) throw Error();
      window.location.assign(href("/sign-in"));
    } catch {
      setError(true);
      setBusy(false);
    }
  }
  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <button
          ref={triggerRef}
          className="troc-site-account troc-account-trigger"
          aria-label={
            (fr ? "Menu du compte : " : "Account menu: ") + user.email
          }
        >
          <span className="troc-account-greeting">
            <span>{fr ? "Heureux de vous revoir" : "Welcome back"}</span>
            <strong>{user.displayName || user.email}</strong>
          </span>
          <User size={20} aria-hidden="true" />
          <ChevronDown size={14} aria-hidden="true" />
        </button>
      </PopoverTrigger>
      <PopoverContent
        align="end"
        className="troc-account-popover"
        aria-label={fr ? "Navigation du compte" : "Account navigation"}
      >
        <div className="troc-account-menu-identity">
          <span className="troc-account-avatar" aria-hidden="true">
            {(user.displayName || user.email).slice(0, 1).toUpperCase()}
          </span>
          <div>
            <strong>{user.displayName || user.email}</strong>
            {user.displayName && (
              <span className="troc-account-email">{user.email}</span>
            )}
            <span>
              {admin
                ? fr
                  ? "Administrateur"
                  : "Administrator"
                : seller
                  ? fr
                    ? "Acheteur et vendeur"
                    : "Buyer & seller"
                  : fr
                    ? "Acheteur"
                    : "Buyer"}
            </span>
          </div>
          <button
            type="button"
            onClick={() => { setOpen(false); requestAnimationFrame(() => triggerRef.current?.focus()); }}
            aria-label={fr ? "Fermer" : "Close"}
          >
            <X size={18} />
          </button>
        </div>
        <nav
          className="troc-account-menu-sections"
          aria-label={fr ? "Raccourcis du compte" : "Account shortcuts"}
        >
          {sections.map((section, index) => (
            <section
              key={section.title}
              className={
                index === 1 && seller ? "troc-account-selling" : undefined
              }
            >
              <h2>{section.title}</h2>
              <div className="troc-account-link-grid">
                {section.links.map(([path, label]) => {
                  const Icon = icons[path] || User;
                  const featured = path === "/seller/dashboard";
                  return (
                    <a
                      key={path}
                      href={href(path)}
                      onClick={() => setOpen(false)}
                      aria-current={current === path ? "page" : undefined}
                      className={featured ? "troc-account-featured" : undefined}
                    >
                      <Icon size={18} aria-hidden="true" />
                      <span>
                        <strong>{label}</strong>
                        {featured && (
                          <small>
                            {fr
                              ? "Votre boutique, au même endroit"
                              : "Your store, in one place"}
                          </small>
                        )}
                      </span>
                      {featured && (
                        <ChevronRight size={16} aria-hidden="true" />
                      )}
                    </a>
                  );
                })}
              </div>
            </section>
          ))}
        </nav>
        <div className="troc-account-menu-footer">
          <button type="button" disabled={busy} onClick={() => void signOut()}>
            <LogOut size={16} />
            {busy
              ? fr
                ? "Déconnexion…"
                : "Signing out…"
              : fr
                ? "Se déconnecter"
                : "Sign out"}
          </button>
          {error && (
            <p role="alert">
              {fr
                ? "Déconnexion impossible. Réessayez."
                : "Could not sign out. Try again."}
            </p>
          )}
        </div>
      </PopoverContent>
    </Popover>
  );
}
