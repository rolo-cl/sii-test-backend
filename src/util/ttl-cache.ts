interface Entry<T> {
  value: Promise<T>;
  expiresAt: number;
}

/**
 * Caché mínima en memoria con TTL y límite de entradas.
 * Guarda promesas, así los requests concurrentes por la misma clave comparten una sola llamada.
 * Las cargas fallidas se eliminan de inmediato para no cachear errores.
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
    // Map conserva el orden de inserción, así que la primera clave es la más antigua.
    while (this.entries.size > this.maxEntries) {
      const oldest = this.entries.keys().next().value as string;
      this.entries.delete(oldest);
    }
  }
}
