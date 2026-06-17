import { createContext, useContext, useEffect, useState, type ReactNode } from "react"
import { supabase } from "@/lib/supabase"
import type { SiteSettings } from "@/lib/database.types"
import { applyThemePreset, applyTextDepth, getCachedTextDepth, THEME_PRESETS } from "@/lib/theme-presets"
import type { ThemePresetKey } from "@/lib/database.types"
import { fetchStaticSiteSettings } from "@/lib/static-data"

export const CACHE_KEY = "site-settings-cache"

/** Sync document.title and favicon <link> to match current settings */
function applySiteMeta(s: SiteSettings) {
  if (s.site_name) {
    document.title = s.site_name
  }
  if (s.site_icon_url) {
    let link = document.querySelector<HTMLLinkElement>('link[rel="icon"]')
    if (link) {
      link.href = s.site_icon_url
    }
    let appleLink = document.querySelector<HTMLLinkElement>('link[rel="apple-touch-icon"]')
    if (appleLink) {
      appleLink.href = s.site_icon_url
    }
  }
}

const DEFAULTS: SiteSettings = {
  id: 1,
  site_name: "",
  site_icon_url: "",
  allow_video_posts: false,
  theme_preset: "stone-burgundy",
  hero_enabled: true,
  hero_eyebrow: "AS-SALĀMU 'ALAYKUM",
  hero_title: "",
  hero_subtitle: "",
  hero_size: "standard",
  hero_variant: "auto",
  hero_glow: true,
  hero_pattern: "geometric",
  footer_text: "",
  registration_open: true,
  icp_text: "",
  updated_at: "",
}

function readCache(): SiteSettings {
  if (typeof localStorage === "undefined") return DEFAULTS
  try {
    const raw = localStorage.getItem(CACHE_KEY)
    if (!raw) return DEFAULTS
    const parsed = JSON.parse(raw) as Partial<SiteSettings>
    return { ...DEFAULTS, ...parsed }
  } catch {
    return DEFAULTS
  }
}

function writeCache(s: SiteSettings) {
  try {
    localStorage.setItem(CACHE_KEY, JSON.stringify(s))
  } catch {
    /* ignore */
  }
}

/** Validate and normalize theme preset key */
function normalizePreset(data: any): SiteSettings {
  const dbPreset = data.theme_preset as string
  if (dbPreset && !(dbPreset in THEME_PRESETS)) {
    data.theme_preset = "stone-burgundy" as ThemePresetKey
  }
  return { ...DEFAULTS, ...data } as SiteSettings
}

interface Ctx {
  settings: SiteSettings
  refresh: () => Promise<void>
}

const SiteSettingsContext = createContext<Ctx | undefined>(undefined)

export function SiteSettingsProvider({ children }: { children: ReactNode }) {
  const [settings, setSettings] = useState<SiteSettings>(() => readCache())

  async function refresh() {
    const { data } = await supabase.from("site_settings").select("*").eq("id", 1).maybeSingle()
    if (data) {
      const next = normalizePreset(data)
      setSettings(next)
      writeCache(next)
      applyThemePreset(next.theme_preset)
      applyTextDepth(getCachedTextDepth())
      applySiteMeta(next)
    }
  }

  useEffect(() => {
    const cached = readCache()
    const hasCache = !!cached.site_name

    // Apply whatever we have immediately
    applyThemePreset(cached.theme_preset)
    applyTextDepth(getCachedTextDepth())
    if (hasCache) applySiteMeta(cached)

    // If no localStorage cache, try static JSON first for instant brand display
    if (!hasCache) {
      fetchStaticSiteSettings<SiteSettings>().then((staticData) => {
        if (staticData?.site_name) {
          const next = normalizePreset(staticData)
          setSettings(next)
          writeCache(next)
          applyThemePreset(next.theme_preset)
          applyTextDepth(getCachedTextDepth())
          applySiteMeta(next)
        }
        // Always revalidate from Supabase in background
        refresh()
      }).catch(() => {
        refresh()
      })
    } else {
      // Has cache — just revalidate from Supabase
      refresh()
    }

    function onUpdate() {
      refresh()
    }
    window.addEventListener("site-settings-updated", onUpdate)
    return () => window.removeEventListener("site-settings-updated", onUpdate)

  }, [])

  return (
    <SiteSettingsContext.Provider value={{ settings, refresh }}>
      {children}
    </SiteSettingsContext.Provider>
  )
}

export function useSiteSettings() {
  const ctx = useContext(SiteSettingsContext)
  if (!ctx) throw new Error("useSiteSettings must be used within SiteSettingsProvider")
  return ctx
}
