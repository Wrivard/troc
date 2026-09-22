import type { Locale, Money } from "../shared/domain";
export type Page<T> = { items: T[]; nextCursor?: string };
export type PageRequest = { cursor?: string; limit: number };
export type Provenance = {
  provider: string;
  externalId: string;
  sourceUrl?: string;
  license: string;
  capturedAt: string;
};
export type CatalogRecord = {
  trocVariantId?: string;
  gameId: string;
  setId: string;
  productId: string;
  printingId: string;
  language: "en" | "ja";
  attributes: Record<string, string>;
  source: Provenance;
};
export interface CatalogProvider {
  readonly id: string;
  readonly licenseApproved: boolean;
  records(page: PageRequest): Promise<Page<CatalogRecord>>;
}
export type ReferencePrice = {
  variantId: string;
  condition?: string;
  grade?: string;
  source: Provenance;
  sourceCurrency: string;
  sourceMinorUnits: number;
  providerUpdatedAt: string;
  cad: Money;
  fxRate: string;
  fxDate: string;
};
export interface PricingProvider {
  references(
    variantIds: string[],
    page: PageRequest,
  ): Promise<Page<ReferencePrice>>;
}
// A payment represents ONE buyer transaction, never a card or individual seller order.
export interface PaymentProvider {
  readonly mode: "simulated";
  pay(input: {
    marketplaceOrderId: string;
    total: Money;
    idempotencyKey: string;
  }): Promise<{ paymentId: string; status: "simulated_paid" | "declined" }>;
  refund(input: {
    paymentId: string;
    amount: Money;
    idempotencyKey: string;
  }): Promise<{ refundId: string }>;
}
export interface ShippingProvider {
  quote(input: {
    sellerId: string;
    destinationCountry: "CA";
    province: string;
    items: {
      variantId: string;
      quantity: number;
      unitPrice: Money;
      grams: number;
      thicknessMm: number;
    }[];
  }): Promise<{ serviceId: string; total: Money; tracked: boolean }[]>;
}
export interface SearchProvider {
  search(
    input: PageRequest & {
      query: string;
      locale: Locale;
      filters: Record<string, string[]>;
    },
  ): Promise<Page<{ productId: string; variantIds: string[] }>>;
}
export interface EmailProvider {
  send(input: {
    template: string;
    locale: Locale;
    recipient: string;
    parameters: Record<string, string>;
    idempotencyKey: string;
  }): Promise<{ messageId: string }>;
}
export interface StorageProvider {
  uploadUrl(input: {
    ownerId: string;
    contentType: string;
    bytes: number;
    purpose: "listing" | "message" | "seller";
  }): Promise<{ key: string; url: string; expiresAt: string }>;
  readUrl(key: string): Promise<{ url: string; expiresAt: string }>;
  delete(key: string): Promise<void>;
}
export interface FxProvider {
  rate(input: {
    from: string;
    to: "CAD";
    date: string;
  }): Promise<{ rate: string; asOf: string; provider: string }>;
}
