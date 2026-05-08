/**
 * Minimal in-memory KVNamespace mock for unit tests.
 * Honors expirationTtl (best-effort — converts to absolute deadline).
 */
export function createMockKV(): KVNamespace {
  const store = new Map<string, { value: string; expiresAt: number | null }>();

  function isExpired(entry: { expiresAt: number | null }) {
    return entry.expiresAt !== null && entry.expiresAt <= Date.now();
  }

  return {
    async get(key: string) {
      const entry = store.get(key);
      if (!entry || isExpired(entry)) {
        store.delete(key);
        return null;
      }
      return entry.value;
    },
    async put(key: string, value: string, options?: { expirationTtl?: number }) {
      const expiresAt = options?.expirationTtl
        ? Date.now() + options.expirationTtl * 1000
        : null;
      store.set(key, { value, expiresAt });
    },
    async delete(key: string) {
      store.delete(key);
    },
    async list() {
      return { keys: [], list_complete: true, cursor: '' };
    },
    async getWithMetadata() {
      return { value: null, metadata: null };
    },
  } as unknown as KVNamespace;
}
