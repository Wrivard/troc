import { test } from "node:test";
import assert from "node:assert/strict";
import {
  identity,
  digest,
  makeBaseline,
  assertBaseline,
  assertIdentityUnchanged,
  auditIdentities,
  artworkIdentity,
  assertArtworkBaseline,
} from "../scripts/catalog/identity-integrity";
type FixtureImage = {id:string;side:string;position:number;sha256:string;url:string;provenance:{provider:string;externalId:string;sourceUrl:string}};
const noImages: FixtureImage[] = [];
const record = {
  sourceKey: "source:1:en",
  provider: "source",
  externalId: "1",
  game: "pokemon",
  set: { id: "s", gameId: "g", slug: "set" },
  product: {
    id: "p",
    setId: "s",
    gameId: "g",
    type: "raw_single",
    name: { en: "Card" },
    images: [
      {
        id: "img",
        side: "front",
        position: 0,
        sha256: "abc",
        url: "/art/a.webp",
        provenance: {
          provider: "source",
          externalId: "1",
          sourceUrl: "https://example.invalid/a",
        },
      },
    ],
    variants: [
      {
        id: "v",
        printingId: "pr",
        language: "en",
        key: "holo",
        number: "H01",
        attributes: { finish: "holo" },
        images: noImages,
      },
    ],
  },
};
const clone = () => structuredClone(record);
test("identity baseline accepts exact replay and presentation-only changes", () => {
  const b = makeBaseline([record], "revision");
  const r = {...clone(), capturedAt:"later"};
  assertBaseline([r], b);
  assertIdentityUnchanged(record, r);
  assert.equal(digest(identity(record)), digest(identity(r)));
});
test("edition, language, collector number, variant and name changes require review", () => {
  for (const mutate of [
    (r: typeof record) => (r.product.setId = "other"),
    (r: typeof record) => (r.product.variants[0].language = "fr"),
    (r: typeof record) => (r.product.variants[0].number = "H1"),
    (r: typeof record) => (r.product.variants[0].attributes.finish = "reverse"),
    (r: typeof record) => (r.product.variants[0].id = "new"),
    (r: typeof record) => (r.product.name.en = "Other"),
  ]) {
    const r = clone();
    mutate(r);
    assert.throws(() => assertIdentityUnchanged(record, r));
    assert.throws(() => assertBaseline([r], makeBaseline([record], "r")));
  }
});
test("duplicate/reassigned IDs, deleted and new records fail publication", () => {
  assert.ok(auditIdentities([record, record]).length);
  const b = makeBaseline([record], "r");
  assert.throws(() => assertBaseline([], b));
  const r = clone();
  r.sourceKey = "new";
  assert.throws(() => assertBaseline([r], b));
  b.identities[record.sourceKey] = "tampered";
  assert.throws(() => assertBaseline([record], b));
});
test("artwork swap, face swap and changed variant attachment require review", () => {
  const identities = { [record.sourceKey]: digest(artworkIdentity(record)) };
  const b = {
    ...makeBaseline([record], "r"),
    identities,
    checksum: digest(identities),
  };
  assertArtworkBaseline([record], b);
  for (const mutate of [
    (r: typeof record) => (r.product.images[0].sha256 = "changed"),
    (r: typeof record) => (r.product.images[0].side = "back"),
    (r: typeof record) => (r.product.images[0].provenance.externalId = "2"),
    (r: typeof record) => (r.product.variants[0].images = r.product.images),
  ]) {
    const r = clone();
    mutate(r);
    assert.throws(() => assertArtworkBaseline([r], b));
  }
});
