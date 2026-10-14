interface Entry<T> {
  value: Promise<T>;
  expiresAt: number;
}

/**
 * Minimal in-memory cache with TTL and a size cap.
 * Stores promises so concurrent requests for the same key share one upstream call.
 * Failed loads are evicted immediately so errors are not cached.
 */
export class TtlCache<T> {
  private readonly entries = new Map<string, Entry<T>>();

  constructor(
    private readonly ttlMs: number,
    private readonly maxEntries: number,
    private readonly now: () => number = Date.now,
  ) {}

  getOrLoad(key: string, loader: () => Promise<T>): Promise<T> {
    const cached = this.entries.get(key);
    if (cached && cached.expiresAt > this.now()) {
      return cached.value;
    }

    const value = loader();
    this.entries.delete(key);
    this.entries.set(key, { value, expiresAt: this.now() + this.ttlMs });
    this.evictOverflow();

    value.catch(() => {
      if (this.entries.get(key)?.value === value) {
        this.entries.delete(key);
      }
    });

    return value;
  }

  get size(): number {
    return this.entries.size;
  }

  private evictOverflow(): void {
    // Map preserves insertion order, so the first key is the oldest.
    while (this.entries.size > this.maxEntries) {
      const oldest = this.entries.keys().next().value as string;
      this.entries.delete(oldest);
    }
  }
}
