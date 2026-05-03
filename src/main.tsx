import { StrictMode } from "react"
import { createRoot } from "react-dom/client"

import "./index.css"
import App from "./App.tsx"
import { ThemeProvider } from "@/components/theme-provider.tsx"
import { applyThemePreset, getCachedThemePreset } from "@/lib/theme-presets"
import { supabase } from "@/lib/supabase"
import type { ThemePresetKey } from "@/lib/database.types"

applyThemePreset(getCachedThemePreset())
supabase
  .from("site_settings")
  .select("theme_preset")
  .eq("id", 1)
  .maybeSingle()
  .then(({ data }) => {
    if (data?.theme_preset) applyThemePreset(data.theme_preset as ThemePresetKey)
  })
window.addEventListener("site-settings-updated", () => {
  supabase
    .from("site_settings")
    .select("theme_preset")
    .eq("id", 1)
    .maybeSingle()
    .then(({ data }) => {
      if (data?.theme_preset) applyThemePreset(data.theme_preset as ThemePresetKey)
    })
})

if ("serviceWorker" in navigator) {
  window.addEventListener("load", () => {
    navigator.serviceWorker.register("/sw.js").catch(() => {})
  })
}

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <ThemeProvider defaultTheme="light" storageKey="jingyuan-theme">
      <App />
    </ThemeProvider>
  </StrictMode>
)
