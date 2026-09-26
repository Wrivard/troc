import { Fragment } from "react";
import { usePreferences } from "@workspace/troc-design-system/hooks/use-preferences";
import { MarketplaceHeader, MarketplaceFooter } from "../brand/SiteChrome";
import { SellerLoading } from "./SellerLoading";
import "./seller-shell.css";
const titles: Record<string, [string,string]> = {
 dashboard:["Overview","Vue d’ensemble"], inventory:["Inventory","Inventaire"],
 orders:["Orders","Commandes"],messages:["Messages","Messages"],
 analytics:["Analytics","Statistiques"],settings:["Settings","Paramètres"],
 storefront:["Edit storefront","Modifier la boutique"],team:["Team","Équipe"],
 payouts:["Payouts","Versements"],promotions:["Promotions","Promotions"],help:["Help centre","Centre d’aide"]
};
/** Public geometry only: never mounts seller queries before access is verified. */
export function SellerRouteLoading({path,standalone=false}:{path:string;standalone?:boolean}) {
 const {locale,theme,setLocale,setTheme}=usePreferences();
 const view=path.split("/")[2] || "dashboard";
 const Wrapper=standalone?"div":Fragment;
 return <Wrapper {...(standalone?{className:"seller-workspace"}:{})}>
  {standalone && <div className="seller-sidebar-rail seller-pending-rail" aria-hidden="true"><div className="seller-pending-lines">{Array.from({length:10},(_,i)=><i key={i}/>)}</div></div>}
  <MarketplaceHeader locale={locale} theme={theme} onLocale={setLocale} onTheme={setTheme}/>
  <main id="main-content" className="seller-operations seller-route-loading" aria-busy="true">
   <header className="seller-page-heading"><h1>{(titles[view] || ["Seller workspace","Espace vendeur"])[locale==="fr"?1:0]}</h1></header>
   <SellerLoading view={view} locale={locale}/>
  </main>
  <MarketplaceFooter locale={locale}/>
 </Wrapper>;
}
