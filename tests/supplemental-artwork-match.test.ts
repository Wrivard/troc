import { test } from "node:test";
import assert from "node:assert/strict";
import {
  matchSupplementalArtwork,
  type ArtworkIdentity,
  type ArtworkCandidate,
} from "../scripts/catalog/match-supplemental-artwork";
const identity: ArtworkIdentity = {
  game: "pokemon",
  language: "en",
  setKey: "canonical-skyridge",
  number: "H01",
  name: "Alakazam",
  finish: "holo",
  artworkVariant: "standard",
  side: "front",
};
const candidate: ArtworkCandidate = {
  ...identity,
  provider: "approved-fixture",
  setKey: "source-skyridge",
  externalId: "source-H01",
  sourceUrl: "https://example.invalid/H01",
};
const mappings = [
  {
    provider: candidate.provider,
    sourceSetKey: candidate.setKey,
    canonicalSetKey: identity.setKey,
    evidence: "fixture-approved-mapping",
  },
];
const approved = new Set([candidate.provider]);
test("only one exact, approved printing match is eligible", () =>
  assert.equal(
    matchSupplementalArtwork(identity, [candidate], mappings, approved).status,
    "matched",
  ));
test("cross-source matches reject edition, language, number, finish and alternate-art differences", () => {
  for (const patch of [
    { setKey: "another-set" },
    { language: "fr" },
    { number: "1" },
    { number: "H1" },
    { finish: "reverse-holo" },
    { artworkVariant: "alternate" },
    { side: "back" as const },
    { game: "magic" },
    { name: "Dark Alakazam" },
  ])
    assert.equal(
      matchSupplementalArtwork(
        identity,
        [{ ...candidate, ...patch }],
        mappings,
        approved,
      ).status,
      "quarantined",
    );
});
test("unknown identity, ambiguous candidates, absent evidence and unapproved providers are quarantined", () => {
  assert.equal(
    matchSupplementalArtwork(
      { ...identity, finish: null },
      [candidate],
      mappings,
      approved,
    ).status,
    "quarantined",
  );
  assert.equal(
    matchSupplementalArtwork(
      identity,
      [candidate, { ...candidate, externalId: "another" }],
      mappings,
      approved,
    ).status,
    "quarantined",
  );
  assert.equal(
    matchSupplementalArtwork(identity, [candidate], [], approved).status,
    "quarantined",
  );
  assert.equal(
    matchSupplementalArtwork(identity, [candidate], mappings, new Set()).status,
    "quarantined",
  );
});

test('conflicting set mapping and unsafe image URLs never qualify',()=>{
 const conflicting=[...mappings,{...mappings[0],canonicalSetKey:'wrong-edition'}];
 assert.equal(matchSupplementalArtwork(identity,[candidate],conflicting,approved).status,'quarantined');
 for(const sourceUrl of ['https://','javascript:alert(1)','https://user:password@example.invalid/card'])assert.equal(matchSupplementalArtwork(identity,[{...candidate,sourceUrl}],mappings,approved).status,'quarantined');
});
