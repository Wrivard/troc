import { PGlite } from "@electric-sql/pglite";
import { strict as assert } from "node:assert";
import { createHash } from "node:crypto";
import { mkdtempSync, mkdirSync, writeFileSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, resolve, sep } from "node:path";
import { promoteLocalThumbnails } from "./catalog/promote-thumbnails";
const original = process.cwd(),
  temp = mkdtempSync(join(tmpdir(), "troc-thumbnails-"));
if (
  !resolve(temp).startsWith(resolve(tmpdir()) + sep) ||
  !temp.includes("troc-thumbnails-")
)
  throw Error("unsafe_cleanup");
const db = new PGlite();
try {
  process.chdir(temp);
  mkdirSync("catalog-data");
  mkdirSync("artifacts/marketplace/public/catalog-art", { recursive: true });
  const url = "/catalog-art/retained-" + "a".repeat(64) + "-360.webp";
  writeFileSync("artifacts/marketplace/public" + url, "fixture");
  const renditions = [
    { sourceUrl: "/catalog-art/abc-600.webp", url, width: 360 },
    { sourceUrl: "/catalog-art/def-600.webp", url, width: 360 },
  ];
  const revision = createHash("sha256")
    .update(JSON.stringify(renditions))
    .digest("hex");
  writeFileSync(
    "catalog-data/thumbnail-renditions.json",
    JSON.stringify({ revision, renditions }),
  );
  await db.exec(
    `CREATE SCHEMA troc; CREATE TABLE troc.catalog_image_renditions(image_id text,width integer,url text,PRIMARY KEY(image_id,width)); INSERT INTO troc.catalog_image_renditions VALUES ('owned',600,'/catalog-art/abc-600.webp'),('manual',600,'/catalog-art/def-600.webp'),('manual',360,'/manual.webp'),('unrelated',600,'/unrelated.webp')`,
  );
  process.env.TROC_LOCAL_ACCOUNTS = "true";
  process.env.NODE_ENV = "development";
  await promoteLocalThumbnails(db);
  assert.equal(
    (
      await db.query<{ url: string }>(
        "SELECT url FROM troc.catalog_image_renditions WHERE image_id='owned' AND width=360",
      )
    ).rows[0].url,
    url,
  );
  assert.equal(
    (
      await db.query<{ url: string }>(
        "SELECT url FROM troc.catalog_image_renditions WHERE image_id='manual' AND width=360",
      )
    ).rows[0].url,
    "/manual.webp",
  );
  assert.equal(
    (
      await db.query(
        "SELECT * FROM troc.catalog_image_renditions WHERE image_id='unrelated'",
      )
    ).rows.length,
    1,
  );
  assert.equal((await promoteLocalThumbnails(db)).skipped, true);
  process.env.NODE_ENV = "production";
  await assert.rejects(
    () => promoteLocalThumbnails(db),
    /local_thumbnails_only/,
  );
  process.env.NODE_ENV = "development";
  writeFileSync(
    "catalog-data/thumbnail-renditions.json",
    JSON.stringify({ revision: "bad", renditions }),
  );
  await assert.rejects(() => promoteLocalThumbnails(db), /checksum/);
  console.log(
    "PASS exact-source association, manual preservation, unrelated isolation, idempotent replay, production guard, checksum",
  );
} finally {
  await db.close();
  process.chdir(original);

  rmSync(temp, { recursive: true, force: true });
}
