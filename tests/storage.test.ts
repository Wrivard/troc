import test from "node:test";
import assert from "node:assert/strict";
import { PublicListingPhotoStorage } from "../artifacts/api-server/src/modules/storage/listing-photos";
test("listing photos stay under an operator-configured HTTPS storage base", async () => {
  const storage = new PublicListingPhotoStorage(
    "https://storage.example/listing-photos/",
  );
  assert.equal(
    (await storage.readUrl("seller/card front.png")).url,
    "https://storage.example/listing-photos/seller/card%20front.png",
  );
  for (const key of ["../private", "/absolute", "a//b", "a\\b", "listing-quarantine/upload/image.webp"])
    await assert.rejects(storage.readUrl(key));
  assert.throws(() => new PublicListingPhotoStorage("http://storage.example/"));
  assert.throws(
    () =>
      new PublicListingPhotoStorage("https://user:password@storage.example/"),
  );
});
