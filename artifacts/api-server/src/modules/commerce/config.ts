export interface CommerceConfig {
  commissionBps: number;
  shippingCommissionBps: number;
  promotedBps: number;
  processingBps: number;
  processingFixedCents: number;
  trackingThresholdCents: number;
  freeShippingLevels: string[];
  taxBps: Record<string, number>;
  shipping: {
    id: string;
    maxCards: number;
    maxGrams: number;
    maxThicknessMm: number;
    tracked: boolean;
    cents: number;
  }[];
  rewards: {
    id: string;
    minimumCards: number;
    maximumSellers: number;
    smartOnly: boolean;
    minimumPriorOrders: number;
    cents: number;
  }[];
  maxLines: number;
  maxQuantity: number;
  candidateLimit: number;
  beamWidth: number;
  maxEvaluations: number;
}
/** Simulation settings, not carrier quotations or a production tax determination. */
export const commerceConfig: CommerceConfig = {
  commissionBps: 800,
  shippingCommissionBps: 0,
  promotedBps: 200,
  processingBps: 290,
  processingFixedCents: 30,
  trackingThresholdCents: 5000,
  freeShippingLevels: ["established", "trusted", "elite"],
  taxBps: {
    AB: 500,
    BC: 1200,
    MB: 1200,
    NB: 1500,
    NL: 1500,
    NS: 1400,
    NT: 500,
    NU: 500,
    ON: 1300,
    PE: 1500,
    QC: 1498,
    SK: 1100,
    YT: 500,
  },
  shipping: [
    {
      id: "letter-small",
      maxCards: 3,
      maxGrams: 30,
      maxThicknessMm: 5,
      tracked: false,
      cents: 150,
    },
    {
      id: "letter-standard",
      maxCards: 10,
      maxGrams: 100,
      maxThicknessMm: 10,
      tracked: false,
      cents: 250,
    },
    {
      id: "letter-large",
      maxCards: 30,
      maxGrams: 250,
      maxThicknessMm: 20,
      tracked: false,
      cents: 400,
    },
    {
      id: "tracked-parcel",
      maxCards: 10000,
      maxGrams: 30000,
      maxThicknessMm: 2000,
      tracked: true,
      cents: 1200,
    },
  ],
  rewards: [
    {
      id: "multi-card",
      minimumCards: 20,
      maximumSellers: 100,
      smartOnly: false,
      minimumPriorOrders: 0,
      cents: 25,
    },
    {
      id: "consolidated-smart",
      minimumCards: 20,
      maximumSellers: 1,
      smartOnly: true,
      minimumPriorOrders: 0,
      cents: 50,
    },
    {
      id: "repeat",
      minimumCards: 10,
      maximumSellers: 100,
      smartOnly: false,
      minimumPriorOrders: 2,
      cents: 25,
    },
  ],
  maxLines: 100,
  maxQuantity: 100,
  candidateLimit: 8,
  beamWidth: 24,
  maxEvaluations: 2500,
};
