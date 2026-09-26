import { DomainError } from "../shared/domain";
import { imageLimits } from "./prepare-image";
/** Count actual streamed bytes, never trust Content-Length. Caller owns request deadline/admission. */
export async function readImageBytes(stream: AsyncIterable<Uint8Array>): Promise<Buffer> {
  // Fixed bounded backing avoids per-chunk object growth on tiny fragmented uploads.
  const storage = Buffer.allocUnsafe(imageLimits.bytes);
  let size = 0;
  for await (const chunk of stream) {
    size += chunk.byteLength;
    if (size > imageLimits.bytes) throw new DomainError("image_size_invalid", 422);
    if (chunk.byteLength) storage.set(chunk, size - chunk.byteLength);
  }
  if (!size) throw new DomainError("image_size_invalid", 422);
  return Buffer.from(storage.subarray(0, size));
}
