import { StrictMode } from "react"
import { createRoot } from "react-dom/client"

import "./index.css"
import App from "./App.tsx"
import { ThemeProvider } from "@/components/theme-provider.tsx"
import { SiteSettingsProvider } from "@/contexts/site-settings-context"
import { applyThemePreset, getCachedThemePreset } from "@/lib/theme-presets"

applyThemePreset(getCachedThemePreset())

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
