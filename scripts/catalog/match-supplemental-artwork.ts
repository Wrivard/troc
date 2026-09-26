/** A source match attaches artwork to one existing printing; it never merges catalogue IDs. */
export interface ArtworkIdentity {
  game: string;
  language: string;
  setKey: string;
  number: string;
  name: string;
  finish: string | null;
  artworkVariant: string | null;
  side: "front" | "back" | "detail";
}
export interface ArtworkCandidate extends ArtworkIdentity {
  provider: string;
  externalId: string;
  sourceUrl: string;
}
export interface VerifiedSetMapping {
  provider: string;
  sourceSetKey: string;
  canonicalSetKey: string;
  evidence: string;
}
export type MatchDecision =
  | { status: "matched"; candidate: ArtworkCandidate }
  | { status: "quarantined"; reason: string };
const exact = (value: string) =>
  value.normalize("NFC").trim().toLocaleLowerCase("en");
export function matchSupplementalArtwork(
  identity: ArtworkIdentity,
  candidates: readonly ArtworkCandidate[],
  mappings: readonly VerifiedSetMapping[],
  approvedProviders: ReadonlySet<string>,
): MatchDecision {
  // Unknown finish/alternate art cannot safely identify a printing across providers.
  if (!identity.finish || !identity.artworkVariant)
    return { status: "quarantined", reason: "unresolved_canonical_printing" };
  const matches = candidates.filter((c) => {
    if (
      !approvedProviders.has(c.provider) ||
      !c.externalId ||
      !safeSourceUrl(c.sourceUrl)
    )
      return false;
    const mapping = mappings.filter(
      (m) =>
        m.provider === c.provider &&
        m.sourceSetKey === c.setKey &&
        Boolean(m.evidence.trim()),
    );
    return (
      mapping.length === 1 &&
      mapping[0].canonicalSetKey === identity.setKey &&
      c.game === identity.game &&
      c.language === identity.language &&
      c.number === identity.number &&
      exact(c.name) === exact(identity.name) &&
      c.finish === identity.finish &&
      c.artworkVariant === identity.artworkVariant &&
      c.side === identity.side
    );
  });
  if (matches.length !== 1)
    return {
      status: "quarantined",
      reason: matches.length
        ? "ambiguous_candidates"
        : "no_exact_approved_match",
    };
  return { status: "matched", candidate: matches[0] };
}

function safeSourceUrl(value: string): boolean {
  try {
    const u = new URL(value);
    return (
      u.protocol === "https:" &&
      !u.username &&
      !u.password &&
      Boolean(u.hostname)
    );
  } catch {
    return false;
  }
}
