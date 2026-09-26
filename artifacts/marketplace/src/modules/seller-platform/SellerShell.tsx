import { loadSellerDirectory } from "./seller-directory";
import {
  Dialog,
  DialogContent,
  DialogTitle,
  DialogTrigger,
} from "@workspace/troc-design-system/components/ui/dialog";
import {
  createContext,
  useContext,
  useState,
  useEffect,
  type Dispatch,
  type SetStateAction,
  type ReactNode,
} from "react";
import {
  House,
  Package,
  ClipboardList,
  MessageSquare,
  Wallet,
  ChartNoAxesColumn,
  Users,
  Tag,
  Settings,
  Store,
  Menu,
  ArrowUpRight,
} from "@workspace/troc-design-system/components/ui/seller-icons";
import { usePreferences } from "@workspace/troc-design-system/hooks/use-preferences";
import "./seller-shell.css";
type Shop = { id: string; display_name: string; status: string; role: string };
const Context = createContext<{
  userId: string;
  seller: string;
  setSeller: Dispatch<SetStateAction<string>>;
  shops: Shop[];
  reloadDirectory: () => void;
  directory: Shop[];
  directoryState: "loading" | "ready" | "error";
}>({ userId: "", seller: "", setSeller: () => {}, shops: [], directory: [], directoryState: "loading", reloadDirectory: () => {} });
export const useSellerWorkspace = () => useContext(Context);
export function SellerShell({
  userId,
  children,
}: {
  userId: string;
  children: ReactNode;
}) {
  const { locale } = usePreferences(),
    fr = locale === "fr";
  const [directoryRevision, setDirectoryRevision] = useState(0);
  const reloadDirectory = () => setDirectoryRevision(value => value + 1);
  const [directory, setDirectory] = useState<Shop[]>([]);
  const [directoryState, setDirectoryState] = useState<"loading" | "ready" | "error">("loading");
  const [seller, setSeller] = useState(""),
    [shops, setShops] = useState<Shop[]>([]),
    [open, setOpen] = useState(false),
    [error, setError] = useState(false);
  useEffect(() => {
    let active = true;
    setDirectoryState("loading");
    setError(false);
    loadSellerDirectory(userId)
      .then((rows: Shop[]) => {
        if (!active) return;
        setDirectory(rows);
        setDirectoryState("ready");
        const valid = rows.filter((s) => s.status === "active");
        setShops(valid);
        let saved = "";
        try {
          saved = localStorage.getItem("troc.seller." + userId) || "";
        } catch { /* Browser storage can be disabled; keep the in-memory view. */ }
        setSeller((s) =>
          valid.some((x) => x.id === s)
            ? s
            : valid.some((x) => x.id === saved)
              ? saved
              : (valid[0]?.id ?? ""),
        );
      })
      .catch(() => {
        if (active) { setError(true); setDirectoryState("error"); }
      });
    return () => {
      active = false;
    };
  }, [userId, directoryRevision]);
  useEffect(() => {
    if (seller)
      try {
        localStorage.setItem("troc.seller." + userId, seller);
      } catch { /* Browser storage can be disabled; keep the in-memory view. */ }
  }, [seller, userId]);
  useEffect(() => {
    const reload = () =>
      fetch("/api/seller/platform/sellers")
        .then((r) => (r.ok ? r.json() : Promise.reject()))
        .then((rows: Shop[]) =>
          setShops(rows.filter((s) => s.status === "active")),
        )
        .catch(() => {});
    window.addEventListener("troc:seller-updated", reload);
    return () => window.removeEventListener("troc:seller-updated", reload);
  }, []);
  const path = window.location.pathname,
    links = [
      ["/seller/dashboard", fr ? "Vue d’ensemble" : "Overview", House, false],
      ["/seller/inventory", fr ? "Inventaire" : "Inventory", Package, false],
      ["/seller/orders", fr ? "Commandes" : "Orders", ClipboardList, false],
      ["/seller/messages", "Messages", MessageSquare, false],
      ["/seller/payouts", fr ? "Versements" : "Payouts", Wallet, false],
      [
        "/seller/analytics",
        fr ? "Statistiques" : "Analytics",
        ChartNoAxesColumn,
        false,
      ],
      ["/seller/promotions", "Promotions", Tag, false],
      [
        "/seller/storefront",
        fr ? "Modifier la boutique" : "Edit storefront",
        Store,
        false,
      ],
      ["/seller/team", fr ? "Équipe" : "Team", Users, false],
      ["/seller/help", fr ? "Centre d’aide" : "Help Center", MessageSquare, false],
      ["/seller/settings", fr ? "Paramètres" : "Settings", Settings, false],
    ] as const;
  return (
    <Context.Provider value={{ userId, seller, setSeller, shops, directory, directoryState, reloadDirectory }}>
      <div className="seller-workspace">
        <div className="seller-sidebar-rail"><aside className="seller-sidebar">
          <div className="seller-greeting"><span>{fr ? "Bon retour," : "Welcome back,"}</span><strong>{shops.find(s=>s.id===seller)?.display_name || (error ? (fr?"Indisponible":"Unavailable") : "…")}</strong></div>
          <nav aria-label="Seller Hub">
            {links.map(([url, label, Icon, planned]) => (
              <a
                key={url}
                href={url + "?lang=" + locale}
                aria-current={
                  path === url || path.startsWith(url + "/")
                    ? "page"
                    : undefined
                }
              >
                <Icon size={18} />
                <span>{label}</span>
                {planned && <small>{fr ? "À venir" : "Soon"}</small>}
              </a>
            ))}
          </nav>
          <div className="seller-sidebar-help">
            <strong>{fr ? "Besoin d’aide ?" : "Need a hand?"}</strong>
            <p>
              {fr
                ? "Guides pour vendre sur TROC."
                : "Guides for selling on TROC."}
            </p>
            <a href={"/seller/help?lang=" + locale}>
              {fr ? "Centre d’aide" : "Help centre"} <ArrowUpRight size={14} />
            </a>
            <a href={"/account/settings?lang=" + locale}>
              {fr ? "Paramètres personnels" : "Personal settings"}
            </a>
          </div>
        </aside></div>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <button className="seller-mobile-toggle">
              <Menu size={18} /> Seller Hub
            </button>
          </DialogTrigger>
          <DialogContent
            className="seller-mobile-drawer"
            closeLabel={fr ? "Fermer" : "Close"}
            aria-describedby={undefined}
          >
            <DialogTitle>Seller Hub</DialogTitle>
            <div className="seller-sidebar seller-sidebar-dialog">
              <div className="seller-greeting"><span>{fr ? "Bon retour," : "Welcome back,"}</span><strong>{shops.find(s=>s.id===seller)?.display_name || (error ? (fr?"Indisponible":"Unavailable") : "…")}</strong></div>
              <nav aria-label="Seller Hub">
                {links.map(([url, label, Icon, planned]) => (
                  <a
                    key={url}
                    href={url + "?lang=" + locale}
                    aria-current={
                      path === url || path.startsWith(url + "/")
                        ? "page"
                        : undefined
                    }
                  >
                    <Icon size={18} />
                    <span>{label}</span>
                    {planned && <small>{fr ? "À venir" : "Soon"}</small>}
                  </a>
                ))}
              </nav>
              <div className="seller-sidebar-help">
                <strong>{fr ? "Besoin d’aide ?" : "Need a hand?"}</strong>
                <p>
                  {fr
                    ? "Guides pour vendre sur TROC."
                    : "Guides for selling on TROC."}
                </p>
                <a href={"/seller/help?lang=" + locale}>
                  {fr ? "Centre d’aide" : "Help centre"}{" "}
                  <ArrowUpRight size={14} />
                </a>
                <a href={"/account/settings?lang=" + locale}>
                  {fr ? "Paramètres personnels" : "Personal settings"}
                </a>
              </div>
            </div>
          </DialogContent>
        </Dialog>

        {children}
      </div>
    </Context.Provider>
  );
}
