// Local test harness only; never import from the production application.
import { createRoot } from "react-dom/client";
import { PreferencesProvider } from "@workspace/troc-design-system/hooks/use-preferences";
import { PrelaunchApp } from "./PrelaunchApp";
import "../../marketplace.css";
createRoot(document.getElementById("root")!).render(
  <PreferencesProvider>
    <PrelaunchApp path={window.location.pathname} />
  </PreferencesProvider>,
);
