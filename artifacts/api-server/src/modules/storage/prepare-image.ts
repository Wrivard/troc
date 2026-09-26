import sharp from "sharp";
import { createHash } from "node:crypto";
import { DomainError } from "../shared/domain";

// Technical ingress limits, not seller entitlement or publication approval.
export const imageLimits = { bytes: 10 * 1024 * 1024, pixels: 24_000_000, edge: 12000, outputEdge: 2400, concurrent: 2, processingSeconds: 5 } as const;
const mimeFormats = new Map([["image/jpeg", "jpeg"], ["image/png", "png"], ["image/webp", "webp"]]);
/** Produces quarantined display bytes only. Never authorizes an owner or publishes a photo. */
let activePreparations = 0;
export async function prepareImage(input: Buffer, declaredType: string) {
  // Reject excess work before copying bytes; never retain an unbounded queue.
  if (activePreparations >= imageLimits.concurrent) throw new DomainError("image_processing_busy", 503);
  activePreparations++;
  try { return await decodeImage(input, declaredType); }
  finally { activePreparations--; }
}
async function decodeImage(input: Buffer, declaredType: string) {
  if (!input.length || input.length > imageLimits.bytes) throw new DomainError("image_size_invalid", 422);
  const expected = mimeFormats.get(declaredType);
  if (!expected) throw new DomainError("image_type_unsupported", 422);
  // Copy caller bytes before asynchronous decoding to avoid mutable-buffer races.
  const bytes = Buffer.from(input);
  try {
    const options = { limitInputPixels: imageLimits.pixels, failOn: "warning" as const, animated: true };
    const metadata = await sharp(bytes, options).metadata();
    if (metadata.format !== expected) throw new DomainError("image_type_mismatch", 422);
    if ((metadata.pages ?? 1) !== 1) throw new DomainError("image_animation_unsupported", 422);
    if (!metadata.width || !metadata.height || metadata.width > imageLimits.edge || metadata.height > imageLimits.edge || metadata.width * metadata.height > imageLimits.pixels) throw new DomainError("image_dimensions_invalid", 422);
    // Full decode + orientation, strip EXIF/GPS and original filename metadata.
    // Never return original bytes as publicly usable content.
    const { data, info } = await sharp(bytes, options).timeout({ seconds: imageLimits.processingSeconds }).rotate().resize({ width: imageLimits.outputEdge, height: imageLimits.outputEdge, fit: "inside", withoutEnlargement: true }).webp({ quality: 88 }).toBuffer({ resolveWithObject: true });
    if (data.length > imageLimits.bytes) throw new DomainError("image_size_invalid", 422);
    return { bytes: data, contentType: "image/webp" as const, width: info.width, height: info.height, sha256: createHash("sha256").update(data).digest("hex") };
  } catch (error) {
    if (error instanceof DomainError) throw error;
    throw new DomainError("image_decode_failed", 422);
  }
}
