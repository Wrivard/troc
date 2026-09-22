import { createRoot } from "react-dom/client";
import { lazy, Suspense } from "react";
import { PreferencesProvider } from "@workspace/troc-design-system/hooks/use-preferences";
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
const Guide = lazy(async () => {
  await import("./style-guide.css");
  return import("@workspace/troc-design-system/preview");
});
const base = import.meta.env.BASE_URL.replace(/\/$/, "");
const path = window.location.pathname.slice(base.length);
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
