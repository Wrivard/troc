import { SellerRouteLoading } from "./modules/seller-platform/SellerRouteLoading";
import { catalogBrowseHref } from "@workspace/catalog";
import { MarketplaceHeader, MarketplaceFooter } from "./modules/brand/SiteChrome";
import {OperationsPage, OperationsState} from "./modules/seller-platform/operations-ui";
import { SessionProvider, WorkspaceBoundary } from "./modules/account/Workspace";
import { createRoot, hydrateRoot } from "react-dom/client";
import { lazy, Suspense, useEffect } from "react";
import {
  PreferencesProvider,
  usePreferences,
} from "@workspace/troc-design-system/hooks/use-preferences";
import { isInformationPage } from "./modules/brand/information-routes";
const PublicClient = lazy(() => import("./modules/catalog/PublicClient").then(m => ({default:m.PublicClient})));
const InformationPage = lazy(() => import("./modules/brand/InformationPages").then(m => ({default:m.InformationPage})));
const SellerPromotions = lazy(() => import("./modules/seller-platform/SellerPromotions").then(m => ({default: m.SellerPromotions})));
const SellerPayouts = lazy(() => import("./modules/seller-platform/SellerPayouts").then(m => ({default: m.SellerPayouts})));
const SellerHelp = lazy(() => import("./modules/seller-platform/SellerHelp").then(m => ({default: m.SellerHelp})));
const SellerTeam = lazy(() => import("./modules/seller-platform/SellerTeam").then(m => ({default: m.SellerTeam})));
const SellerMessages = lazy(() => import("./modules/seller-platform/SellerMessages").then(m => ({default: m.SellerMessages})));
const SellerOrders = lazy(() => import("./modules/seller-platform/SellerOrders").then(m => ({default: m.SellerOrders})));
const SellerSettings = lazy(() => import("./modules/seller-platform/SellerSettings").then(m => ({default: m.SellerSettings})));
const StorefrontEditor = lazy(() => import("./modules/seller-platform/StorefrontEditor").then(m => ({default: m.StorefrontEditor})));
const SellerPlanned = lazy(() => import("./modules/seller-platform/SellerPlanned").then(m => ({default: m.SellerPlanned})));
const AdminWaitlist = lazy(() => import("./modules/account/AdminWaitlist").then(m => ({default: m.AdminWaitlist})));
const AccountApp = lazy(() => import("./modules/account/AccountApp").then(m => ({default: m.AccountApp})));

const AdminReports = lazy(() => import("./modules/account/AdminReports").then(m=>({default:m.AdminReports})));
function AdminLoading(){const {locale,theme,setLocale,setTheme}=usePreferences();return <div className="min-h-screen bg-background text-foreground"><MarketplaceHeader locale={locale} theme={theme} onLocale={setLocale} onTheme={setTheme}/><main id="main-content" className="workspace-page"><div className="workspace-heading"><p className="workspace-eyebrow">ADMINISTRATION</p><h1>{locale==="fr"?"Signalements de messages":"Message reports"}</h1></div><p role="status">{locale==="fr"?"Chargement des signalements…":"Loading reports…"}</p></main><MarketplaceFooter locale={locale}/></div>}
const SellerAnalytics = lazy(() => import("./modules/seller-platform/SellerAnalytics").then(m=>({default:m.SellerAnalytics})));
const CommerceApp = lazy(() =>
  import("./modules/commerce/CommerceApp").then((m) => ({
    default: m.CommerceApp,
  })),
);
const InventoryApp = lazy(() =>
  import("./modules/inventory/InventoryApp").then((m) => ({
    default: m.InventoryApp,
  })),
);
const SellerPlatformApp = lazy(() =>
  import("./modules/seller-platform/SellerPlatformApp").then((m) => ({
    default: m.SellerPlatformApp,
  })),
);
const PrelaunchApp = lazy(() =>
  import("./modules/prelaunch/PrelaunchApp").then((m) => ({
    default: m.PrelaunchApp,
  })),
);
function RouteLoading() {
  const {locale,theme,setLocale,setTheme} = usePreferences();
  if (window.location.pathname.startsWith("/seller/")) return <SellerRouteLoading path={window.location.pathname}/>;
  return <><MarketplaceHeader locale={locale} theme={theme} onLocale={setLocale} onTheme={setTheme}/><main id="main-content" className="marketplace-main" style={{minHeight:"calc(100svh - 80px)"}}><p role="status">{locale === "fr" ? "Chargement…" : "Loading…"}</p></main><MarketplaceFooter locale={locale}/></>;
}
const prelaunchTitles = {
  "/early-access": ["Early access", "Accès anticipé"],
  "/early-access/collector": [
    "Collector interest",
    "Intérêt des collectionneurs",
  ],
  "/early-access/seller": ["Seller interest", "Intérêt des vendeurs"],
  "/early-access/withdraw": ["Withdraw consent", "Retirer le consentement"],
  "/early-access/admin": ["Prelaunch lead review", "Examen des inscriptions"],
};
function PrelaunchPage({ path }: { path: keyof typeof prelaunchTitles }) {
  const { locale } = usePreferences();
  useEffect(() => {
    document.title = `${prelaunchTitles[path][locale === "fr" ? 1 : 0]} · TROC`;
  }, [path, locale]);
  return <PrelaunchApp path={path} />;
}
const Guide = lazy(async () => {
  await import("./style-guide.css");
  return import("@workspace/troc-design-system/preview");
});
const base = import.meta.env.BASE_URL.replace(/\/$/, "");
let requestedPath = window.location.pathname.slice(base.length);
const canonicalBrowse = catalogBrowseHref(requestedPath, new URLSearchParams(window.location.search));
if (canonicalBrowse.split("?")[0] !== requestedPath) {
  window.history.replaceState(window.history.state, "", base + canonicalBrowse + window.location.hash);
  delete window.__TROC_PAGE__;
  requestedPath = "/search";
}
const path = requestedPath === "/early-access/admin" ? "/admin/waitlist" : requestedPath;
const prelaunchPath = Object.hasOwn(prelaunchTitles, path)
  ? (path as keyof typeof prelaunchTitles)
  : null;
function SellerPageMetadata({
  view,
}: {
  view: "apply" | "dashboard" | "team" | "admin";
}) {
  const { locale } = usePreferences();
  useEffect(() => {
    const titles = {
      apply: ["Seller application", "Demande vendeur"],
      dashboard: ["Seller dashboard", "Tableau de bord vendeur"],
      team: ["Seller team", "Équipe vendeur"],
      admin: ["Review seller applications", "Examiner les demandes vendeurs"],
    };
    document.title = `${titles[view][locale === "fr" ? 1 : 0]} · TROC`;
  }, [view, locale]);
  return null;
}
const sellerView =
  path === "/seller/apply"
    ? "apply"
    : path === "/seller/dashboard"
      ? "dashboard"
      : path === "/seller/team"
        ? "team"
        : path === "/admin/seller-applications"
          ? "admin"
          : null;
// Fetch only the selected seller route's code while session verification runs.
// Protected data still starts exclusively behind WorkspaceBoundary.
const sellerCode = path === "/seller/dashboard" ? () => import("./modules/seller-platform/SellerPlatformApp")
 : path === "/seller/inventory" ? () => import("./modules/inventory/InventoryApp")
 : path === "/seller/orders" ? () => import("./modules/seller-platform/SellerOrders")
 : path === "/seller/messages" ? () => import("./modules/seller-platform/SellerMessages") : null;
if (sellerCode) void sellerCode().catch(() => { /* The route boundary owns render errors. */ });
if (!path.startsWith("/style-guide")) await import("./marketplace.css");
const publicRoute = /^\/(?:search|product\/[^/]+|store\/[^/]+)?$/.test(path);
if (publicRoute) {
  const {PublicRoot} = await import("./modules/catalog/PublicRoot");
  const page = window.__TROC_PAGE__;
  const theme = page ? (document.documentElement.dataset.theme === "troc-light" ? "light" : "dark") : undefined;
  const application = <PublicRoot path={path} page={page} theme={theme}/>;
  const container = document.getElementById("root")!;
  if (page && container.hasChildNodes()) hydrateRoot(container, application);
  else createRoot(container).render(application);
} else {
createRoot(document.getElementById("root")!).render(
  path.startsWith("/style-guide") ? (
    <Suspense>
      <Guide />
    </Suspense>
  ) : (
    <PreferencesProvider><SessionProvider><WorkspaceBoundary path={path}><Suspense fallback={<RouteLoading/>}>
      {path === "/seller/promotions"?<SellerPromotions/>:path === "/seller/payouts"?<SellerPayouts/>:["/help","/seller/help"].includes(path)?<SellerHelp/>:path === "/seller/team"?<SellerTeam/>:path === "/seller/analytics"?<Suspense fallback={<OperationsPage title="Analytics / Statistiques" description=""><OperationsState error={false} reload={()=>{}}/></OperationsPage>}><SellerAnalytics/></Suspense>:path === "/seller/messages"?<SellerMessages/>:path === "/seller/orders"?<SellerOrders/>:path === "/seller/settings"?<SellerSettings/>:path==="/seller/storefront"?<StorefrontEditor/>:["/seller/messages","/seller/payouts","/seller/analytics","/seller/promotions"].includes(path)?<SellerPlanned path={path}/>:path === "/admin/reports" ? <Suspense fallback={<AdminLoading/>}><AdminReports /></Suspense> : path === "/admin/waitlist" ? <AdminWaitlist /> : path === "/seller/inventory" ? (
        <Suspense fallback={<SellerRouteLoading path={path}/>}>
          <InventoryApp />
        </Suspense>
      ) : sellerView ? (
        <Suspense fallback={<SellerRouteLoading path={path}/>}>
          <SellerPageMetadata view={sellerView} />
          <SellerPlatformApp view={sellerView} />
        </Suspense>
      ) : prelaunchPath ? (
        <Suspense>
          <PrelaunchPage path={prelaunchPath} />
        </Suspense>
      ) : isInformationPage(path) ? (
        <InformationPage path={path} />
      ) : ["/cart", "/smart-cart", "/checkout"].includes(path) ||
        path.startsWith("/order-confirmation/") ||
        path.startsWith("/account/orders") ||
        path.startsWith("/seller/orders") ? (
        <Suspense fallback={<RouteLoading/>}>
          <CommerceApp
            path={path.replace(/^\/order-confirmation\//, "/account/orders/")}
          />
        </Suspense>
      ) : path.startsWith("/account") || path.startsWith("/sign-") ? (
        <AccountApp path={path} />
      ) : (
        <PublicClient path={path} />
      )}
    </Suspense></WorkspaceBoundary></SessionProvider></PreferencesProvider>
  ),
);

}
