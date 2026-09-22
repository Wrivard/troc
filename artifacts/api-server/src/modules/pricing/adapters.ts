import { pool } from "@workspace/db";
import type {
  FxProvider,
  PricingProvider,
  PageRequest,
  ReferencePrice,
} from "../providers/contracts";
import { DomainError, money } from "../shared/domain";
import { demoCatalog } from "../catalog/demo";
export function convertToCadCents(
  sourceMinorUnits: number,
  rate: string,
  minorDigits = 2,
) {
  if (
    !Number.isSafeInteger(sourceMinorUnits) ||
    sourceMinorUnits < 0 ||
    !/^\d+(\.\d{1,12})?$/.test(rate) ||
    !Number.isInteger(minorDigits) ||
    minorDigits < 0 ||
    minorDigits > 4
  )
    throw new DomainError("invalid_fx");
  const [whole, fraction = ""] = rate.split(".");
  const numerator = BigInt(whole + fraction);
  const denominator = 10n ** BigInt(fraction.length + minorDigits);
  if (numerator <= 0n) throw new DomainError("invalid_fx");
  const total = BigInt(sourceMinorUnits) * numerator * 100n;
  const rounded = (total + denominator / 2n) / denominator;
  if (rounded > BigInt(Number.MAX_SAFE_INTEGER))
    throw new DomainError("invalid_money");
  return Number(rounded);
}
export class PostgresFxProvider implements FxProvider {
  async rate(input: { from: string; to: "CAD"; date: string }) {
    if (!/^\d{4}-\d{2}-\d{2}$/.test(input.date))
      throw new DomainError("invalid_fx");
    if (input.from === "CAD")
      return { rate: "1", asOf: input.date, provider: "identity" };
    const result = await pool.query(
      'SELECT rate::text,rate_date::text AS "asOf",provider FROM troc.fx_rates WHERE source_currency=$1 AND target_currency=$2 AND rate_date<=$3 ORDER BY rate_date DESC,provider LIMIT 1',
      [input.from, input.to, input.date],
    );
    if (!result.rows[0]) throw new DomainError("fx_unavailable", 503);
    return result.rows[0];
  }
}
export class DemoPricingProvider implements PricingProvider {
  async references(ids: string[], page: PageRequest) {
    if (ids.length > 100 || page.limit < 1 || page.limit > 100)
      throw new DomainError("invalid_page");
    const points = demoCatalog().prices.filter((p) =>
      ids.includes(p.variantId),
    );
    const offset = Number(page.cursor || 0);
    if (!Number.isSafeInteger(offset) || offset < 0)
      throw new DomainError("invalid_cursor");
    const items: ReferencePrice[] = points
      .slice(offset, offset + page.limit)
      .map((p) => ({
        variantId: p.variantId,
        source: {
          provider: p.provider,
          externalId: `fixture:${p.variantId}`,
          license: "Original fictional fixture",
          capturedAt: p.capturedAt,
        },
        sourceCurrency: p.sourceCurrency,
        sourceMinorUnits: p.sourceMinorUnits,
        providerUpdatedAt: p.providerUpdatedAt,
        cad: money(p.cents),
        fxRate: p.fxRate,
        fxDate: p.fxDate,
      }));
    return {
      items,
      nextCursor:
        offset + page.limit < points.length
          ? String(offset + page.limit)
          : undefined,
    };
  }
}
