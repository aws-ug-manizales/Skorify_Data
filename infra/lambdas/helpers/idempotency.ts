export interface IdempotencyStore {
  hasProcessed(key: string): Promise<boolean>;
  markProcessed(key: string): Promise<void>;
}

export class InMemoryIdempotencyStore implements IdempotencyStore {
  private readonly processed = new Set<string>();
  private readonly maxSize: number;
  private insertionOrder: string[] = [];

  constructor(maxSize = 10_000) {
    this.maxSize = maxSize;
  }

  async hasProcessed(key: string): Promise<boolean> {
    return this.processed.has(key);
  }

  async markProcessed(key: string): Promise<void> {
    if (this.processed.size >= this.maxSize) {
      const oldest = this.insertionOrder.shift();
      if (oldest) {
        this.processed.delete(oldest);
      }
    }

    this.processed.add(key);
    this.insertionOrder.push(key);
  }
}

export class IdempotencyGuard {
  constructor(private readonly store: IdempotencyStore) {}

  async execute<T>(
    key: string,
    fn: () => Promise<T>
  ): Promise<{ processed: boolean; result?: T }> {
    const alreadyProcessed = await this.store.hasProcessed(key);

    if (alreadyProcessed) {
      return { processed: true };
    }

    const result = await fn();
    await this.store.markProcessed(key);
    return { processed: false, result };
  }
}
