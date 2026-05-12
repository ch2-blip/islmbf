import { createContext, useContext, useEffect, useState, type ReactNode } from "react"
import { supabase } from "@/lib/supabase"
import type { SiteSettings } from "@/lib/database.types"
import { applyThemePreset, applyTextDepth, getCachedTextDepth, THEME_PRESETS } from "@/lib/theme-presets"
import type { ThemePresetKey } from "@/lib/database.types"

const CACHE_KEY = "site-settings-cache"

const DEFAULTS: SiteSettings = {
  id: 1,
  site_name: "静园",
  site_icon_url: "",
  allow_video_posts: false,
  theme_preset: "stone-burgundy",
  hero_enabled: true,
  hero_eyebrow: "AS-SALĀMU 'ALAYKUM",
  hero_title: "愿平安与宁静与你同在",
  hero_subtitle: "在静园，以经训润心，以清语会友",
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
      /* If DB has an old/deleted theme key, fall back to stone-burgundy */
      const dbPreset = data.theme_preset as string
      if (dbPreset && !(dbPreset in THEME_PRESETS)) {
        data.theme_preset = "stone-burgundy" as ThemePresetKey
      }
      const next = { ...DEFAULTS, ...data } as SiteSettings
      setSettings(next)
      writeCache(next)
      applyThemePreset(next.theme_preset)
      applyTextDepth(getCachedTextDepth())
    }
  }

  useEffect(() => {
    applyThemePreset(settings.theme_preset)
    applyTextDepth(getCachedTextDepth())
    refresh()
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
