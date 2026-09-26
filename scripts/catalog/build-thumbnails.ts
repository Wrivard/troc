import sharp from "sharp";
import { createHash } from "node:crypto";
import {
  existsSync,
  mkdirSync,
  readFileSync,
  writeFileSync,
  renameSync,
} from "node:fs";
import { resolve } from "node:path";
import { sampleProducts } from "../../artifacts/api-server/src/modules/catalog/sample/data";
const width = Number(process.env.TROC_THUMBNAIL_WIDTH ?? 360);
if (width !== 96 && width !== 360) throw Error("unsupported_thumbnail_width");
const manifest = JSON.parse(readFileSync("catalog-data/current.json", "utf8"));
if (!/^[a-f0-9]{64}$/.test(manifest.revision))
  throw Error("invalid_catalogue_revision");
const recordBytes = readFileSync(
  `catalog-data/releases/${manifest.revision}/records.jsonl`,
);
if (
  createHash("sha256").update(recordBytes).digest("hex") !== manifest.revision
)
  throw Error("catalogue_checksum_mismatch");
const records = recordBytes
  .toString()
  .trim()
  .split("\n")
  .map((r) => JSON.parse(r));
type Thumbnail = {
  sourceUrl: string;
  url: string;
  width: number;
  bytes: number;
  sourceBytes: number;
};
const products: {
  images?: { sources?: { url: string; width: number }[] }[];
}[] = [...records.map((r) => r.product), ...sampleProducts];
const urls = [
  ...new Set<string>(
    products.flatMap((p) =>
      (p.images ?? []).flatMap((image) => {
        const source = [...(image.sources ?? [])].sort(
          (a, b) => b.width - a.width,
        )[0];
        return source?.width > width ? [source.url] : [];
      }),
    ),
  ),
].sort();
const path = width === 360 ? "catalog-data/thumbnail-renditions.json" : "catalog-data/thumbnail-renditions-96.json";
const previous: Thumbnail[] = existsSync(path)
  ? JSON.parse(readFileSync(path, "utf8")).renditions
  : [];
const known = new Map(previous.map((r) => [r.sourceUrl, r]));
const output = resolve("artifacts/marketplace/public");
mkdirSync("catalog-data/image-work", { recursive: true });
let index = 0;
const rows: Thumbnail[] = [];
async function worker() {
  while (index < urls.length) {
    const sourceUrl = urls[index++];
    if (!/^\/catalog-art\/(?:retained-)?[a-f0-9]+-\d+\.webp$/.test(sourceUrl))
      throw Error("invalid_source_path");
    const prior = known.get(sourceUrl);
    if (
      prior &&
      /^\/catalog-art\/retained-[a-f0-9]{64}-(?:96|360)\.webp$/.test(prior.url) && prior.url.endsWith("-" + width + ".webp") &&
      prior.width === width &&
      existsSync(resolve(output, prior.url.slice(1)))
    ) {
      rows.push(prior);
      continue;
    }
    const raw = readFileSync(resolve(output, sourceUrl.slice(1)));
    const data = await sharp(raw)
      .resize({ width, withoutEnlargement: true })
      .webp({ quality: 82, effort: 4 })
      .toBuffer();
    const digest = createHash("sha256").update(data).digest("hex");
    const url = "/catalog-art/retained-" + digest + "-" + width + ".webp";
    const target = resolve(output, url.slice(1));
    if (!existsSync(target)) {
      const tmp = resolve("catalog-data/image-work", digest + ".tmp");
      writeFileSync(tmp, data);
      renameSync(tmp, target);
    }
    rows.push({
      sourceUrl,
      url,
      width,
      bytes: data.length,
      sourceBytes: raw.length,
    });
    if (rows.length % 2000 === 0)
      console.log({ completed: rows.length, total: urls.length });
  }
}
await Promise.all(Array.from({ length: 4 }, worker));
rows.sort((a, b) => a.sourceUrl.localeCompare(b.sourceUrl));
const revision = createHash("sha256")
  .update(JSON.stringify(rows))
  .digest("hex");
writeFileSync(path + ".tmp", JSON.stringify({ revision, renditions: rows }));
renameSync(path + ".tmp", path);
console.log({
  revision,
  renditions: rows.length,
  sourceBytes: rows.reduce((n, r) => n + r.sourceBytes, 0),
  thumbnailBytes: rows.reduce((n, r) => n + r.bytes, 0),
});
