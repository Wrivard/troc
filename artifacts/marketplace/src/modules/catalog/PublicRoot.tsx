import type {PublicPage} from "@workspace/catalog";
import {PreferencesProvider} from "@workspace/troc-design-system/hooks/use-preferences";
import {SessionProvider} from "../account/Workspace";
import {PublicClient} from "./PublicClient";
/** Identical public server/client tree: retain SSR artwork and controls during startup. */
export function PublicRoot({path,page,theme}:{path:string;page?:PublicPage;theme?:"dark"|"light"}) {
  return <PreferencesProvider initialLocale={page?.locale} initialTheme={theme}><SessionProvider><PublicClient path={path} initialPage={page}/></SessionProvider></PreferencesProvider>;
}
