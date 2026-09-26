// Publish hooks invalidate every reference cache in this process. Other workers expire within 30 seconds.
let revision = 0;
export function invalidateCatalogReferences() {
  revision++;
}
/** Bounded, short-lived reference-data cache. Never use for stock, prices or permissions. */
export class ReferenceCache<T> {
  private revision = revision;
  private entries = new Map<string, { expires: number; value: Promise<T> }>();
  constructor(
    private readonly maxEntries = 32,
    private readonly ttlMs = 30000,
    private readonly now = () => Date.now(),
  ) {}
  get(key: string, load: () => Promise<T>): Promise<T> {
    if (this.revision !== revision) {
      this.entries.clear();
      this.revision = revision;
    }
    const old = this.entries.get(key);
    if (old && old.expires > this.now()) {
      this.entries.delete(key);
      this.entries.set(key, old);
      return old.value;
    }
    if (old) this.entries.delete(key);
    const entry = {
      expires: this.now() + this.ttlMs,
      value: Promise.resolve().then(load),
    };
    this.entries.set(key, entry);
    while (this.entries.size > this.maxEntries)
      this.entries.delete(this.entries.keys().next().value!);
    entry.value.catch(() => {
      if (this.entries.get(key) === entry) this.entries.delete(key);
    });
    return entry.value;
  }
}
