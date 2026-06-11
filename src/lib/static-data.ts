/**
 * Static data reader — fetches pre-generated JSON from /static-data/
 * All functions return null on failure so callers can fallback to Supabase.
 */

const BASE = "/static-data"

/** Stored version for background freshness check */
let knownVersion: string | null = null

export interface VersionInfo {
  version: string
  homeVersion: string
  articlesVersion: string
  topicsVersion: string
}

/**
 * Fetch home page data from static JSON.
 * Returns null if file doesn't exist or is invalid.
 */
export async function fetchStaticHome<T>(): Promise<T | null> {
  try {
    const res = await fetch(`${BASE}/home.json`, { cache: "no-cache" })
    if (!res.ok) return null
    return await res.json()
  } catch {
    return null
  }
}

/**
 * Fetch a single article detail from static JSON.
 * Returns null if file doesn't exist or is invalid.
 */
export async function fetchStaticArticle<T>(id: string): Promise<T | null> {
  try {
    const res = await fetch(`${BASE}/articles/${id}.json`, { cache: "no-cache" })
    if (!res.ok) return null
    return await res.json()
  } catch {
    return null
  }
}

/**
 * Check version.json and return whether home data needs refresh.
 * Returns { changed: true, version } if version changed, { changed: false } otherwise.
 * Never throws — returns { changed: false } on any error.
 */
export async function checkVersionChanged(): Promise<{ changed: boolean; version?: string }> {
  try {
    const res = await fetch(`${BASE}/version.json`, { cache: "no-cache" })
    if (!res.ok) return { changed: false }
    const info: VersionInfo = await res.json()
    if (!knownVersion) {
      // First check — just record the version, no refresh needed
      knownVersion = info.homeVersion
      return { changed: false }
    }
    if (info.homeVersion !== knownVersion) {
      knownVersion = info.homeVersion
      return { changed: true, version: info.homeVersion }
    }
    return { changed: false }
  } catch {
    return { changed: false }
  }
}
