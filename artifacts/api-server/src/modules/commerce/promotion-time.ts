import type { Promotion } from "@workspace/commerce";
/** Invalid/partial schedules never grant a discount. This does not activate draft records. */
export function promotionActiveAt(promotion: Promotion, now: number): boolean {
  if (promotion.startsAt === undefined && promotion.endsAt === undefined) return true;
  const instant = (value: unknown) => {
    if (typeof value !== "string" || !/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/.test(value)) return NaN;
    const time = Date.parse(value);
    return Number.isFinite(time) && new Date(time).toISOString() === value ? time : NaN;
  };
  const start = instant(promotion.startsAt), end = instant(promotion.endsAt);
  return Number.isFinite(now) && start < end && start <= now && now < end;
}
