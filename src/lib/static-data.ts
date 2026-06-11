/**
 * Static data reader — fetches pre-generated JSON from /static-data/
 * All functions return null on failure so callers can fallback to Supabase.
 *
 * Cache-busting: version.json uses ?t=timestamp to bypass CDN/browser cache.
 * home.json and article JSONs use ?v=version to get fresh data after updates.
 */

const BASE = "/static-data"

/** Last known version — used to detect updates */
let knownHomeVersion: string | null = null

export interface VersionInfo {
  version: string
  homeVersion: string
  articlesVersion: string
  topicsVersion: string
}

/**
 * Fetch home page data from static JSON.
 * @param bustCache  optional version string to append as ?v= for cache-busting
 */
export async function fetchStaticHome<T>(bustCache?: string): Promise<T | null> {
  try {
    const suffix = bustCache ? `?v=${encodeURIComponent(bustCache)}` : ""
    const res = await fetch(`${BASE}/home.json${suffix}`)
    if (!res.ok) return null
    return await res.json()
  } catch {
    return null
  }
}

/**
 * Fetch a single article detail from static JSON.
 * Uses ?t=timestamp to avoid CDN/browser serving stale article data.
 */
export async function fetchStaticArticle<T>(id: string): Promise<T | null> {
  try {
    const res = await fetch(`${BASE}/articles/${id}.json?t=${Date.now()}`)
    if (!res.ok) return null
    return await res.json()
  } catch {
    return null
  }
}

/**
 * Fetch a single topic detail (with comments) from static JSON.
 * Uses ?t=timestamp to avoid CDN/browser serving stale data.
 */
export async function fetchStaticTopic<T>(id: string): Promise<T | null> {
  try {
    const res = await fetch(`${BASE}/topics/${id}.json?t=${Date.now()}`)
    if (!res.ok) return null
    return await res.json()
  } catch {
    return null
  }
}

/**
 * Check version.json for updates.
 * Uses ?t=timestamp to bypass CDN/browser cache on every check.
 *
 * Returns { changed: true, version } if homeVersion changed.
 * Returns { changed: false } if same or on any error.
 * Never throws.
 */
export async function checkVersionChanged(): Promise<{ changed: boolean; version?: string }> {
  try {
    // Cache-bust: always get fresh version.json
    const res = await fetch(`${BASE}/version.json?t=${Date.now()}`)
    if (!res.ok) return { changed: false }
    const info: VersionInfo = await res.json()
    if (!knownHomeVersion) {
      // First check — record version, no refresh needed
      knownHomeVersion = info.homeVersion
      return { changed: false }
    }
    if (info.homeVersion !== knownHomeVersion) {
      knownHomeVersion = info.homeVersion
      return { changed: true, version: info.homeVersion }
    }
    return { changed: false }
  } catch {
    return { changed: false }
  }
}
