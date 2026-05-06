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

  "fresh-mint": {
    key: "fresh-mint",
    label: "薄荷翡翠",
    description: "清透薄荷绿底搭配奶白卡片，翡翠墨绿作主色",
    swatch: {
      bg: "oklch(0.96 0.03 170)",
      card: "oklch(0.995 0.006 160)",
      primary: "oklch(0.46 0.09 165)",
      accent: "oklch(0.78 0.13 75)",
    },
    light: {
      "--background": "oklch(0.96 0.03 170)",
      "--foreground": "oklch(0.2 0.025 165)",
      "--card": "oklch(0.995 0.006 160)",
      "--card-foreground": "oklch(0.2 0.025 165)",
      "--popover": "oklch(0.995 0.006 160)",
      "--popover-foreground": "oklch(0.2 0.025 165)",
      "--primary": "oklch(0.46 0.09 165)",
      "--primary-foreground": "oklch(0.99 0.008 160)",
      "--secondary": "oklch(0.92 0.04 170)",
      "--secondary-foreground": "oklch(0.3 0.05 165)",
      "--muted": "oklch(0.93 0.03 170)",
      "--muted-foreground": "oklch(0.48 0.035 165)",
      "--accent": "oklch(0.9 0.09 78)",
      "--accent-foreground": "oklch(0.35 0.09 70)",
      "--destructive": "oklch(0.58 0.22 27)",
      "--border": "oklch(0.86 0.035 170)",
      "--input": "oklch(0.9 0.028 170)",
      "--ring": "oklch(0.55 0.09 165)",
    },
    dark: {
      "--background": "oklch(0.19 0.025 170)",
      "--foreground": "oklch(0.96 0.015 160)",
      "--card": "oklch(0.23 0.03 170)",
      "--card-foreground": "oklch(0.96 0.015 160)",
      "--popover": "oklch(0.23 0.03 170)",
      "--popover-foreground": "oklch(0.96 0.015 160)",
      "--primary": "oklch(0.78 0.11 165)",
      "--primary-foreground": "oklch(0.19 0.025 170)",
      "--secondary": "oklch(0.29 0.035 170)",
      "--secondary-foreground": "oklch(0.93 0.015 160)",
      "--muted": "oklch(0.27 0.03 170)",
      "--muted-foreground": "oklch(0.72 0.022 160)",
      "--accent": "oklch(0.45 0.1 78)",
      "--accent-foreground": "oklch(0.97 0.04 85)",
      "--destructive": "oklch(0.7 0.2 27)",
      "--border": "oklch(0.31 0.03 170)",
      "--input": "oklch(0.31 0.03 170)",
      "--ring": "oklch(0.6 0.09 165)",
    },
  },

  "moss-pine": {
    key: "moss-pine",
    label: "苔韵松间",
    description: "苔藓松绿为主，橄榄金作点缀，沉稳自然的森林气息",
    swatch: {
      bg: "oklch(0.96 0.02 140)",
      card: "oklch(0.995 0.006 140)",
      primary: "oklch(0.4 0.09 145)",
      accent: "oklch(0.7 0.13 110)",
    },
    light: {
      "--background": "oklch(0.96 0.02 140)",
      "--foreground": "oklch(0.2 0.025 140)",
      "--card": "oklch(0.995 0.006 140)",
      "--card-foreground": "oklch(0.2 0.025 140)",
      "--popover": "oklch(0.995 0.006 140)",
      "--popover-foreground": "oklch(0.2 0.025 140)",
      "--primary": "oklch(0.4 0.09 145)",
      "--primary-foreground": "oklch(0.98 0.012 140)",
      "--secondary": "oklch(0.93 0.028 140)",
      "--secondary-foreground": "oklch(0.28 0.05 145)",
      "--muted": "oklch(0.93 0.022 140)",
      "--muted-foreground": "oklch(0.46 0.035 140)",
      "--accent": "oklch(0.88 0.08 110)",
      "--accent-foreground": "oklch(0.32 0.08 110)",
      "--destructive": "oklch(0.58 0.22 27)",
      "--border": "oklch(0.86 0.028 140)",
      "--input": "oklch(0.9 0.022 140)",
      "--ring": "oklch(0.5 0.09 145)",
    },
    dark: {
      "--background": "oklch(0.19 0.022 145)",
      "--foreground": "oklch(0.96 0.015 140)",
      "--card": "oklch(0.23 0.025 145)",
      "--card-foreground": "oklch(0.96 0.015 140)",
      "--popover": "oklch(0.23 0.025 145)",
      "--popover-foreground": "oklch(0.96 0.015 140)",
      "--primary": "oklch(0.76 0.1 140)",
      "--primary-foreground": "oklch(0.19 0.022 145)",
      "--secondary": "oklch(0.29 0.03 145)",
      "--secondary-foreground": "oklch(0.93 0.015 140)",
      "--muted": "oklch(0.27 0.028 145)",
      "--muted-foreground": "oklch(0.72 0.022 140)",
      "--accent": "oklch(0.45 0.09 115)",
      "--accent-foreground": "oklch(0.96 0.04 110)",
      "--destructive": "oklch(0.7 0.2 27)",
      "--border": "oklch(0.31 0.028 145)",
      "--input": "oklch(0.31 0.028 145)",
      "--ring": "oklch(0.6 0.09 140)",
    },
  },

  "cream-parchment": {
    key: "cream-parchment",
    label: "奶茶书简",
    description: "奶白浅褐，长时间阅读不易疲劳，低反差温润",
    swatch: {
      bg: "oklch(0.965 0.015 88)",
      card: "oklch(0.99 0.006 88)",
      primary: "oklch(0.38 0.05 60)",
      accent: "oklch(0.78 0.09 68)",
    },
    light: {
      "--background": "oklch(0.965 0.015 88)",
      "--foreground": "oklch(0.26 0.025 60)",
      "--card": "oklch(0.99 0.006 88)",
      "--card-foreground": "oklch(0.26 0.025 60)",
      "--popover": "oklch(0.99 0.006 88)",
      "--popover-foreground": "oklch(0.26 0.025 60)",
      "--primary": "oklch(0.38 0.05 60)",
      "--primary-foreground": "oklch(0.98 0.01 88)",
      "--secondary": "oklch(0.93 0.02 88)",
      "--secondary-foreground": "oklch(0.32 0.04 60)",
      "--muted": "oklch(0.93 0.015 88)",
      "--muted-foreground": "oklch(0.5 0.025 60)",
      "--accent": "oklch(0.9 0.06 75)",
      "--accent-foreground": "oklch(0.38 0.08 60)",
      "--destructive": "oklch(0.58 0.22 27)",
      "--border": "oklch(0.87 0.02 88)",
      "--input": "oklch(0.9 0.018 88)",
      "--ring": "oklch(0.5 0.05 60)",
    },
    dark: {
      "--background": "oklch(0.2 0.018 60)",
      "--foreground": "oklch(0.95 0.012 88)",
      "--card": "oklch(0.24 0.02 60)",
      "--card-foreground": "oklch(0.95 0.012 88)",
      "--popover": "oklch(0.24 0.02 60)",
      "--popover-foreground": "oklch(0.95 0.012 88)",
      "--primary": "oklch(0.82 0.04 80)",
      "--primary-foreground": "oklch(0.2 0.018 60)",
      "--secondary": "oklch(0.3 0.025 60)",
      "--secondary-foreground": "oklch(0.94 0.015 88)",
      "--muted": "oklch(0.28 0.022 60)",
      "--muted-foreground": "oklch(0.72 0.02 88)",
      "--accent": "oklch(0.4 0.06 60)",
      "--accent-foreground": "oklch(0.96 0.03 88)",
      "--destructive": "oklch(0.7 0.2 27)",
      "--border": "oklch(0.31 0.022 60)",
      "--input": "oklch(0.31 0.022 60)",
      "--ring": "oklch(0.6 0.05 70)",
    },
  },

  "ink-ember": {
    key: "ink-ember",
    label: "黛墨落霞",
    description: "深墨蓝主色、落日橙点缀，纸白背景，沉稳中有余温",
    swatch: {
      bg: "oklch(0.97 0.01 80)",
      card: "oklch(0.998 0.003 80)",
      primary: "oklch(0.3 0.06 250)",
      accent: "oklch(0.72 0.16 45)",
    },
    light: {
      "--background": "oklch(0.97 0.01 80)",
      "--foreground": "oklch(0.22 0.03 250)",
      "--card": "oklch(0.998 0.003 80)",
      "--card-foreground": "oklch(0.22 0.03 250)",
      "--popover": "oklch(0.998 0.003 80)",
      "--popover-foreground": "oklch(0.22 0.03 250)",
      "--primary": "oklch(0.3 0.06 250)",
      "--primary-foreground": "oklch(0.98 0.008 80)",
      "--secondary": "oklch(0.93 0.015 80)",
      "--secondary-foreground": "oklch(0.28 0.05 250)",
      "--muted": "oklch(0.93 0.01 80)",
      "--muted-foreground": "oklch(0.48 0.03 250)",
      "--accent": "oklch(0.88 0.1 55)",
      "--accent-foreground": "oklch(0.4 0.14 45)",
      "--destructive": "oklch(0.58 0.22 27)",
      "--border": "oklch(0.88 0.015 80)",
      "--input": "oklch(0.9 0.012 80)",
      "--ring": "oklch(0.45 0.07 250)",
    },
    dark: {
      "--background": "oklch(0.18 0.025 250)",
      "--foreground": "oklch(0.96 0.01 80)",
      "--card": "oklch(0.22 0.028 250)",
      "--card-foreground": "oklch(0.96 0.01 80)",
      "--popover": "oklch(0.22 0.028 250)",
      "--popover-foreground": "oklch(0.96 0.01 80)",
      "--primary": "oklch(0.78 0.08 240)",
      "--primary-foreground": "oklch(0.18 0.025 250)",
      "--secondary": "oklch(0.28 0.03 250)",
      "--secondary-foreground": "oklch(0.93 0.01 80)",
      "--muted": "oklch(0.26 0.028 250)",
      "--muted-foreground": "oklch(0.72 0.02 80)",
      "--accent": "oklch(0.55 0.14 50)",
      "--accent-foreground": "oklch(0.97 0.04 80)",
      "--destructive": "oklch(0.7 0.2 27)",
      "--border": "oklch(0.3 0.028 250)",
      "--input": "oklch(0.3 0.028 250)",
      "--ring": "oklch(0.6 0.09 240)",
    },
  },

  "celadon-butter": {
    key: "celadon-butter",
    label: "青瓷缃色",
    description: "青瓷、象牙、缃黄三色温润相配，雅致不喧",
    swatch: {
      bg: "oklch(0.97 0.015 195)",
      card: "oklch(0.995 0.005 90)",
      primary: "oklch(0.5 0.08 200)",
      accent: "oklch(0.88 0.11 95)",
    },
    light: {
      "--background": "oklch(0.97 0.015 195)",
      "--foreground": "oklch(0.22 0.025 210)",
      "--card": "oklch(0.995 0.005 90)",
      "--card-foreground": "oklch(0.22 0.025 210)",
      "--popover": "oklch(0.995 0.005 90)",
      "--popover-foreground": "oklch(0.22 0.025 210)",
      "--primary": "oklch(0.5 0.08 200)",
      "--primary-foreground": "oklch(0.99 0.008 90)",
      "--secondary": "oklch(0.93 0.022 195)",
      "--secondary-foreground": "oklch(0.3 0.05 200)",
      "--muted": "oklch(0.93 0.018 195)",
      "--muted-foreground": "oklch(0.48 0.03 200)",
      "--accent": "oklch(0.9 0.1 92)",
      "--accent-foreground": "oklch(0.38 0.1 82)",
      "--destructive": "oklch(0.58 0.22 27)",
      "--border": "oklch(0.86 0.022 195)",
      "--input": "oklch(0.9 0.018 195)",
      "--ring": "oklch(0.56 0.08 200)",
    },
    dark: {
      "--background": "oklch(0.19 0.025 205)",
      "--foreground": "oklch(0.96 0.012 90)",
      "--card": "oklch(0.23 0.028 205)",
      "--card-foreground": "oklch(0.96 0.012 90)",
      "--popover": "oklch(0.23 0.028 205)",
      "--popover-foreground": "oklch(0.96 0.012 90)",
      "--primary": "oklch(0.78 0.1 195)",
      "--primary-foreground": "oklch(0.19 0.025 205)",
      "--secondary": "oklch(0.29 0.03 205)",
      "--secondary-foreground": "oklch(0.93 0.012 90)",
      "--muted": "oklch(0.27 0.028 205)",
      "--muted-foreground": "oklch(0.72 0.022 90)",
      "--accent": "oklch(0.48 0.11 85)",
      "--accent-foreground": "oklch(0.97 0.04 90)",
      "--destructive": "oklch(0.7 0.2 27)",
      "--border": "oklch(0.31 0.028 205)",
      "--input": "oklch(0.31 0.028 205)",
      "--ring": "oklch(0.6 0.09 195)",
    },
  },

  "stone-burgundy": {
    key: "stone-burgundy",
    label: "枣红黛青",
    description: "石灰米底，枣红主调，远山青作点睛，古雅有序",
    swatch: {
      bg: "oklch(0.96 0.012 70)",
      card: "oklch(0.995 0.005 70)",
      primary: "oklch(0.4 0.1 20)",
      accent: "oklch(0.58 0.07 210)",
    },
    light: {
      "--background": "oklch(0.96 0.012 70)",
      "--foreground": "oklch(0.24 0.03 25)",
      "--card": "oklch(0.995 0.005 70)",
      "--card-foreground": "oklch(0.24 0.03 25)",
      "--popover": "oklch(0.995 0.005 70)",
      "--popover-foreground": "oklch(0.24 0.03 25)",
      "--primary": "oklch(0.4 0.1 20)",
      "--primary-foreground": "oklch(0.98 0.01 70)",
      "--secondary": "oklch(0.93 0.02 70)",
      "--secondary-foreground": "oklch(0.32 0.06 25)",
      "--muted": "oklch(0.93 0.014 70)",
      "--muted-foreground": "oklch(0.48 0.03 25)",
      "--accent": "oklch(0.88 0.05 210)",
      "--accent-foreground": "oklch(0.35 0.08 210)",
      "--destructive": "oklch(0.58 0.22 27)",
      "--border": "oklch(0.87 0.018 70)",
      "--input": "oklch(0.9 0.014 70)",
      "--ring": "oklch(0.5 0.1 20)",
    },
    dark: {
      "--background": "oklch(0.2 0.025 25)",
      "--foreground": "oklch(0.95 0.012 70)",
      "--card": "oklch(0.24 0.028 25)",
      "--card-foreground": "oklch(0.95 0.012 70)",
      "--popover": "oklch(0.24 0.028 25)",
      "--popover-foreground": "oklch(0.95 0.012 70)",
      "--primary": "oklch(0.78 0.11 25)",
      "--primary-foreground": "oklch(0.2 0.025 25)",
      "--secondary": "oklch(0.3 0.03 25)",
      "--secondary-foreground": "oklch(0.93 0.012 70)",
      "--muted": "oklch(0.28 0.028 25)",
      "--muted-foreground": "oklch(0.72 0.022 70)",
      "--accent": "oklch(0.45 0.08 215)",
      "--accent-foreground": "oklch(0.96 0.04 210)",
      "--destructive": "oklch(0.7 0.2 27)",
      "--border": "oklch(0.32 0.028 25)",
      "--input": "oklch(0.32 0.028 25)",
      "--ring": "oklch(0.6 0.1 25)",
    },
  },
}

export const THEME_PRESET_ORDER: ThemePresetKey[] = [
  "fresh-mint",
  "moss-pine",
  "cream-parchment",
  "warm-sand",
  "ink-ember",
  "celadon-butter",
  "stone-burgundy",
]

const STYLE_TAG_ID = "site-theme-preset"
const CACHE_KEY = "site-theme-preset"

/* ── oklch → hex/rgba converter (runs in JS, not CSS) ── */
function oklchToFallback(raw: string): string {
  const m = raw.match(/oklch\(\s*([\d.]+)\s+([\d.]+)\s+([\d.]+)(?:\s*\/\s*([\d.%]+))?\s*\)/)
  if (!m) return raw
  const L = +m[1], C = +m[2], H = +m[3]
  const alpha = m[4] ? (m[4].endsWith("%") ? +m[4].slice(0, -1) / 100 : +m[4]) : 1
  const hRad = H * Math.PI / 180
  const a = C * Math.cos(hRad), b = C * Math.sin(hRad)
  const l_ = L + 0.3963377774 * a + 0.2158037573 * b
  const m_ = L - 0.1055613458 * a - 0.0638541728 * b
  const s_ = L - 0.0894841775 * a - 1.2914855480 * b
  const l3 = l_ * l_ * l_, m3 = m_ * m_ * m_, s3 = s_ * s_ * s_
  const lr = 4.0767416621 * l3 - 3.3077115913 * m3 + 0.2309699292 * s3
  const lg = -1.2684380046 * l3 + 2.6097574011 * m3 - 0.3413193965 * s3
  const lb = -0.0041960863 * l3 - 0.7034186147 * m3 + 1.7076147010 * s3
  const gamma = (x: number) => x <= 0.0031308 ? 12.92 * x : 1.055 * Math.pow(x, 1 / 2.4) - 0.055
  const clamp = (x: number) => Math.round(Math.max(0, Math.min(1, gamma(x))) * 255)
  const r = clamp(lr), g = clamp(lg), bv = clamp(lb)
  if (alpha < 1) return `rgba(${r}, ${g}, ${bv}, ${alpha})`
  return `#${r.toString(16).padStart(2, "0")}${g.toString(16).padStart(2, "0")}${bv.toString(16).padStart(2, "0")}`
}

function buildCss(preset: ThemePreset) {
  // Hex fallback values (old browsers)
  const lightHex = Object.entries(preset.light)
    .map(([k, v]) => `  ${k}: ${oklchToFallback(v)};`)
    .join("\n")
  const darkHex = Object.entries(preset.dark)
    .map(([k, v]) => `  ${k}: ${oklchToFallback(v)};`)
    .join("\n")
  // oklch values for modern browsers
  const lightOklch = Object.entries(preset.light)
    .map(([k, v]) => `    ${k}: ${v};`)
    .join("\n")
  const darkOklch = Object.entries(preset.dark)
    .map(([k, v]) => `    ${k}: ${v};`)
    .join("\n")
  return `:root {\n  --radius: ${sharedRadius};\n${lightHex}\n}\n.dark {\n${darkHex}\n}\n@supports (color: oklch(0 0 0)) {\n  :root {\n${lightOklch}\n  }\n  .dark {\n${darkOklch}\n  }\n}`
}

export function applyThemePreset(key: ThemePresetKey | null | undefined) {
  if (typeof document === "undefined") return
  const chosen = (key && THEME_PRESETS[key]) || THEME_PRESETS["warm-sand"]
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
  if (typeof localStorage === "undefined") return "warm-sand"
  try {
    const v = localStorage.getItem(CACHE_KEY) as ThemePresetKey | null
    if (v && v in THEME_PRESETS) return v
  } catch {
    /* ignore */
  }
  return "warm-sand"
}
