import { StrictMode } from "react"
import { createRoot } from "react-dom/client"

import "./index.css"
import App from "./App.tsx"
import { ThemeProvider } from "@/components/theme-provider.tsx"
import { applyThemePreset, getCachedThemePreset } from "@/lib/theme-presets"
import { SiteSettingsProvider } from "@/contexts/site-settings-context"
import { supabase } from "@/lib/supabase"

applyThemePreset(getCachedThemePreset())

async function refreshManifest() {
  try {
    const { data } = await supabase
      .from("site_settings")
      .select("site_name, site_icon_url")
      .eq("id", 1)
      .maybeSingle()
    const name = data?.site_name || "静园"
    const icon = data?.site_icon_url || "/pwa-icon-512.webp"
    const manifest = {
      id: "/",
      name: `${name} · 华语穆斯林社区`,
      short_name: name,
      start_url: "/?source=pwa",
      scope: "/",
      display: "standalone",
      display_override: ["standalone", "minimal-ui"],
      orientation: "portrait",
      background_color: "#faf7f1",
      theme_color: "#5c1f28",
      lang: "zh-CN",
      icons: [
        { src: icon, sizes: "512x512", type: "image/webp", purpose: "any" },
        { src: "/pwa-icon-maskable-512.webp", sizes: "512x512", type: "image/webp", purpose: "maskable" },
        { src: "/pwa-icon.svg", sizes: "any", type: "image/svg+xml", purpose: "any" },
      ],
    }
    const blob = new Blob([JSON.stringify(manifest)], { type: "application/manifest+json" })
    const url = URL.createObjectURL(blob)
    let link = document.querySelector<HTMLLinkElement>('link[rel="manifest"]')
    if (!link) {
      link = document.createElement("link")
      link.rel = "manifest"
      document.head.appendChild(link)
    }
    link.href = url
  } catch {
    /* fall back to static manifest */
  }
}
refreshManifest()
window.addEventListener("site-settings-updated", refreshManifest)

if ("serviceWorker" in navigator) {
  window.addEventListener("load", () => {
    navigator.serviceWorker.register("/sw.js").catch(() => {})
  })
}

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <ThemeProvider defaultTheme="light" storageKey="jingyuan-theme">
      <SiteSettingsProvider>
        <App />
      </SiteSettingsProvider>
    </ThemeProvider>
  </StrictMode>
)
