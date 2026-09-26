import { DomainError } from "../shared/domain";
import {
  channels,
  choice,
  games,
  object,
  provinces,
  secret,
  software,
  text,
} from "./validation";

export const onboardingContract = {
  consentVersion: "prelaunch-2026-09-v2",
  intent: ["buyer", "seller", "both"],
  games,
  provinces,
  channels,
  software,
  frequency: ["not_specified", "occasionally", "monthly", "weekly"],
  monthlySpend: [
    "not_specified",
    "prefer_not_to_say",
    "under_25",
    "25_99",
    "100_249",
    "250_499",
    "500_plus",
  ],
  desiredFeatures: [
    "combined_shipping",
    "collection_tracking",
    "want_lists",
    "price_alerts",
    "canadian_sellers",
    "bilingual",
    "other",
  ],
  sellerType: ["individual", "professional", "online_store", "hobby_shop"],
  inventory: ["under_1000", "1000_9999", "10000_49999", "50000_plus"],
  initialListingsScenario: ["unspecified", "one_click_if_available"],
  initialListings: [
    "1_49",
    "50_99",
    "100_249",
    "250_499",
    "500_999",
    "1000_2499",
    "2500_4999",
    "5000_9999",
    "10000_24999",
    "25000_49999",
    "50000_99999",
    "100000_plus",
    "under_100",
    "100_999",
    "1000_9999",
    "10000_plus",
    "undecided",
  ],
  readiness: ["at_launch", "within_1_month", "within_3_months", "exploring"],
  experience: [
    "not_specified",
    "starting",
    "under_1_year",
    "1_3_years",
    "3_plus_years",
  ],
  monthlySales: [
    "not_specified",
    "prefer_not_to_say",
    "none",
    "under_1000",
    "1000_4999",
    "5000_19999",
    "20000_plus",
  ],
} as const;
type Option<
  K extends Exclude<keyof typeof onboardingContract, "consentVersion">,
> = (typeof onboardingContract)[K][number];
export type BuyerAnswers = {
  frequency?: Option<"frequency">;
  monthlySpend?: Option<"monthlySpend">;
  channels: Option<"channels">[];
  frustrations?: string;
  desiredFeatures?: Option<"desiredFeatures">[];
  wishlist?: string;
};
export type SellerAnswers = {
  adult: true;
  sellerType: Option<"sellerType">;
  inventory: Option<"inventory">;
  initialListings: Option<"initialListings">;
  initialListingsScenario?: Option<"initialListingsScenario">;
  readiness: Option<"readiness">;
  channels: Option<"channels">[];
  software: Option<"software">[];
  experience?: Option<"experience">;
  storeName?: string;
  storeUrl?: string;
  monthlySales?: Option<"monthlySales">;
};
export type OnboardingInput = {
  token: string;
  withdrawal: string;
  consentVersion: typeof onboardingContract.consentVersion;
  consent: true;
  marketingConsent: boolean;
  country: "CA";
  locale: "en" | "fr";
  contact: string;
  email: string;
  province: Option<"provinces">;
  games: Option<"games">[];
  website?: "";
} & (
  | { intent: "buyer"; buyer: BuyerAnswers; seller?: never }
  | { intent: "seller"; seller: SellerAnswers; buyer?: never }
  | { intent: "both"; buyer: BuyerAnswers; seller: SellerAnswers }
);
export type OnboardingReceipt = {
  ok: true;
  status: "received_unverified";
  emailVerified: false;
};

export const acquisitionSources = [
  "direct",
  "newsletter",
  "social",
  "event",
  "partner",
] as const;
function selections(
  value: unknown,
  allowed: readonly string[],
  required = false,
) {
  if (
    !Array.isArray(value) ||
    value.length > allowed.length ||
    (required && !value.length)
  )
    throw new DomainError("invalid_input");
  return [...new Set(value.map((item) => choice(item, allowed)))];
}
function optional(v: unknown, allowed: readonly string[]) {
  return choice(v ?? "not_specified", allowed);
}
function storeUrl(value: unknown) {
  const raw = text(value ?? "", 300);
  if (!raw) return "";
  try {
    const url = new URL(raw);
    if (
      !["https:", "http:"].includes(url.protocol) ||
      url.username ||
      url.password
    )
      throw new Error("invalid");
  } catch {
    throw new DomainError("invalid_input");
  }
  return raw;
}
export function onboardingSignup(value: unknown) {
  const v = object(value),
    c = onboardingContract;
  if (
    v.consent !== true ||
    v.consentVersion !== c.consentVersion ||
    v.country !== "CA"
  )
    throw new DomainError("consent_required");
  if (typeof v.marketingConsent !== "boolean" || text(v.website ?? "", 100))
    throw new DomainError("invalid_input");
  const intent = choice(v.intent, c.intent),
    email = text(v.email, 254).toLowerCase();
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email))
    throw new DomainError("invalid_input");
  const contact = text(v.contact, 100);
  if (
    !contact ||
    (intent === "buyer" && v.seller !== undefined) ||
    (intent === "seller" && v.buyer !== undefined)
  )
    throw new DomainError("invalid_input");
  const common = {
    schemaVersion: 2,
    intent,
    contact,
    games: selections(v.games, c.games, true),
    province: choice(v.province, c.provinces),
    marketingConsent: v.marketingConsent,
    marketingConsentVersion: c.consentVersion,
  };
  let buyer: Record<string, unknown> | null = null;
  let seller: Record<string, unknown> | null = null;
  if (intent !== "seller") {
    const b = object(v.buyer);
    buyer = {
      ...common,
      frequency: optional(b.frequency, c.frequency),
      monthlySpend: optional(b.monthlySpend, c.monthlySpend),
      channels: selections(b.channels, c.channels),
      frustrations: text(b.frustrations ?? "", 500, true),
      desiredFeatures: selections(b.desiredFeatures ?? [], c.desiredFeatures),
      wishlist: text(b.wishlist ?? "", 1000, true),
    };
  }
  if (intent !== "buyer") {
    const s = object(v.seller);
    if (s.adult !== true) throw new DomainError("invalid_input");
    seller = {
      ...common,
      adult: true,
      sellerType: choice(s.sellerType, c.sellerType),
      inventory: choice(s.inventory, c.inventory),
      initialListings: choice(s.initialListings, c.initialListings),
      initialListingsScenario: choice(
        s.initialListingsScenario ?? "unspecified",
        c.initialListingsScenario,
      ),
      readiness: choice(s.readiness, c.readiness),
      channels: selections(s.channels, c.channels),
      software: selections(s.software, c.software),
      experience: optional(s.experience, c.experience),
      storeName: text(s.storeName ?? "", 100),
      storeUrl: storeUrl(s.storeUrl),
      monthlySales: optional(s.monthlySales, c.monthlySales),
    };
  }
  return {
    email,
    locale: choice(v.locale, ["en", "fr"]),
    intent,
    buyer,
    seller,
    withdrawal: secret(v.withdrawal),
  };
}

export type SummaryRow = {
  role: "buyer" | "seller";
  email: string;
  details: Record<string, unknown>;
  acquisition: Record<string, unknown>;
};
export function summaryWindow(value: unknown) {
  const v = object(value);
  function date(input: unknown) {
    const s = text(input, 30);
    if (
      !/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/.test(s) ||
      !Number.isFinite(Date.parse(s)) ||
      new Date(s).toISOString() !== s
    )
      throw new DomainError("invalid_input");
    return s;
  }
  const from = date(v.from),
    to = date(v.to);
  if (
    Date.parse(to) <= Date.parse(from) ||
    Date.parse(to) - Date.parse(from) > 366 * 86400000
  )
    throw new DomainError("invalid_input");
  return {
    from,
    to,
    source:
      v.source === undefined ? null : choice(v.source, acquisitionSources),
  };
}
/** Input is oldest first within role; only allowlisted categorical data can leave this function. */
export function summarizeOnboarding(rows: SummaryRow[]) {
  if (rows.length > 10000) throw new DomainError("capacity_exceeded", 413);
  const people = new Map<
    string,
    Partial<Record<"buyer" | "seller", SummaryRow>>
  >();
  for (const row of rows) {
    const key = row.email.trim().toLowerCase(),
      person = people.get(key) ?? {};
    person[row.role] ??= row;
    people.set(key, person);
  }
  const counts: Record<string, Record<string, number>> = {};
  function add(field: string, value: string) {
    const bucket = (counts[field] ??= Object.create(null) as Record<
      string,
      number
    >);
    bucket[value] = (bucket[value] ?? 0) + 1;
  }
  function categorical(
    field: string,
    value: unknown,
    allowed: readonly string[],
  ) {
    add(
      field,
      typeof value === "string" && allowed.includes(value)
        ? value
        : "not_specified",
    );
  }
  const segments = { buyerOnly: 0, sellerOnly: 0, both: 0 };
  let marketingOptIn = 0;
  for (const person of people.values()) {
    segments[
      person.buyer && person.seller
        ? "both"
        : person.buyer
          ? "buyerOnly"
          : "sellerOnly"
    ]++;
    const roles = Object.values(person);
    for (const [field, allowed] of [
      ["games", games],
      ["province", provinces],
      ["source", acquisitionSources],
    ] as const) {
      const values = new Set<string>();
      for (const row of roles) {
        const input =
          field === "source" ? row.acquisition?.source : row.details?.[field];
        for (const item of Array.isArray(input) ? input : [input])
          values.add(
            typeof item === "string" &&
              (allowed as readonly string[]).includes(item)
              ? item
              : "not_specified",
          );
      }
      if (!values.size) values.add("not_specified");
      for (const item of values) add(field, item);
    }
    if (
      roles.some(
        (r) =>
          r.details?.schemaVersion === 2 &&
          r.details?.marketingConsent === true,
      )
    )
      marketingOptIn++;
    for (const [role, fields] of [
      ["buyer", ["frequency", "monthlySpend"]],
      [
        "seller",
        [
          "inventory",
          "initialListings",
          "initialListingsScenario",
          "readiness",
          "monthlySales",
          "sellerType",
        ],
      ],
    ] as const) {
      const row = person[role];
      if (row)
        for (const field of fields)
          categorical(
            `${role}.${field}`,
            row.details?.[field],
            onboardingContract[field],
          );
    }
  }
  return {
    uniqueEmailLeads: people.size,
    segments,
    marketingOptIn,
    distributions: counts,
    provenance: "unverified_self_reported" as const,
    unit: "normalized_email_not_verified_person" as const,
    rangeEstimates: false,
    scope: "active_role_records_created_in_window" as const,
  };
}
