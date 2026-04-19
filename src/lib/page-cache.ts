const store = new Map<string, unknown>()

export function getCache<T>(key: string): T | undefined {
  return store.get(key) as T | undefined
}

export function setCache<T>(key: string, value: T): void {
  store.set(key, value)
}

export function clearCache(prefix?: string): void {
  if (!prefix) {
    store.clear()
    return
  }
  for (const k of store.keys()) {
    if (k.startsWith(prefix)) store.delete(k)
  }
}
