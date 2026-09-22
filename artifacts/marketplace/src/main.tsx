import { createRoot } from "react-dom/client";
import { lazy, Suspense, useEffect } from "react";
import {
  PreferencesProvider,
  usePreferences,
} from "@workspace/troc-design-system/hooks/use-preferences";
import { AccountApp } from "./modules/account/AccountApp";
import {
  InformationPage,
  isInformationPage,
} from "./modules/brand/InformationPages";
import { PublicClient } from "./modules/catalog/PublicClient";
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
const Guide = lazy(async () => {
  await import("./style-guide.css");
  return import("@workspace/troc-design-system/preview");
});
const base = import.meta.env.BASE_URL.replace(/\/$/, "");
const path = window.location.pathname.slice(base.length);
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
if (!path.startsWith("/style-guide")) await import("./marketplace.css");
createRoot(document.getElementById("root")!).render(
  path.startsWith("/style-guide") ? (
    <Suspense>
      <Guide />
    </Suspense>
  ) : (
    <PreferencesProvider>
      {path === "/seller/inventory" ? (
        <Suspense>
          <InventoryApp />
        </Suspense>
      ) : sellerView ? (
        <Suspense>
          <SellerPageMetadata view={sellerView} />
          <SellerPlatformApp view={sellerView} />
        </Suspense>
      ) : isInformationPage(path) ? (
        <InformationPage path={path} />
      ) : ["/cart", "/smart-cart", "/checkout"].includes(path) ||
        path.startsWith("/order-confirmation/") ||
        path.startsWith("/account/orders") ||
        path.startsWith("/seller/orders") ? (
        <Suspense>
          <CommerceApp
            path={path.replace(/^\/order-confirmation\//, "/account/orders/")}
          />
        </Suspense>
      ) : path.startsWith("/account") || path.startsWith("/sign-") ? (
        <AccountApp path={path} />
      ) : (
        <PublicClient path={path} />
      )}
    </PreferencesProvider>
  ),
);
