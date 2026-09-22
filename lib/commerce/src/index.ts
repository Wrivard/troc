/** Transport contracts only. All authoritative calculations run on the server. */
export type Condition = "NM" | "LP" | "MP" | "HP" | "DMG";
export type OrderStatus =
  | "simulated_paid"
  | "awaiting_shipment"
  | "shipped"
  | "delivered"
  | "completed"
  | "issue"
  | "cancelled"
  | "partially_refunded"
  | "refunded";
export interface Promotion {
  id: string;
  minimumCards?: number;
  minimumCents?: number;
  basisPoints: number;
  coupon?: string;
}
export interface CommerceSeller {
  id: string;
  name: string;
  slug: string;
  active: boolean;
  country: string;
  level: string;
  minimumCents: number;
  handlingDays: number;
  reputation: number;
  badges: string[];
  freeShippingCents: number | null;
  promotions: Promotion[];
}
export interface CommerceListing {
  id: string;
  sellerId: string;
  productId: string;
  printingId: string;
  variantId: string;
  language: "en" | "ja";
  condition: Condition | null;
  productType: "raw_single" | "graded_card" | "sealed";
  name: { en: string; fr: string };
  slug: string;
  setId: string;
  setSlug: string;
  special: boolean;
  imageUrl: string | null;
  cents: number;
  saleCents: number | null;
  quantity: number;
  active: boolean;
  grams: number;
  thicknessMm: number;
  promoted: boolean;
  demo: boolean;
}
export interface CartLine {
  listingId: string;
  quantity: number;
  lockListing?: boolean;
  lockSeller?: boolean;
}
export interface QuotedLine extends CartLine {
  listing: CommerceListing;
  unitCents: number;
  totalCents: number;
}
export interface ShippingQuote {
  serviceId: string;
  cents: number;
  beforeFreeCents: number;
  tracked: boolean;
  grams: number;
  thicknessMm: number;
  cards: number;
}
export interface SellerQuote {
  seller: CommerceSeller;
  lines: QuotedLine[];
  cards: number;
  merchandiseCents: number;
  discountCents: number;
  promotionId: string | null;
  nextPromotion: Promotion | null;
  minimumRemainingCents: number;
  freeShippingRemainingCents: number | null;
  shipping: ShippingQuote;
  totalCents: number;
}
export interface CartQuote {
  groups: SellerQuote[];
  cards: number;
  merchandiseCents: number;
  discountCents: number;
  shippingCents: number;
  taxCents: number;
  creditCents: number;
  totalCents: number;
  eligible: boolean;
  demo: boolean;
  currency: "CAD";
}
export interface SmartResult {
  original: CartQuote;
  optimized: CartQuote;
  naive: CartQuote;
  lines: CartLine[];
  savingsCents: number;
  shippingSavingsCents: number;
  evaluated: number;
  substitutions: {
    fromListingId: string;
    toListingId: string;
    quantity: number;
    merchandiseDifferenceCents: number;
  }[];
}
export interface Address {
  recipient: string;
  line1: string;
  line2: string;
  city: string;
  province: string;
  postalCode: string;
  country: "CA";
}
export interface FeeAllocation {
  sellerId: string;
  commissionCents: number;
  shippingCommissionCents: number;
  promotedCents: number;
  processingCents: number;
  netCents: number;
}
export interface OrderView {
  id: string;
  buyerId?: string;
  createdAt: string;
  status: OrderStatus;
  totalCents: number;
  creditCents: number;
  rewardCents: number;
  demo: boolean;
  address: Address;
  groups: {
    id: string;
    status: OrderStatus;
    quote: SellerQuote;
    fee: FeeAllocation;
    tracking: string | null;
    refundedCents: number;
  }[];
  messages: {
    id: string;
    sellerOrderId: string;
    body: string;
    createdAt: string;
    author: "buyer" | "seller";
  }[];
}
