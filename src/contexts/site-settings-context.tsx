import { createContext, useContext, useEffect, useState, type ReactNode } from "react"
import { supabase } from "@/lib/supabase"
import type { SiteSettings } from "@/lib/database.types"
import { applyThemePreset } from "@/lib/theme-presets"

const CACHE_KEY = "site-settings-cache"

const DEFAULTS: SiteSettings = {
  id: 1,
  site_name: "静园",
  site_icon_url: "",
  allow_video_posts: false,
  theme_preset: "jade-garden",
  hero_enabled: true,
  hero_eyebrow: "AS-SALĀMU ‘ALAYKUM",
  hero_title: "愿平安与宁静与你同在",
  hero_subtitle: "在静园，以经训润心，以清语会友",
  hero_size: "standard",
  hero_variant: "auto",
  hero_glow: true,
  hero_pattern: "geometric",
  footer_text: "",
  registration_open: true,
  icp_text: "",
  updated_at: new Date(0).toISOString(),
}

function readCache(): SiteSettings {
  if (typeof localStorage === "undefined") return DEFAULTS
  try {
    const raw = localStorage.getItem(CACHE_KEY)
    if (!raw) return DEFAULTS
    return { ...DEFAULTS, ...(JSON.parse(raw) as Partial<SiteSettings>) }
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

const SiteSettingsContext = createContext<Ctx | null>(null)

export function SiteSettingsProvider({ children }: { children: ReactNode }) {
  const [settings, setSettings] = useState<SiteSettings>(() => readCache())

  async function refresh() {
    const { data } = await supabase.from("site_settings").select("*").eq("id", 1).maybeSingle()
    if (!data) return
    const merged: SiteSettings = { ...DEFAULTS, ...(data as Partial<SiteSettings>) }
    setSettings(merged)
    writeCache(merged)
    applyThemePreset(merged.theme_preset)
    if (merged.site_name) document.title = merged.site_name
  }

  useEffect(() => {
    applyThemePreset(settings.theme_preset)
    refresh()
    const onUpdate = () => refresh()
    window.addEventListener("site-settings-updated", onUpdate)
    return () => window.removeEventListener("site-settings-updated", onUpdate)
    // eslint-disable-next-line react-hooks/exhaustive-deps
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
