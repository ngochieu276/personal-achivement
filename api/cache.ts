const TTL_MS = 45_000;

type Entry = { expires: number; value: unknown };

const store = new Map<string, Entry>();

function key(userId: string, path: string) {
  return `${userId}:${path}`;
}

export function cacheGet<T>(userId: string, path: string): T | undefined {
  const entry = store.get(key(userId, path));
  if (!entry) return undefined;
  if (entry.expires <= Date.now()) {
    store.delete(key(userId, path));
    return undefined;
  }
  return entry.value as T;
}

export function cacheSet(userId: string, path: string, value: unknown) {
  store.set(key(userId, path), { expires: Date.now() + TTL_MS, value });
}

export function invalidateUserReads(userId: string) {
  const prefix = `${userId}:`;
  for (const item of store.keys()) {
    if (item.startsWith(prefix)) store.delete(item);
  }
}
