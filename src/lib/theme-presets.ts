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

/* ── Universal deep-ink text colors (shared across ALL presets) ── */
const INK_FG        = "oklch(0.18 0.012 55)"   // ≈ #1C1917  近黑深墨
const INK_CARD_FG   = "oklch(0.18 0.012 55)"
const INK_POP_FG    = "oklch(0.18 0.012 55)"
const INK_MUTED_FG  = "oklch(0.42 0.018 55)"   // ≈ #5C5650  次级灰
const INK_SEC_FG    = "oklch(0.26 0.012 55)"   // ≈ #3A3634  副标题

export const THEME_PRESETS: Record<ThemePresetKey, ThemePreset> = {
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
      "--foreground": INK_FG,
      "--card": "oklch(0.995 0.005 70)",
      "--card-foreground": INK_CARD_FG,
      "--popover": "oklch(0.995 0.005 70)",
      "--popover-foreground": INK_POP_FG,
      "--primary": "oklch(0.4 0.1 20)",
      "--primary-foreground": "oklch(0.98 0.01 70)",
      "--secondary": "oklch(0.93 0.02 70)",
      "--secondary-foreground": INK_SEC_FG,
      "--muted": "oklch(0.93 0.014 70)",
      "--muted-foreground": INK_MUTED_FG,
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

  "paper-classic": {
    key: "paper-classic",
    label: "经典纸感",
    description: "奶油暖纸背景，清爽深绿按钮，明亮温润，干净高级",
    swatch: {
      bg: "#FFF7E6",
      card: "#FFFDF7",
      primary: "#087A68",
      accent: "#D4A245",
    },
    light: {
      "--background": "#FFF7E6",
      "--foreground": INK_FG,
      "--card": "#FFFDF7",
      "--card-foreground": INK_CARD_FG,
      "--popover": "#FFFDF7",
      "--popover-foreground": INK_POP_FG,
      "--primary": "#087A68",
      "--primary-foreground": "#FFFDF7",
      "--secondary": "#EAF6EF",
      "--secondary-foreground": INK_SEC_FG,
      "--muted": "#F0ECDF",
      "--muted-foreground": INK_MUTED_FG,
      "--accent": "#D4A245",
      "--accent-foreground": "#3D2A10",
      "--destructive": "#C2492C",
      "--border": "#E8DCC5",
      "--input": "#EDE2CC",
      "--ring": "#066D58",
    },
    dark: {
      "--background": "#1A1610",
      "--foreground": "#F5F0E2",
      "--card": "#222018",
      "--card-foreground": "#F5F0E2",
      "--popover": "#222018",
      "--popover-foreground": "#F5F0E2",
      "--primary": "#5CC4A8",
      "--primary-foreground": "#1A1610",
      "--secondary": "#2A2820",
      "--secondary-foreground": "#F0ECDF",
      "--muted": "#282618",
      "--muted-foreground": "#B0A890",
      "--accent": "#C4942A",
      "--accent-foreground": "#F5F0E2",
      "--destructive": "#D0573D",
      "--border": "#3A362A",
      "--input": "#3A362A",
      "--ring": "#5CC4A8",
    },
  },

  "pine-elegance": {
    key: "pine-elegance",
    label: "松绿典雅",
    description: "明亮深绿主色，暖白背景，暗金点缀，典雅有活力",
    swatch: {
      bg: "#FBF6E8",
      card: "#FFFDF6",
      primary: "#087B5D",
      accent: "#C4942A",
    },
    light: {
      "--background": "#FBF6E8",
      "--foreground": INK_FG,
      "--card": "#FFFDF6",
      "--card-foreground": INK_CARD_FG,
      "--popover": "#FFFDF6",
      "--popover-foreground": INK_POP_FG,
      "--primary": "#087B5D",
      "--primary-foreground": "#FFFDF6",
      "--secondary": "#E6F3EC",
      "--secondary-foreground": INK_SEC_FG,
      "--muted": "#EEE8D8",
      "--muted-foreground": INK_MUTED_FG,
      "--accent": "#D89A2A",
      "--accent-foreground": "#3D2A10",
      "--destructive": "#C2492C",
      "--border": "#E0D6BE",
      "--input": "#E8DFCA",
      "--ring": "#0C8A63",
    },
    dark: {
      "--background": "#141E18",
      "--foreground": "#F2EDE0",
      "--card": "#1C2820",
      "--card-foreground": "#F2EDE0",
      "--popover": "#1C2820",
      "--popover-foreground": "#F2EDE0",
      "--primary": "#60C9A0",
      "--primary-foreground": "#141E18",
      "--secondary": "#243028",
      "--secondary-foreground": "#F0EAD8",
      "--muted": "#223026",
      "--muted-foreground": "#A8BCA8",
      "--accent": "#C4942A",
      "--accent-foreground": "#F2EDE0",
      "--destructive": "#D0573D",
      "--border": "#2E3E34",
      "--input": "#2E3E34",
      "--ring": "#60C9A0",
    },
  },

  "twilight-orchid": {
    key: "twilight-orchid",
    label: "暮兰雅韵",
    description: "淡紫灰背景，靛蓝主色，暖铜点缀，沉静典雅",
    swatch: {
      bg: "oklch(0.965 0.012 290)",
      card: "oklch(0.995 0.005 280)",
      primary: "oklch(0.42 0.10 270)",
      accent: "oklch(0.68 0.12 55)",
    },
    light: {
      "--background": "oklch(0.965 0.012 290)",
      "--foreground": INK_FG,
      "--card": "oklch(0.995 0.005 280)",
      "--card-foreground": INK_CARD_FG,
      "--popover": "oklch(0.995 0.005 280)",
      "--popover-foreground": INK_POP_FG,
      "--primary": "oklch(0.42 0.10 270)",
      "--primary-foreground": "oklch(0.98 0.006 280)",
      "--secondary": "oklch(0.93 0.018 290)",
      "--secondary-foreground": INK_SEC_FG,
      "--muted": "oklch(0.93 0.012 290)",
      "--muted-foreground": INK_MUTED_FG,
      "--accent": "oklch(0.86 0.08 55)",
      "--accent-foreground": "oklch(0.35 0.1 50)",
      "--destructive": "oklch(0.58 0.22 27)",
      "--border": "oklch(0.88 0.015 290)",
      "--input": "oklch(0.91 0.01 290)",
      "--ring": "oklch(0.50 0.10 270)",
    },
    dark: {
      "--background": "oklch(0.18 0.02 270)",
      "--foreground": "oklch(0.95 0.01 280)",
      "--card": "oklch(0.22 0.025 270)",
      "--card-foreground": "oklch(0.95 0.01 280)",
      "--popover": "oklch(0.22 0.025 270)",
      "--popover-foreground": "oklch(0.95 0.01 280)",
      "--primary": "oklch(0.72 0.10 270)",
      "--primary-foreground": "oklch(0.18 0.02 270)",
      "--secondary": "oklch(0.28 0.025 270)",
      "--secondary-foreground": "oklch(0.93 0.01 280)",
      "--muted": "oklch(0.26 0.02 270)",
      "--muted-foreground": "oklch(0.70 0.015 280)",
      "--accent": "oklch(0.58 0.11 55)",
      "--accent-foreground": "oklch(0.96 0.04 55)",
      "--destructive": "oklch(0.7 0.2 27)",
      "--border": "oklch(0.30 0.025 270)",
      "--input": "oklch(0.30 0.025 270)",
      "--ring": "oklch(0.58 0.10 270)",
    },
  },

  "autumn-study": {
    key: "autumn-study",
    label: "秋棠书房",
    description: "暖灰纸色背景，赭石主色，橄榄绿点缀，沉稳温润",
    swatch: {
      bg: "oklch(0.965 0.012 75)",
      card: "oklch(0.995 0.005 80)",
      primary: "oklch(0.42 0.09 45)",
      accent: "oklch(0.58 0.09 145)",
    },
    light: {
      "--background": "oklch(0.965 0.012 75)",
      "--foreground": INK_FG,
      "--card": "oklch(0.995 0.005 80)",
      "--card-foreground": INK_CARD_FG,
      "--popover": "oklch(0.995 0.005 80)",
      "--popover-foreground": INK_POP_FG,
      "--primary": "oklch(0.42 0.09 45)",
      "--primary-foreground": "oklch(0.98 0.008 80)",
      "--secondary": "oklch(0.93 0.018 75)",
      "--secondary-foreground": INK_SEC_FG,
      "--muted": "oklch(0.93 0.012 75)",
      "--muted-foreground": INK_MUTED_FG,
      "--accent": "oklch(0.85 0.06 145)",
      "--accent-foreground": "oklch(0.32 0.08 145)",
      "--destructive": "oklch(0.58 0.22 27)",
      "--border": "oklch(0.88 0.015 75)",
      "--input": "oklch(0.91 0.01 75)",
      "--ring": "oklch(0.50 0.09 45)",
    },
    dark: {
      "--background": "oklch(0.18 0.02 45)",
      "--foreground": "oklch(0.95 0.01 80)",
      "--card": "oklch(0.22 0.025 45)",
      "--card-foreground": "oklch(0.95 0.01 80)",
      "--popover": "oklch(0.22 0.025 45)",
      "--popover-foreground": "oklch(0.95 0.01 80)",
      "--primary": "oklch(0.72 0.09 45)",
      "--primary-foreground": "oklch(0.18 0.02 45)",
      "--secondary": "oklch(0.28 0.025 45)",
      "--secondary-foreground": "oklch(0.93 0.01 80)",
      "--muted": "oklch(0.26 0.02 45)",
      "--muted-foreground": "oklch(0.70 0.015 80)",
      "--accent": "oklch(0.50 0.08 145)",
      "--accent-foreground": "oklch(0.96 0.04 145)",
      "--destructive": "oklch(0.7 0.2 27)",
      "--border": "oklch(0.30 0.025 45)",
      "--input": "oklch(0.30 0.025 45)",
      "--ring": "oklch(0.58 0.09 45)",
    },
  },

  "ink-porcelain": {
    key: "ink-porcelain",
    label: "青墨白瓷",
    description: "冷白瓷底，深墨蓝主色，淡金点缀，清冽有辨识度",
    swatch: {
      bg: "oklch(0.97 0.006 240)",
      card: "oklch(0.995 0.003 240)",
      primary: "oklch(0.35 0.08 250)",
      accent: "oklch(0.78 0.10 85)",
    },
    light: {
      "--background": "oklch(0.97 0.006 240)",
      "--foreground": INK_FG,
      "--card": "oklch(0.995 0.003 240)",
      "--card-foreground": INK_CARD_FG,
      "--popover": "oklch(0.995 0.003 240)",
      "--popover-foreground": INK_POP_FG,
      "--primary": "oklch(0.35 0.08 250)",
      "--primary-foreground": "oklch(0.98 0.005 240)",
      "--secondary": "oklch(0.94 0.01 240)",
      "--secondary-foreground": INK_SEC_FG,
      "--muted": "oklch(0.94 0.006 240)",
      "--muted-foreground": INK_MUTED_FG,
      "--accent": "oklch(0.88 0.08 85)",
      "--accent-foreground": "oklch(0.35 0.09 80)",
      "--destructive": "oklch(0.58 0.22 27)",
      "--border": "oklch(0.90 0.008 240)",
      "--input": "oklch(0.92 0.005 240)",
      "--ring": "oklch(0.45 0.08 250)",
    },
    dark: {
      "--background": "oklch(0.17 0.025 250)",
      "--foreground": "oklch(0.95 0.008 240)",
      "--card": "oklch(0.21 0.028 250)",
      "--card-foreground": "oklch(0.95 0.008 240)",
      "--popover": "oklch(0.21 0.028 250)",
      "--popover-foreground": "oklch(0.95 0.008 240)",
      "--primary": "oklch(0.72 0.08 250)",
      "--primary-foreground": "oklch(0.17 0.025 250)",
      "--secondary": "oklch(0.27 0.028 250)",
      "--secondary-foreground": "oklch(0.93 0.008 240)",
      "--muted": "oklch(0.25 0.025 250)",
      "--muted-foreground": "oklch(0.70 0.015 240)",
      "--accent": "oklch(0.60 0.10 85)",
      "--accent-foreground": "oklch(0.96 0.04 85)",
      "--destructive": "oklch(0.7 0.2 27)",
      "--border": "oklch(0.29 0.028 250)",
      "--input": "oklch(0.29 0.028 250)",
      "--ring": "oklch(0.55 0.08 250)",
    },
  },
}

export const THEME_PRESET_ORDER: ThemePresetKey[] = [
  "stone-burgundy",
  "paper-classic",
  "pine-elegance",
  "twilight-orchid",
  "autumn-study",
  "ink-porcelain",
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
  const chosen = (key && THEME_PRESETS[key]) || THEME_PRESETS["stone-burgundy"]
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
  if (typeof localStorage === "undefined") return "stone-burgundy"
  try {
    const v = localStorage.getItem(CACHE_KEY) as ThemePresetKey | null
    if (v && v in THEME_PRESETS) return v
  } catch {
    /* ignore */
  }
  return "stone-burgundy"
}

/* ── Text Depth (reading darkness) ── */
import type { TextDepth } from "./database.types"

const TEXT_DEPTH_CACHE_KEY = "site-text-depth"

const TEXT_DEPTH_MAP: Record<TextDepth, { fg: string; fgHex: string; muted: string; mutedHex: string; label: string }> = {
  standard: {
    fg: "oklch(0.30 0.015 55)",   fgHex: "#4A4440",
    muted: "oklch(0.50 0.018 55)", mutedHex: "#807870",
    label: "标准",
  },
  deep: {
    fg: "oklch(0.22 0.012 55)",   fgHex: "#2E2A27",
    muted: "oklch(0.44 0.018 55)", mutedHex: "#6A6460",
    label: "加深",
  },
  deeper: {
    fg: "oklch(0.15 0.008 55)",   fgHex: "#181514",
    muted: "oklch(0.38 0.015 55)", mutedHex: "#565048",
    label: "浓墨",
  },
  max: {
    fg: "oklch(0.08 0.003 55)",   fgHex: "#0A0908",
    muted: "oklch(0.32 0.012 55)", mutedHex: "#46413D",
    label: "极深",
  },
}

export { TEXT_DEPTH_MAP }

export function applyTextDepth(depth: TextDepth | null | undefined) {
  if (typeof document === "undefined") return
  const d = (depth && TEXT_DEPTH_MAP[depth]) ? depth : "deep"
  const m = TEXT_DEPTH_MAP[d]
  const el = document.documentElement
  // Set directly on <html> element style — this has highest CSS priority
  // and cannot be overridden by any :root or html:root stylesheet rules
  el.style.setProperty("--foreground", m.fgHex)
  el.style.setProperty("--card-foreground", m.fgHex)
  el.style.setProperty("--popover-foreground", m.fgHex)
  el.style.setProperty("--muted-foreground", m.mutedHex)
  try {
    localStorage.setItem(TEXT_DEPTH_CACHE_KEY, d)
  } catch { /* ignore */ }
}

export function getCachedTextDepth(): TextDepth {
  if (typeof localStorage === "undefined") return "deep"
  try {
    const v = localStorage.getItem(TEXT_DEPTH_CACHE_KEY) as TextDepth | null
    if (v && v in TEXT_DEPTH_MAP) return v
  } catch { /* ignore */ }
  return "deep"
}
