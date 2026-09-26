import sharp from "sharp";
import { mkdirSync, existsSync, renameSync, unlinkSync } from "node:fs";
import { resolve } from "node:path";
import { db, download, hash } from "./store";
/** Full-card resize only. Temporary files stay outside the public/build directory. */
export async function cacheArtwork(sourceUrl: string, downloadUrl = sourceUrl) {
  const output = resolve("artifacts/marketplace/public/catalog-art"),
    work = resolve("catalog-data/image-work");
  mkdirSync(output, { recursive: true });
  mkdirSync(work, { recursive: true });
  const raw = await download(downloadUrl, 12_000_000),
    meta = await sharp(raw, { limitInputPixels: 40_000_000 }).metadata();
  if (!meta.width || !meta.height || meta.width > 12000 || meta.height > 12000)
    throw Error("invalid_image_dimensions");
  const digest = hash(raw),
    sources: { url: string; width: number }[] = [];
  for (const width of [
    ...new Set([Math.min(245, meta.width), Math.min(600, meta.width)]),
  ]) {
    const filename = "retained-" + digest + "-" + width + ".webp",
      target = resolve(output, filename),
      temporary = resolve(
        work,
        filename + "-" + hash(sourceUrl).slice(0, 16) + ".tmp",
      );
    if (!existsSync(target)) {
      await sharp(raw)
        .resize({ width, withoutEnlargement: true })
        .webp({ quality: 86, effort: 3 })
        .toFile(temporary);
      if (existsSync(target)) unlinkSync(temporary);
      else renameSync(temporary, target);
    }
    sources.push({ url: "/catalog-art/" + filename, width });
  }
  const payload = {
    url: sources.at(-1)!.url,
    sources,
    width: meta.width,
    height: meta.height,
    sha256: digest,
    acquiredFrom: downloadUrl,
  };
  db.prepare(
    "UPDATE assets SET state='ready',payload=?,error=NULL,attempts=attempts+1 WHERE source_url=?",
  ).run(JSON.stringify(payload), sourceUrl);
  return payload;
}
