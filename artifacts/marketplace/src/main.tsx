import { createRoot } from "react-dom/client";
import { lazy, Suspense } from "react";
import { PreferencesProvider } from "@workspace/troc-design-system/hooks/use-preferences";
import { AccountApp } from "./modules/account/AccountApp";
import { PublicClient } from "./modules/catalog/PublicClient";
const Guide = lazy(async () => {
  await import("./style-guide.css");
  return import("@workspace/troc-design-system/preview");
});
const base = import.meta.env.BASE_URL.replace(/\/$/, "");
const path = window.location.pathname.slice(base.length);
if (!path.startsWith("/style-guide"))
  await import("@workspace/troc-design-system/styles.css");
createRoot(document.getElementById("root")!).render(
  path.startsWith("/style-guide") ? (
    <Suspense>
      <Guide />
    </Suspense>
  ) : (
    <PreferencesProvider>
      {path.startsWith('/account')||path.startsWith('/sign-')?<AccountApp path={path}/>:<PublicClient path={path}/>}
    </PreferencesProvider>
  ),
);
