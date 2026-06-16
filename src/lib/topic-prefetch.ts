/**
 * topic-prefetch.ts — Prefetch topic detail JSON from /static-data/topics/{id}.json
 *
 * Features:
 * - In-memory cache (Map) for instant access; also writes to page-cache sessionStorage
 * - Concurrency control: max 2 simultaneous fetches
 * - No Supabase requests, no view-count increment, no auth checks
 * - prefetchTopic(id) — fetch a single topic snapshot
 * - prefetchTopics(ids) — batch prefetch with concurrency limit
 * - getPrefetchedSnapshot(id) — read from memory cache
 * - waitForPrefetch(id, timeoutMs) — wait up to N ms for in-flight prefetch
 */

import type { Topic, Comment } from "@/lib/database.types"
import { getCache, setCache } from "@/lib/page-cache"

export type TopicSnapshot = {
  topic: Topic
  comments: Comment[]
}

/* ── In-memory prefetch cache ── */
const prefetchCache = new Map<string, TopicSnapshot>()
const inflight = new Map<string, Promise<TopicSnapshot | null>>()

const MAX_CONCURRENT = 5
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
 * Prefetch a single topic from static-data JSON.
 * - Skips if already cached (memory or sessionStorage)
 * - Deduplicates concurrent requests for the same topic
 * - Silently fails (returns null) on error
 */
export function prefetchTopic(id: string): Promise<TopicSnapshot | null> {
  // Already in memory prefetch cache
  if (prefetchCache.has(id)) return Promise.resolve(prefetchCache.get(id)!)

  // Already in sessionStorage page-cache
  const cached = getCache<TopicSnapshot>(`topic-snap:${id}`)
  if (cached) {
    prefetchCache.set(id, cached)
    return Promise.resolve(cached)
  }

  // Deduplicate in-flight requests
  if (inflight.has(id)) return inflight.get(id)!

  const promise = (async (): Promise<TopicSnapshot | null> => {
    await acquireSlot()
    try {
      const res = await fetch(`/static-data/topics/${id}.json?t=${Date.now()}`)
      if (!res.ok) return null
      const data = await res.json() as { topic: Topic; comments: Comment[]; generatedAt?: string }
      if (!data?.topic) return null

      const snap: TopicSnapshot = {
        topic: data.topic,
        comments: data.comments ?? [],
      }

      // Write to memory cache
      prefetchCache.set(id, snap)

      // Write to sessionStorage page-cache for topic-detail.tsx to find
      setCache<TopicSnapshot>(`topic-snap:${id}`, snap, data.topic.updated_at)

      return snap
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
 * Batch prefetch multiple topics. Respects concurrency limit.
 * Does not throw.
 */
export async function prefetchTopics(ids: string[]): Promise<void> {
  // Filter out already cached
  const needed = ids.filter((id) => {
    if (prefetchCache.has(id)) return false
    if (getCache<TopicSnapshot>(`topic-snap:${id}`)) return false
    if (inflight.has(id)) return false
    return true
  })
  if (needed.length === 0) return

  // Fire all — acquireSlot handles concurrency internally
  await Promise.allSettled(needed.map((id) => prefetchTopic(id)))
}

/**
 * Get a prefetched snapshot from memory (instant, no async).
 * Falls back to sessionStorage page-cache.
 */
export function getPrefetchedSnapshot(id: string): TopicSnapshot | undefined {
  const mem = prefetchCache.get(id)
  if (mem) return mem

  const cached = getCache<TopicSnapshot>(`topic-snap:${id}`)
  if (cached) {
    prefetchCache.set(id, cached)
    return cached
  }

  return undefined
}

/**
 * Wait for an in-flight prefetch to complete, up to `timeoutMs`.
 * Returns the snapshot if available, otherwise undefined.
 */
export async function waitForPrefetch(
  id: string,
  timeoutMs: number = 500,
): Promise<TopicSnapshot | undefined> {
  // Already cached — instant
  const existing = getPrefetchedSnapshot(id)
  if (existing) return existing

  // No in-flight request — nothing to wait for
  const pending = inflight.get(id)
  if (!pending) return undefined

  // Race: wait for fetch vs timeout
  const result = await Promise.race([
    pending,
    new Promise<null>((resolve) => setTimeout(() => resolve(null), timeoutMs)),
  ])

  return result ?? undefined
}
