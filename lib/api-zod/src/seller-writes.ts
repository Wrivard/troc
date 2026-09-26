import { z } from "zod";

/** HTTP write contracts. Authorization and transactional invariants remain in services. */
const requestId = z
  .string()
  .regex(/^[0-9a-f]{8}(-[0-9a-f]{4}){3}-[0-9a-f]{12}$/i);
const message = z.string().trim().min(1).max(2000);
export const enquiryCreateSchema = z
  .object({
    key: requestId,
    subject: z.string().trim().min(1).max(120),
    body: message,
  })
  .strict();
export const enquiryReplySchema = z
  .object({ key: requestId, body: message })
  .strict();
export const sellerSettingsWriteSchema = z
  .object({
    displayName: z.string().max(50).trim().min(1),
    version: z.string().max(80).trim().min(1),
    minimumOrderCents: z.union([
      z.literal(0),
      z.literal(200),
      z.literal(500),
      z.literal(1000),
    ]),
    handlingDays: z.number().int().min(0).max(30),
    freeShippingCents: z.number().int().min(0).max(100000000).nullable().optional(),
  })
  .strict();
export type EnquiryCreateInput = z.infer<typeof enquiryCreateSchema>;
export type EnquiryReplyInput = z.infer<typeof enquiryReplySchema>;
export type SellerSettingsWriteInput = z.infer<
  typeof sellerSettingsWriteSchema
>;

export const storefrontDescriptionWriteSchema = z
  .object({
    version: z.string().min(1).max(80),
    storyEn: z.string().max(500).trim(),
    storyFr: z.string().max(500).trim(),
  })
  .strict();

const calendarDate = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}$/)
  .refine((value) => {
    const time = Date.parse(value + "T00:00:00Z");
    return (
      Number.isFinite(time) &&
      new Date(time).toISOString().slice(0, 10) === value
    );
  });
export const promotionDraftSchema = z
  .object({
    id: requestId,
    name: z.string().trim().min(1).max(80),
    percent: z.number().int().min(1).max(90),
    minimum: z.number().int().min(1).max(10000),
    minimumCents: z.number().int().min(0).max(100000000).optional(),
    coupon: z.string().regex(/^([A-Z0-9-]{3,24})?$/),
    start: calendarDate,
    end: calendarDate,
  })
  .strict()
  .refine((d) => d.end >= d.start, { message: "invalid_date_range" });
export const promotionDraftSetSchema = z
  .object({
    key: requestId,
    version: z.number().int().min(0).max(Number.MAX_SAFE_INTEGER),
    drafts: z.array(promotionDraftSchema).max(100),
  })
  .strict()
  .refine((v) => new Set(v.drafts.map((d) => d.id)).size === v.drafts.length, {
    message: "duplicate_id",
  })
  .refine(
    (v) => {
      const codes = v.drafts.map((d) => d.coupon).filter(Boolean);
      return new Set(codes).size === codes.length;
    },
    { message: "duplicate_coupon" },
  );

export const sellerMemberWriteSchema = z.union([
  z.object({ userId: requestId, role: z.string().max(30).nullable() }).strict(),
  z
    .object({
      email: z.string().max(254).trim().email(),
      role: z.string().max(30).nullable(),
    })
    .strict(),
]);

export const enquiryReportSchema = z
  .object({
    key: requestId,
    messageId: requestId,
    reason: z.enum(["spam", "harassment", "fraud", "other"]),
    details: z.string().max(1000).trim().default(""),
  })
  .strict();

export const enquiryReportReviewSchema = z
  .object({
    key: requestId,
    decision: z.enum(["resolved", "dismissed"]),
    note: z.string().max(1000).trim().min(1),
  })
  .strict();

export const enquiryBlockSchema = z
  .object({
    key: requestId,
    blocked: z.boolean(),
    version: z.number().int().min(0).max(2147483646),
  })
  .strict();
