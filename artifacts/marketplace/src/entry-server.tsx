import { renderToString } from "react-dom/server";
import type { PublicPage } from "@workspace/catalog";
import { PublicMarketplace } from "./modules/catalog/PublicMarketplace";
export function render(page: PublicPage, theme: "dark" | "light") {
  return renderToString(<PublicMarketplace page={page} theme={theme} />);
}
