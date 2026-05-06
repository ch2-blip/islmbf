import type { HeroPattern, HeroVariant } from "@/lib/database.types"
import { useSiteSettings } from "@/contexts/site-settings-context"
import { EightPointStar, GeometricPattern } from "@/components/geometric-pattern"
import { cn } from "@/lib/utils"

/** Hex color stops used in inline gradient styles (old browser safe). */
const VARIANT_COLORS: Record<Exclude<HeroVariant, "auto">, string[]> = {
  jade:  ["#1f7a5e", "#2d8c6e", "#c49828"],
  amber: ["#7a5c2e", "#8e6e32", "#c49838"],
  ink:   ["#2a3a6a", "#3a4a7a", "#d08030"],
  teal:  ["#2a7a8a", "#3a8a8e", "#d0d060"],
  ember: ["#7a2a1a", "#9a4020", "#c48830"],
  mono:  ["#3a3632", "#504c48", "#6a6660"],
}

const SIZE_PAD: Record<string, string> = {
  compact: "px-5 py-4",
  standard: "px-5 py-5",
  grand: "px-6 py-7",
}

export function HomeHero() {
  const { settings } = useSiteSettings()
  if (!settings.hero_enabled) return null

  const variant: HeroVariant =
    settings.hero_variant === "auto" ? "jade" : settings.hero_variant

  const pattern: HeroPattern = settings.hero_pattern

  return (
    <section
      className="relative mx-4 mt-4 overflow-hidden rounded-2xl shadow-sm"
      style={{ boxShadow: "inset 0 0 0 1px rgba(0,0,0,0.1)" }}
    >
      {settings.hero_variant === "auto" ? (
        <div
          className="absolute inset-0"
          style={{ background: "linear-gradient(to bottom right, var(--primary), var(--accent))" }}
        />
      ) : (
        <div
          className="absolute inset-0"
          style={{ background: `linear-gradient(to bottom right, ${VARIANT_COLORS[variant as Exclude<HeroVariant, "auto">]?.join(", ") ?? "#1f7a5e, #2d8c6e, #c49828"})` }}
        />
      )}

      {pattern === "geometric" && (
        <GeometricPattern className="absolute inset-0 h-full w-full text-primary-foreground/25" />
      )}
      {pattern === "subtle" && (
        <div
          aria-hidden
          className="absolute inset-0 opacity-20"
          style={{
            backgroundImage:
              "radial-gradient(circle at 1px 1px, var(--color-primary-foreground) 1px, transparent 0)",
            backgroundSize: "14px 14px",
          }}
        />
      )}
      {pattern === "stars" && (
        <div aria-hidden className="pointer-events-none absolute inset-0 text-primary-foreground/30">
          <EightPointStar size={40} className="absolute -right-4 top-2" />
          <EightPointStar size={28} className="absolute right-16 bottom-2" />
          <EightPointStar size={22} className="absolute left-8 top-3" />
        </div>
      )}

      {settings.hero_glow && (
        <>
          <div
            aria-hidden
            className="absolute -right-6 -top-6 h-28 w-28 rounded-full"
            style={{ backgroundColor: "rgba(255,255,255,0.10)" }}
          />
          <div
            aria-hidden
            className="absolute -left-8 bottom-0 h-24 w-24 rounded-full"
            style={{ backgroundColor: "rgba(216,154,42,0.20)" }}
          />
        </>
      )}

      <div className={cn("relative flex items-center gap-3", SIZE_PAD[settings.hero_size])}>
        <span
          className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl text-primary-foreground"
          style={{ backgroundColor: "rgba(255,255,255,0.15)", boxShadow: "inset 0 0 0 1px rgba(255,255,255,0.25)" }}
        >
          <EightPointStar size={26} />
        </span>
        <div className="min-w-0 flex-1 text-primary-foreground">
          {settings.hero_eyebrow && (
            <div className="text-[11px] uppercase tracking-[0.22em] opacity-80">
              {settings.hero_eyebrow}
            </div>
          )}
          <div
            className={cn(
              "font-serif-cn font-semibold leading-tight mt-0.5",
              settings.hero_size === "grand" ? "text-xl" : "text-lg"
            )}
          >
            {settings.hero_title}
          </div>
          {settings.hero_subtitle && (
            <div className="text-[11px] opacity-85 mt-0.5">{settings.hero_subtitle}</div>
          )}
        </div>
      </div>
    </section>
  )
}
