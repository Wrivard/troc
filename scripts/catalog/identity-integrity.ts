import { createHash } from "node:crypto";
import { readFileSync, existsSync } from "node:fs";
import { resolve } from "node:path";
export function canonical(value: unknown): string {
  if (Array.isArray(value)) return "[" + value.map(canonical).join(",") + "]";
  if (value && typeof value === "object")
    return (
      "{" +
      Object.entries(value)
        .sort(([a], [b]) => a.localeCompare(b))
        .map(([k, v]) => JSON.stringify(k) + ":" + canonical(v))
        .join(",") +
      "}"
    );
  return JSON.stringify(value ?? null);
}
export const digest = (v: unknown) =>
  createHash("sha256").update(canonical(v)).digest("hex");
export function identity(r: any) {
  const p = r.product;
  if (
    !r.sourceKey ||
    !r.provider ||
    !r.externalId ||
    !p?.id ||
    !r.set?.id ||
    p.setId !== r.set.id ||
    p.gameId !== r.set.gameId ||
    !p.variants?.length
  )
    throw Error("invalid_identity_structure");
  return {
    sourceKey: r.sourceKey,
    provider: r.provider,
    externalId: r.externalId,
    game: r.game,
    productId: p.id,
    gameId: p.gameId,
    setId: p.setId,
    setSlug: r.set.slug,
    type: p.type,
    name: p.name,
    variants: p.variants
      .map((v: any) => {
        if (!v.id || !v.printingId || !v.language || !v.key || !v.number)
          throw Error("incomplete_variant_identity");
        return {
          id: v.id,
          printingId: v.printingId,
          language: v.language,
          key: v.key,
          number: v.number,
          attributes: v.attributes ?? {},
        };
      })
      .sort((a: any, b: any) => a.id.localeCompare(b.id)),
  };
}
export function assertIdentityUnchanged(before: any, after: any) {
  if (digest(identity(before)) !== digest(identity(after)))
    throw Error("catalogue_identity_change_requires_review:" + after.sourceKey);
}
export function auditIdentities(records: readonly any[]) {
  const issues: { sourceKey: string; reason: string }[] = [],
    owners = new Map<string, string>(),
    printing = new Map<string, string>();
  for (const r of records) {
    try {
      const i = identity(r);
      for (const key of [
        "source:" + i.sourceKey,
        "product:" + i.productId,
        ...i.variants.map((v: any) => "variant:" + v.id),
      ]) {
        if (owners.has(key))
          issues.push({
            sourceKey: i.sourceKey,
            reason: "duplicate_identity:" + key,
          });
        else owners.set(key, i.sourceKey);
      }
      for (const v of i.variants) {
        const signature = canonical([i.productId, v.language, v.number]);
        const old = printing.get(v.printingId);
        if (old && old !== signature)
          issues.push({
            sourceKey: i.sourceKey,
            reason: "printing_reassigned:" + v.printingId,
          });
        printing.set(v.printingId, signature);
      }
    } catch (e) {
      issues.push({ sourceKey: r.sourceKey ?? "unknown", reason: String(e) });
    }
  }
  return issues;
}
export interface IdentityBaseline {
  version: 1;
  release: string;
  status: "established-not-independently-verified";
  identities: Record<string, string>;
  checksum: string;
}
export function makeBaseline(
  records: readonly any[],
  release: string,
): IdentityBaseline {
  const issues = auditIdentities(records);
  if (issues.length)
    throw Error(
      "identity_integrity_failed:" + JSON.stringify(issues.slice(0, 5)),
    );
  const identities = Object.fromEntries(
    records.map((r) => [r.sourceKey, digest(identity(r))]),
  );
  return {
    version: 1,
    release,
    status: "established-not-independently-verified",
    identities,
    checksum: digest(identities),
  };
}
export function assertBaseline(
  records: readonly any[],
  baseline: IdentityBaseline,
) {
  if (
    baseline.version !== 1 ||
    digest(baseline.identities) !== baseline.checksum
  )
    throw Error("identity_baseline_checksum_mismatch");
  const issues = auditIdentities(records);
  if (issues.length)
    throw Error(
      "identity_integrity_failed:" + JSON.stringify(issues.slice(0, 5)),
    );
  const seen = new Set<string>();
  for (const r of records) {
    seen.add(r.sourceKey);
    if (baseline.identities[r.sourceKey] !== digest(identity(r)))
      throw Error("unreviewed_catalogue_identity:" + r.sourceKey);
  }
  for (const key of Object.keys(baseline.identities))
    if (!seen.has(key)) throw Error("catalogue_identity_removed:" + key);
}
export function assertPublishedIdentities(records: readonly any[]) {
  const file = resolve("catalog-data/identity-baseline.json");
  if (!existsSync(file)) throw Error("identity_baseline_required");
  assertBaseline(records, JSON.parse(readFileSync(file, "utf8")));
  assertArtworkBaseline(
    records,
    JSON.parse(
      readFileSync(resolve("catalog-data/artwork-baseline.json"), "utf8"),
    ),
  );
}

export function artworkIdentity(r: any) {
  const image = (i: any) => ({
    id: i.id,
    side: i.side,
    position: i.position,
    sha256: i.sha256 ?? null,
    url: i.url,
    provider: i.provenance?.provider,
    externalId: i.provenance?.externalId,
    sourceUrl: i.provenance?.sourceUrl,
  });
  return {
    sourceKey: r.sourceKey,
    images: (r.product.images ?? [])
      .map(image)
      .sort((a: any, b: any) => String(a.id).localeCompare(String(b.id))),
    variants: r.product.variants
      .map((v: any) => ({
        id: v.id,
        images: (v.images ?? [])
          .map(image)
          .sort((a: any, b: any) => String(a.id).localeCompare(String(b.id))),
      }))
      .sort((a: any, b: any) => a.id.localeCompare(b.id)),
  };
}
export function assertArtworkBaseline(
  records: readonly any[],
  baseline: IdentityBaseline,
) {
  if (digest(baseline.identities) !== baseline.checksum)
    throw Error("artwork_baseline_checksum_mismatch");
  for (const r of records)
    if (baseline.identities[r.sourceKey] !== digest(artworkIdentity(r)))
      throw Error("unreviewed_artwork_association:" + r.sourceKey);
}
