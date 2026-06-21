/**
 * article-prefetch.ts — Prefetch article detail JSON from /static-data/articles/{id}.json
 *
 * Features:
 * - In-memory cache (Map) for instant access; also writes to page-cache sessionStorage
 * - Concurrency control: max 3 simultaneous fetches
 * - Only caches articles that have a non-empty `content` field
 * - prefetchArticle(id) — fetch a single article detail
 * - prefetchArticles(ids) — batch prefetch with concurrency limit
 * - getPrefetchedArticle(id) — read from memory cache (sync)
 */

import type { Article } from "@/lib/database.types"
import { getCache, setCache } from "@/lib/page-cache"

/* ── In-memory prefetch cache ── */
const prefetchCache = new Map<string, Article>()
const inflight = new Map<string, Promise<Article | null>>()

const MAX_CONCURRENT = 3
let activeCount = 0
const queue: Array<() => void> = []

function acquireSlot(): Promise<void> {
  if (activeCount < MAX_CONCURRENT) {
    activeCount++
    return Promise.resolve()
  }
  return new Promise<void>((resolve) => queue.push(resolve))
}

function releaseSlot() {
  activeCount--
  const next = queue.shift()
  if (next) {
    activeCount++
    next()
  }
}

/**
 * Check if an article has real content (not empty/whitespace-only).
 */
function hasContent(article: Article): boolean {
  const c = (article as any).content
  return typeof c === "string" && c.trim().length > 0
}

/**
 * Prefetch a single article detail from static-data JSON.
 * - Skips if already cached (memory or sessionStorage with content)
 * - Deduplicates concurrent requests for the same article
 * - Only caches if article has non-empty content
 * - Silently fails (returns null) on error
 */
export function prefetchArticle(id: string): Promise<Article | null> {
  // Already in memory prefetch cache (guaranteed to have content)
  if (prefetchCache.has(id)) return Promise.resolve(prefetchCache.get(id)!)

  // Already in sessionStorage page-cache with content
  const cached = getCache<Article>(`article:${id}`)
  if (cached && hasContent(cached)) {
    prefetchCache.set(id, cached)
    return Promise.resolve(cached)
  }

  // Deduplicate in-flight requests
  if (inflight.has(id)) return inflight.get(id)!

  const promise = (async (): Promise<Article | null> => {
    await acquireSlot()
    try {
      const res = await fetch(`/static-data/articles/${id}.json?t=${Date.now()}`)
      if (!res.ok) return null
      const data = (await res.json()) as Article
      if (!data || !hasContent(data)) return null

      // Write to memory cache
      prefetchCache.set(id, data)

      // Write to sessionStorage page-cache for article-detail.tsx
      setCache<Article>(`article:${id}`, data, (data as any).updated_at)

      return data
    } catch {
      return null
    } finally {
      releaseSlot()
      inflight.delete(id)
    }
  })()

  inflight.set(id, promise)
  return promise
}

/**
 * Batch prefetch multiple articles. Respects concurrency limit.
 * Does not throw.
 */
export async function prefetchArticles(ids: string[]): Promise<void> {
  const needed = ids.filter((id) => {
    if (prefetchCache.has(id)) return false
    const cached = getCache<Article>(`article:${id}`)
    if (cached && hasContent(cached)) return false
    if (inflight.has(id)) return false
    return true
  })
  if (needed.length === 0) return

  await Promise.allSettled(needed.map((id) => prefetchArticle(id)))
}

/**
 * Get a prefetched article from memory (instant, no async).
 * Falls back to sessionStorage page-cache (only if it has content).
 */
export function getPrefetchedArticle(id: string): Article | undefined {
  const mem = prefetchCache.get(id)
  if (mem) return mem

  const cached = getCache<Article>(`article:${id}`)
  if (cached && hasContent(cached)) {
    prefetchCache.set(id, cached)
    return cached
  }

  return undefined
}
