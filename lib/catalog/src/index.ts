export type Locale = "en" | "fr";
export type Text = Record<Locale, string>;
export type ProductType = "raw_single" | "graded_card" | "sealed";
export type Condition = "NM" | "LP" | "MP" | "HP" | "DMG";
export interface Game {
  id: string;
  slug: string;
  name: Text;
}
export interface SetRelease {
  id: string;
  gameId: string;
  slug: string;
  name: Text;
  releasedOn: string | null;
}
export interface CatalogImage {
  id: string;
  side: "front" | "back" | "detail";
  url: string;
  sources: { url: string; width: number }[];
  /** Legacy single-URL imports may not provide verified dimensions. */
  width?: number;
  height?: number;
  provenance: {
    provider: string;
    externalId: string;
    sourceUrl: string;
    license: string;
    capturedAt: string;
  };
}
export interface Variant {
  images?: CatalogImage[];
  id: string;
  printingId: string;
  language: "en" | "ja";
  key: string;
  attributes: Record<string, string>;
  number: string;
  rarity: string;
  artist: string;
}
export interface Product {
  images?: CatalogImage[];
  id: string;
  slug: string;
  name: Text;
  gameId: string;
  setId: string;
  type: ProductType;
  variants: Variant[];
  aliases: string[];
  imageUrl: string | null;
  demo?: boolean;
}
export interface Seller {
  id: string;
  slug: string;
  name: string;
  city: string;
  province: string;
  story: Text;
  level: string;
  minimumCents: number;
  handlingDays: number;
  demo: boolean;
  logoUrl: string | null;
  bannerUrl: string | null;
  verifiedShop: boolean;
}
export interface Offer {
  id: string;
  variantId: string;
  sellerId: string;
  condition: Condition | null;
  cents: number;
  quantity: number;
  grade: string | null;
  gradingCompany?: string | null;
  certificateNumber?: string | null;
  photos: string[];
  photoUrls?: string[];
  demo: boolean;
}
export type OfferSort = "price_asc" | "price_desc" | "quantity";
export interface PricePoint {
  condition?: Condition | null;
  grade?: string | null;
  providerProductId?: string;
  variantId: string;
  cents: number;
  capturedAt: string;
  provider: string;
  sourceCurrency: string;
  sourceMinorUnits: number;
  fxRate: string;
  fxDate: string;
  providerUpdatedAt: string;
  demo: boolean;
}
export interface CatalogSnapshot {
  games: Game[];
  sets: SetRelease[];
  products: Product[];
  sellers: Seller[];
  offers: Offer[];
  prices: PricePoint[];
  demo: boolean;
}
export interface SearchFilters {
  q: string;
  game: string;
  set: string;
  type: string;
  language: string;
  variant: string;
  rarity: string;
  condition: string;
  seller: string;
  min: number | null;
  max: number | null;
  sort: "name" | "price" | "newest";
  cursor: string;
  limit: number;
}
export interface ProductResult {
  /** True when an offer, seller or reference contributing to this result is demo data. */
  demo?: boolean;
  product: Product;
  lowestCents: number | null;
  medianCents: number | null;
  referenceCents: number | null;
  quantity: number;
  sellerCount: number;
}
export interface PublicPage {
  kind: "home" | "search" | "game" | "set" | "product" | "store" | "not-found";
  path: string;
  locale: Locale;
  demo: boolean;
  filters: SearchFilters;
  games: Game[];
  sets: SetRelease[];
  sellers: Seller[];
  results: ProductResult[];
  nextCursor: string | null;
  offerPage: number;
  offerLimit: number;
  offerSort: OfferSort;
  nextOfferPage: number | null;
  selectedGrade?: string | null;
  product?: Product;
  offers: Offer[];
  prices: PricePoint[];
  seller?: Seller;
  selectedVariantId?: string;
}
// Provider payload describes relationships, never supplies canonical primary IDs.
export interface ImportImage {
  externalId: string;
  side: "front" | "back" | "detail";
  scope: "product" | "variant";
  sourceUrl: string;
  license: string;
  width: number;
  height: number;
  sources: { url: string; width: number }[];
}
export interface ImportRecord {
  /** Explicitly clear/replace these scopes; otherwise only supplied scopes (or empty variant) change. */
  imageScopes?: ("product" | "variant")[];
  /** Ordered replacement within each targeted provider-owned scope. */
  images?: ImportImage[];
  externalId: string;
  game: { key: string; name: Text };
  set: { key: string; name: Text; releasedOn: string | null };
  product: { key: string; name: Text; type: ProductType; aliases: string[] };
  printing: {
    key: string;
    language: "en" | "ja";
    number: string;
    rarity: string;
    artist: string;
  };
  variant: { key: string; attributes: Record<string, string> };
  image: { url: string; license: string } | null;
}
export interface CatalogImportProvider {
  id: string;
  records(input: {
    cursor?: string;
    limit: number;
  }): Promise<{ items: ImportRecord[]; nextCursor?: string }>;
}
