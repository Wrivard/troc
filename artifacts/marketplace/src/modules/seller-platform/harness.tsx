/** Local-only isolated UI harness. Never mount in production. */
import { createRoot } from "react-dom/client";
import { PreferencesProvider } from "@workspace/troc-design-system/hooks/use-preferences";
import { SellerPlatformApp } from "./SellerPlatformApp";
import "../../marketplace.css";
const path = location.pathname;
createRoot(document.getElementById("root")!).render(
  <PreferencesProvider>
    <SellerPlatformApp
      view={
        path.includes("admin")
          ? "admin"
          : path.includes("apply")
            ? "apply"
            : path.includes("team")
              ? "team"
              : "dashboard"
      }
    />
  </PreferencesProvider>,
);
