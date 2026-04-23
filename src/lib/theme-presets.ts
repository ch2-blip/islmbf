import type { ThemePresetKey } from "./database.types"

type TokenMap = Record<string, string>

export interface ThemePreset {
  key: ThemePresetKey
  label: string
  description: string
  swatch: {
    bg: string
    card: string
    primary: string
    accent: string
  }
  light: TokenMap
  dark: TokenMap
}

const sharedRadius = "0.625rem"

export const THEME_PRESETS: Record<ThemePresetKey, ThemePreset> = {
  "jade-garden": {
    key: "jade-garden",
    label: "翡翠静园",
    description: "清雅青瓷为底，琥珀为点缀，典雅且舒适",
    swatch: {
      bg: "oklch(0.97 0.014 170)",
      card: "oklch(0.995 0.004 170)",
      primary: "oklch(0.48 0.09 165)",
      accent: "oklch(0.82 0.12 82)",
    },
    light: {
      "--background": "oklch(0.97 0.014 170)",
      "--foreground": "oklch(0.2 0.02 170)",
      "--card": "oklch(0.995 0.004 170)",
      "--card-foreground": "oklch(0.2 0.02 170)",
      "--popover": "oklch(0.995 0.004 170)",
      "--popover-foreground": "oklch(0.2 0.02 170)",
      "--primary": "oklch(0.48 0.09 165)",
      "--primary-foreground": "oklch(0.98 0.01 170)",
      "--secondary": "oklch(0.94 0.022 170)",
      "--secondary-foreground": "oklch(0.3 0.04 170)",
      "--muted": "oklch(0.94 0.018 170)",
      "--muted-foreground": "oklch(0.48 0.03 170)",
      "--accent": "oklch(0.92 0.08 85)",
      "--accent-foreground": "oklch(0.35 0.09 70)",
      "--destructive": "oklch(0.58 0.22 27)",
      "--border": "oklch(0.88 0.018 170)",
      "--input": "oklch(0.9 0.015 170)",
      "--ring": "oklch(0.55 0.08 165)",
    },
    dark: {
      "--background": "oklch(0.18 0.02 170)",
      "--foreground": "oklch(0.96 0.01 170)",
      "--card": "oklch(0.22 0.025 170)",
      "--card-foreground": "oklch(0.96 0.01 170)",
      "--popover": "oklch(0.22 0.025 170)",
      "--popover-foreground": "oklch(0.96 0.01 170)",
      "--primary": "oklch(0.75 0.1 165)",
      "--primary-foreground": "oklch(0.18 0.02 170)",
      "--secondary": "oklch(0.28 0.03 170)",
      "--secondary-foreground": "oklch(0.92 0.01 170)",
      "--muted": "oklch(0.26 0.025 170)",
      "--muted-foreground": "oklch(0.7 0.02 170)",
      "--accent": "oklch(0.4 0.08 80)",
      "--accent-foreground": "oklch(0.96 0.04 85)",
      "--destructive": "oklch(0.7 0.2 27)",
      "--border": "oklch(0.3 0.025 170)",
      "--input": "oklch(0.3 0.025 170)",
      "--ring": "oklch(0.6 0.08 165)",
    },
  },
  "warm-sand": {
    key: "warm-sand",
    label: "暖沙书斋",
    description: "米沙底色配深琥珀，如手卷羊皮纸温润",
    swatch: {
      bg: "oklch(0.965 0.018 82)",
      card: "oklch(0.995 0.006 82)",
      primary: "oklch(0.45 0.08 55)",
      accent: "oklch(0.7 0.14 58)",
    },
    light: {
      "--background": "oklch(0.965 0.018 82)",
      "--foreground": "oklch(0.22 0.03 50)",
      "--card": "oklch(0.995 0.006 82)",
      "--card-foreground": "oklch(0.22 0.03 50)",
      "--popover": "oklch(0.995 0.006 82)",
      "--popover-foreground": "oklch(0.22 0.03 50)",
      "--primary": "oklch(0.45 0.08 55)",
      "--primary-foreground": "oklch(0.98 0.01 82)",
      "--secondary": "oklch(0.93 0.03 82)",
      "--secondary-foreground": "oklch(0.3 0.05 55)",
      "--muted": "oklch(0.93 0.022 82)",
      "--muted-foreground": "oklch(0.48 0.035 55)",
      "--accent": "oklch(0.9 0.09 80)",
      "--accent-foreground": "oklch(0.35 0.09 55)",
      "--destructive": "oklch(0.58 0.22 27)",
      "--border": "oklch(0.87 0.03 82)",
      "--input": "oklch(0.9 0.025 82)",
      "--ring": "oklch(0.55 0.08 55)",
    },
    dark: {
      "--background": "oklch(0.2 0.025 55)",
      "--foreground": "oklch(0.96 0.015 82)",
      "--card": "oklch(0.24 0.03 55)",
      "--card-foreground": "oklch(0.96 0.015 82)",
      "--popover": "oklch(0.24 0.03 55)",
      "--popover-foreground": "oklch(0.96 0.015 82)",
      "--primary": "oklch(0.78 0.1 75)",
      "--primary-foreground": "oklch(0.2 0.025 55)",
      "--secondary": "oklch(0.3 0.035 55)",
      "--secondary-foreground": "oklch(0.94 0.015 82)",
      "--muted": "oklch(0.28 0.03 55)",
      "--muted-foreground": "oklch(0.72 0.025 82)",
      "--accent": "oklch(0.42 0.09 65)",
      "--accent-foreground": "oklch(0.96 0.04 85)",
      "--destructive": "oklch(0.7 0.2 27)",
      "--border": "oklch(0.32 0.035 55)",
      "--input": "oklch(0.32 0.035 55)",
      "--ring": "oklch(0.6 0.08 70)",
    },
  },
  "morning-mist": {
    key: "morning-mist",
    label: "晨雾江南",
    description: "极淡青蓝冷白，素净通透，适合长时间阅读",
    swatch: {
      bg: "oklch(0.975 0.01 220)",
      card: "oklch(0.998 0.003 220)",
      primary: "oklch(0.45 0.09 225)",
      accent: "oklch(0.85 0.08 200)",
    },
    light: {
      "--background": "oklch(0.975 0.01 220)",
      "--foreground": "oklch(0.22 0.02 230)",
      "--card": "oklch(0.998 0.003 220)",
      "--card-foreground": "oklch(0.22 0.02 230)",
      "--popover": "oklch(0.998 0.003 220)",
      "--popover-foreground": "oklch(0.22 0.02 230)",
      "--primary": "oklch(0.45 0.09 225)",
      "--primary-foreground": "oklch(0.98 0.01 220)",
      "--secondary": "oklch(0.94 0.015 220)",
      "--secondary-foreground": "oklch(0.3 0.04 225)",
      "--muted": "oklch(0.94 0.012 220)",
      "--muted-foreground": "oklch(0.48 0.025 225)",
      "--accent": "oklch(0.9 0.05 210)",
      "--accent-foreground": "oklch(0.32 0.08 225)",
      "--destructive": "oklch(0.58 0.22 27)",
      "--border": "oklch(0.88 0.015 220)",
      "--input": "oklch(0.9 0.012 220)",
      "--ring": "oklch(0.55 0.08 225)",
    },
    dark: {
      "--background": "oklch(0.19 0.022 235)",
      "--foreground": "oklch(0.96 0.01 220)",
      "--card": "oklch(0.23 0.028 235)",
      "--card-foreground": "oklch(0.96 0.01 220)",
      "--popover": "oklch(0.23 0.028 235)",
      "--popover-foreground": "oklch(0.96 0.01 220)",
      "--primary": "oklch(0.78 0.1 220)",
      "--primary-foreground": "oklch(0.19 0.022 235)",
      "--secondary": "oklch(0.29 0.03 235)",
      "--secondary-foreground": "oklch(0.93 0.01 220)",
      "--muted": "oklch(0.27 0.028 235)",
      "--muted-foreground": "oklch(0.72 0.02 220)",
      "--accent": "oklch(0.4 0.07 220)",
      "--accent-foreground": "oklch(0.95 0.02 210)",
      "--destructive": "oklch(0.7 0.2 27)",
      "--border": "oklch(0.31 0.028 235)",
      "--input": "oklch(0.31 0.028 235)",
      "--ring": "oklch(0.6 0.08 220)",
    },
  },
  "pure-moonlight": {
    key: "pure-moonlight",
    label: "皓月清辉",
    description: "近白底、黑金对比，极简高雅",
    swatch: {
      bg: "oklch(0.985 0.003 95)",
      card: "oklch(1 0 0)",
      primary: "oklch(0.22 0.01 95)",
      accent: "oklch(0.78 0.15 78)",
    },
    light: {
      "--background": "oklch(0.985 0.003 95)",
      "--foreground": "oklch(0.18 0.01 95)",
      "--card": "oklch(1 0 0)",
      "--card-foreground": "oklch(0.18 0.01 95)",
      "--popover": "oklch(1 0 0)",
      "--popover-foreground": "oklch(0.18 0.01 95)",
      "--primary": "oklch(0.22 0.01 95)",
      "--primary-foreground": "oklch(0.98 0.01 95)",
      "--secondary": "oklch(0.95 0.006 95)",
      "--secondary-foreground": "oklch(0.25 0.01 95)",
      "--muted": "oklch(0.95 0.006 95)",
      "--muted-foreground": "oklch(0.48 0.01 95)",
      "--accent": "oklch(0.92 0.1 85)",
      "--accent-foreground": "oklch(0.35 0.09 78)",
      "--destructive": "oklch(0.58 0.22 27)",
      "--border": "oklch(0.9 0.006 95)",
      "--input": "oklch(0.92 0.005 95)",
      "--ring": "oklch(0.5 0.02 95)",
    },
    dark: {
      "--background": "oklch(0.15 0.005 95)",
      "--foreground": "oklch(0.97 0.006 95)",
      "--card": "oklch(0.2 0.008 95)",
      "--card-foreground": "oklch(0.97 0.006 95)",
      "--popover": "oklch(0.2 0.008 95)",
      "--popover-foreground": "oklch(0.97 0.006 95)",
      "--primary": "oklch(0.9 0.008 95)",
      "--primary-foreground": "oklch(0.18 0.005 95)",
      "--secondary": "oklch(0.26 0.008 95)",
      "--secondary-foreground": "oklch(0.94 0.006 95)",
      "--muted": "oklch(0.25 0.008 95)",
      "--muted-foreground": "oklch(0.7 0.008 95)",
      "--accent": "oklch(0.45 0.12 78)",
      "--accent-foreground": "oklch(0.97 0.04 85)",
      "--destructive": "oklch(0.7 0.2 27)",
      "--border": "oklch(0.28 0.008 95)",
      "--input": "oklch(0.28 0.008 95)",
      "--ring": "oklch(0.58 0.02 95)",
    },
  },
  sandalwood: {
    key: "sandalwood",
    label: "檀香古韵",
    description: "米黄棕底偏暖，仿古宣纸，庄重沉静",
    swatch: {
      bg: "oklch(0.955 0.024 72)",
      card: "oklch(0.99 0.008 72)",
      primary: "oklch(0.4 0.07 45)",
      accent: "oklch(0.62 0.12 40)",
    },
    light: {
      "--background": "oklch(0.955 0.024 72)",
      "--foreground": "oklch(0.22 0.03 40)",
      "--card": "oklch(0.99 0.008 72)",
      "--card-foreground": "oklch(0.22 0.03 40)",
      "--popover": "oklch(0.99 0.008 72)",
      "--popover-foreground": "oklch(0.22 0.03 40)",
      "--primary": "oklch(0.4 0.07 45)",
      "--primary-foreground": "oklch(0.98 0.01 72)",
      "--secondary": "oklch(0.92 0.035 72)",
      "--secondary-foreground": "oklch(0.3 0.05 45)",
      "--muted": "oklch(0.92 0.028 72)",
      "--muted-foreground": "oklch(0.48 0.04 45)",
      "--accent": "oklch(0.88 0.07 55)",
      "--accent-foreground": "oklch(0.32 0.08 45)",
      "--destructive": "oklch(0.58 0.22 27)",
      "--border": "oklch(0.85 0.035 72)",
      "--input": "oklch(0.88 0.03 72)",
      "--ring": "oklch(0.5 0.07 45)",
    },
    dark: {
      "--background": "oklch(0.2 0.025 45)",
      "--foreground": "oklch(0.95 0.02 72)",
      "--card": "oklch(0.24 0.028 45)",
      "--card-foreground": "oklch(0.95 0.02 72)",
      "--popover": "oklch(0.24 0.028 45)",
      "--popover-foreground": "oklch(0.95 0.02 72)",
      "--primary": "oklch(0.7 0.1 55)",
      "--primary-foreground": "oklch(0.2 0.025 45)",
      "--secondary": "oklch(0.3 0.03 45)",
      "--secondary-foreground": "oklch(0.94 0.02 72)",
      "--muted": "oklch(0.28 0.03 45)",
      "--muted-foreground": "oklch(0.72 0.025 72)",
      "--accent": "oklch(0.42 0.1 55)",
      "--accent-foreground": "oklch(0.96 0.03 72)",
      "--destructive": "oklch(0.7 0.2 27)",
      "--border": "oklch(0.32 0.03 45)",
      "--input": "oklch(0.32 0.03 45)",
      "--ring": "oklch(0.6 0.08 55)",
    },
  },
  "celadon-sky": {
    key: "celadon-sky",
    label: "青天碧落",
    description: "浅青蓝底配金，清透爽朗",
    swatch: {
      bg: "oklch(0.97 0.02 200)",
      card: "oklch(0.998 0.004 200)",
      primary: "oklch(0.48 0.1 210)",
      accent: "oklch(0.78 0.14 80)",
    },
    light: {
      "--background": "oklch(0.97 0.02 200)",
      "--foreground": "oklch(0.2 0.025 215)",
      "--card": "oklch(0.998 0.004 200)",
      "--card-foreground": "oklch(0.2 0.025 215)",
      "--popover": "oklch(0.998 0.004 200)",
      "--popover-foreground": "oklch(0.2 0.025 215)",
      "--primary": "oklch(0.48 0.1 210)",
      "--primary-foreground": "oklch(0.98 0.01 200)",
      "--secondary": "oklch(0.93 0.028 200)",
      "--secondary-foreground": "oklch(0.3 0.05 210)",
      "--muted": "oklch(0.93 0.022 200)",
      "--muted-foreground": "oklch(0.48 0.035 210)",
      "--accent": "oklch(0.9 0.1 82)",
      "--accent-foreground": "oklch(0.35 0.1 70)",
      "--destructive": "oklch(0.58 0.22 27)",
      "--border": "oklch(0.87 0.028 200)",
      "--input": "oklch(0.9 0.022 200)",
      "--ring": "oklch(0.55 0.09 210)",
    },
    dark: {
      "--background": "oklch(0.18 0.025 220)",
      "--foreground": "oklch(0.96 0.015 200)",
      "--card": "oklch(0.22 0.03 220)",
      "--card-foreground": "oklch(0.96 0.015 200)",
      "--popover": "oklch(0.22 0.03 220)",
      "--popover-foreground": "oklch(0.96 0.015 200)",
      "--primary": "oklch(0.78 0.11 210)",
      "--primary-foreground": "oklch(0.18 0.025 220)",
      "--secondary": "oklch(0.28 0.03 220)",
      "--secondary-foreground": "oklch(0.93 0.015 200)",
      "--muted": "oklch(0.26 0.028 220)",
      "--muted-foreground": "oklch(0.72 0.022 200)",
      "--accent": "oklch(0.45 0.12 78)",
      "--accent-foreground": "oklch(0.97 0.04 85)",
      "--destructive": "oklch(0.7 0.2 27)",
      "--border": "oklch(0.3 0.028 220)",
      "--input": "oklch(0.3 0.028 220)",
      "--ring": "oklch(0.6 0.09 210)",
    },
  },
  "autumn-harvest": {
    key: "autumn-harvest",
    label: "秋收麦田",
    description: "麦色配深琥珀，温暖如夕阳的书房",
    swatch: {
      bg: "oklch(0.955 0.03 80)",
      card: "oklch(0.995 0.01 80)",
      primary: "oklch(0.42 0.1 48)",
      accent: "oklch(0.7 0.15 55)",
    },
    light: {
      "--background": "oklch(0.955 0.03 80)",
      "--foreground": "oklch(0.22 0.035 45)",
      "--card": "oklch(0.995 0.01 80)",
      "--card-foreground": "oklch(0.22 0.035 45)",
      "--popover": "oklch(0.995 0.01 80)",
      "--popover-foreground": "oklch(0.22 0.035 45)",
      "--primary": "oklch(0.42 0.1 48)",
      "--primary-foreground": "oklch(0.98 0.015 80)",
      "--secondary": "oklch(0.92 0.045 80)",
      "--secondary-foreground": "oklch(0.3 0.06 48)",
      "--muted": "oklch(0.92 0.035 80)",
      "--muted-foreground": "oklch(0.48 0.045 48)",
      "--accent": "oklch(0.88 0.1 65)",
      "--accent-foreground": "oklch(0.32 0.1 48)",
      "--destructive": "oklch(0.58 0.22 27)",
      "--border": "oklch(0.85 0.045 80)",
      "--input": "oklch(0.88 0.035 80)",
      "--ring": "oklch(0.55 0.09 48)",
    },
    dark: {
      "--background": "oklch(0.2 0.03 48)",
      "--foreground": "oklch(0.95 0.025 80)",
      "--card": "oklch(0.24 0.035 48)",
      "--card-foreground": "oklch(0.95 0.025 80)",
      "--popover": "oklch(0.24 0.035 48)",
      "--popover-foreground": "oklch(0.95 0.025 80)",
      "--primary": "oklch(0.75 0.12 65)",
      "--primary-foreground": "oklch(0.2 0.03 48)",
      "--secondary": "oklch(0.3 0.035 48)",
      "--secondary-foreground": "oklch(0.94 0.02 80)",
      "--muted": "oklch(0.28 0.035 48)",
      "--muted-foreground": "oklch(0.72 0.03 80)",
      "--accent": "oklch(0.45 0.12 60)",
      "--accent-foreground": "oklch(0.96 0.04 80)",
      "--destructive": "oklch(0.7 0.2 27)",
      "--border": "oklch(0.32 0.035 48)",
      "--input": "oklch(0.32 0.035 48)",
      "--ring": "oklch(0.6 0.1 60)",
    },
  },
}

export const THEME_PRESET_ORDER: ThemePresetKey[] = [
  "jade-garden",
  "warm-sand",
  "morning-mist",
  "pure-moonlight",
  "sandalwood",
  "celadon-sky",
  "autumn-harvest",
]

const STYLE_TAG_ID = "site-theme-preset"
const CACHE_KEY = "site-theme-preset"

function buildCss(preset: ThemePreset) {
  const lightBody = Object.entries(preset.light)
    .map(([k, v]) => `  ${k}: ${v};`)
    .join("\n")
  const darkBody = Object.entries(preset.dark)
    .map(([k, v]) => `  ${k}: ${v};`)
    .join("\n")
  return `:root {\n  --radius: ${sharedRadius};\n${lightBody}\n}\n.dark {\n${darkBody}\n}`
}

export function applyThemePreset(key: ThemePresetKey | null | undefined) {
  if (typeof document === "undefined") return
  const chosen = (key && THEME_PRESETS[key]) || THEME_PRESETS["jade-garden"]
  let tag = document.getElementById(STYLE_TAG_ID) as HTMLStyleElement | null
  if (!tag) {
    tag = document.createElement("style")
    tag.id = STYLE_TAG_ID
    document.head.appendChild(tag)
  }
  tag.textContent = buildCss(chosen)
  try {
    localStorage.setItem(CACHE_KEY, chosen.key)
  } catch {
    /* ignore */
  }
}

export function getCachedThemePreset(): ThemePresetKey {
  if (typeof localStorage === "undefined") return "jade-garden"
  try {
    const v = localStorage.getItem(CACHE_KEY) as ThemePresetKey | null
    if (v && v in THEME_PRESETS) return v
  } catch {
    /* ignore */
  }
  return "jade-garden"
}
