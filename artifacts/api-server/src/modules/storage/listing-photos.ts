import type { StorageProvider } from "../providers/contracts";
import { DomainError } from "../shared/domain";
/** Read-only adapter for explicitly configured public listing-photo storage. */
export class PublicListingPhotoStorage implements Pick<
  StorageProvider,
  "readUrl"
> {
  private readonly base: URL;
  constructor(base: string) {
    this.base = new URL(base.endsWith("/") ? base : base + "/");
    if (
      this.base.protocol !== "https:" ||
      this.base.username ||
      this.base.password ||
      this.base.search ||
      this.base.hash
    )
      throw new DomainError("invalid_storage_configuration", 503);
  }
  async readUrl(key: string) {
    const segments = key.split("/");
    if (
      !key ||
      key.startsWith("listing-quarantine/") ||
      key.length > 1000 ||
      segments.some((s) => !s || s === "." || s === "..") ||
      key.includes("\\") ||
      [...key].some((char) => char.charCodeAt(0) < 32)
    )
      throw new DomainError("invalid_storage_key");
    return {
      url: new URL(segments.map(encodeURIComponent).join("/"), this.base).href,
      expiresAt: "9999-12-31T23:59:59Z",
    };
  }
}
export async function resolveListingPhotos(keys: string[]): Promise<string[]> {
  const base = process.env.STORAGE_PUBLIC_BASE_URL;
  if (!base) return [];
  const storage = new PublicListingPhotoStorage(base);
  const urls = await Promise.all(
    keys.slice(0, 12).map(async (key) => {
      try {
        return (await storage.readUrl(key)).url;
      } catch {
        return null;
      }
    }),
  );
  return urls.filter((url): url is string => url !== null);
}
