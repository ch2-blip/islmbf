/**
 * page-cache.ts — sessionStorage-backed cache with stale-while-revalidate.
 *
 * • Article detail caches persist across SPA navigation AND page reloads.
 * • Home / list caches use shorter TTL.
 * • getCache() returns data even if stale — the caller decides whether to revalidate.
 * • isCacheStale() tells the caller if a background refresh is needed.
 * • setCache() writes both the in-memory Map (instant) and sessionStorage (persistent).
 */

const ARTICLE_TTL_MS = 2 * 60 * 60 * 1000   // 2 hours
const DEFAULT_TTL_MS = 5 * 60 * 1000         // 5 minutes
const CACHE_VERSION = 1
const SS_PREFIX = "pc:"

interface CacheEntry<T = unknown> {
  data: T
  ts: number       // timestamp (ms)
  ver: number       // cache version
  updatedAt?: string // article updated_at for freshness check
}

/* ── In-memory mirror (instant access, survives SPA navigation) ── */
const mem = new Map<string, CacheEntry>()

/* ── Helpers ── */
function ttlFor(key: string): number {
  return key.startsWith("article:") ? ARTICLE_TTL_MS : DEFAULT_TTL_MS
}

function ssKey(key: string) {
  return SS_PREFIX + key
}

function readSS<T>(key: string): CacheEntry<T> | undefined {
  try {
    const raw = sessionStorage.getItem(ssKey(key))
    if (!raw) return undefined
    const entry = JSON.parse(raw) as CacheEntry<T>
    if (entry.ver !== CACHE_VERSION) {
      sessionStorage.removeItem(ssKey(key))
      return undefined
    }
    return entry
  } catch {
    return undefined
  }
}

function writeSS<T>(key: string, entry: CacheEntry<T>) {
  try {
    sessionStorage.setItem(ssKey(key), JSON.stringify(entry))
  } catch {
    // sessionStorage full — evict oldest article caches
    try {
      const toRemove: string[] = []
      for (let i = 0; i < sessionStorage.length; i++) {
        const k = sessionStorage.key(i)
        if (k && k.startsWith(SS_PREFIX + "article:")) toRemove.push(k)
      }
      toRemove.sort()
      // remove oldest half
      for (let i = 0; i < Math.ceil(toRemove.length / 2); i++) {
        sessionStorage.removeItem(toRemove[i])
      }
      sessionStorage.setItem(ssKey(key), JSON.stringify(entry))
    } catch { /* give up */ }
  }
}

/* ── Public API ── */

/**
 * Get cached data. Returns `undefined` only if no cache exists at all.
 * Returns stale data too — use `isCacheStale()` to decide on revalidation.
 */
export function getCache<T>(key: string): T | undefined {
  // Try in-memory first
  const mEntry = mem.get(key) as CacheEntry<T> | undefined
  if (mEntry) return mEntry.data

  // Fall back to sessionStorage
  const sEntry = readSS<T>(key)
  if (sEntry) {
    // Populate in-memory mirror
    mem.set(key, sEntry as CacheEntry)
    return sEntry.data
  }
  return undefined
}

/**
 * Check if cache needs background refresh.
 * Returns true if no cache, expired, or version mismatch.
 * Optional `updatedAt` param: if the server's updated_at is newer, cache is stale.
 */
export function isCacheStale(key: string, updatedAt?: string): boolean {
  const entry = mem.get(key) ?? readSS(key)
  if (!entry) return true
  if (entry.ver !== CACHE_VERSION) return true
  if (Date.now() - entry.ts > ttlFor(key)) return true
  if (updatedAt && entry.updatedAt && updatedAt !== entry.updatedAt) return true
  return false
}

/**
 * Write data to cache (both in-memory and sessionStorage).
 */
export function setCache<T>(key: string, value: T, updatedAt?: string): void {
  const entry: CacheEntry<T> = {
    data: value,
    ts: Date.now(),
    ver: CACHE_VERSION,
    updatedAt,
  }
  mem.set(key, entry as CacheEntry)
  writeSS(key, entry)
}

/**
 * Clear caches matching a prefix, or all caches.
 */
export function clearCache(prefix?: string): void {
  if (!prefix) {
    mem.clear()
    try {
      const toRemove: string[] = []
      for (let i = 0; i < sessionStorage.length; i++) {
        const k = sessionStorage.key(i)
        if (k && k.startsWith(SS_PREFIX)) toRemove.push(k)
      }
      toRemove.forEach(k => sessionStorage.removeItem(k))
    } catch { /* ignore */ }
    return
  }
  for (const k of mem.keys()) {
    if (k.startsWith(prefix)) mem.delete(k)
  }
  try {
    const toRemove: string[] = []
    for (let i = 0; i < sessionStorage.length; i++) {
      const k = sessionStorage.key(i)
      if (k && k.startsWith(SS_PREFIX + prefix)) toRemove.push(k)
    }
    toRemove.forEach(k => sessionStorage.removeItem(k))
  } catch { /* ignore */ }
}

/* ── Local comment-count overrides ──
 * When a user posts/deletes a comment, we record the true count here.
 * mergeCommentCounts() applies these overrides on top of fresh server data
 * so that stale Supabase/static-data don't revert visible numbers.
 * Overrides expire after 10 minutes (server should have caught up by then).
 */
const commentOverrides = new Map<string, { count: number; ts: number }>()
const OVERRIDE_TTL = 10 * 60 * 1000

export function setCommentCountOverride(targetId: string, count: number) {
  commentOverrides.set(targetId, { count, ts: Date.now() })
}

export function mergeCommentCounts<T extends { id: string; comment_count: number }>(items: T[]): T[] {
  if (commentOverrides.size === 0) return items
  const now = Date.now()
  return items.map(item => {
    const ov = commentOverrides.get(item.id)
    if (ov && now - ov.ts < OVERRIDE_TTL) {
      return { ...item, comment_count: ov.count }
    }
    return item
  })
}
