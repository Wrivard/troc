// Route membership stays small; page content is loaded only when visited.
const routes = new Set([
  "/docs",
  "/roadmap",
  "/about",
  "/sell",
  "/founding-sellers",
  "/developers",
  "/help",
  "/condition-guide",
  "/account/messages",
  "/account/notifications",
  "/account/wishlist",
  "/account/price-alerts",
  "/account/following",
  "/account/credit",
  "/collection",
  "/want-lists",
  "/seller",
  "/seller/apply",
  "/seller/inventory",
  "/seller/promotions",
  "/seller/offers",
  "/seller/analytics",
  "/seller/storefront",
  "/seller/team",
  "/seller/settings",
  "/seller/plan",
  "/seller/buylist"
]);
export function isInformationPage(path: string) {
  const key = path.startsWith("/collection/") ? "/collection" : path.startsWith("/want-lists/") ? "/want-lists" : path;
  return routes.has(key);
}
