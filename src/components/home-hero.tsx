import type { HeroPattern, HeroVariant } from "@/lib/database.types"
import { useSiteSettings } from "@/contexts/site-settings-context"
import { EightPointStar, GeometricPattern } from "@/components/geometric-pattern"
import { cn } from "@/lib/utils"

const VARIANT_GRADIENT: Record<Exclude<HeroVariant, "auto">, string> = {
  jade:
    "from-[#1f7a5e] via-[#2d8c6e] to-[#c49828]",
  amber:
    "from-[#7a5c2e] via-[#8e6e32] to-[#c49838]",
  ink:
    "from-[#2a3a6a] via-[#3a4a7a] to-[#d08030]",
  teal:
    "from-[#2a7a8a] via-[#3a8a8e] to-[#d0d060]",
  ember:
    "from-[#7a2a1a] via-[#9a4020] to-[#c48830]",
  mono:
    "from-[#3a3632] via-[#504c48] to-[#6a6660]",
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
  const gradient =
    VARIANT_GRADIENT[variant as Exclude<HeroVariant, "auto">] ?? VARIANT_GRADIENT.jade

  const pattern: HeroPattern = settings.hero_pattern

  return (
    <section
      className={cn(
        "relative mx-4 mt-4 overflow-hidden rounded-2xl shadow-sm ring-1",
        settings.hero_variant === "auto"
          ? "ring-primary/15"
          : "ring-foreground/10"
      )}
    >
      {settings.hero_variant === "auto" ? (
        <div className="absolute inset-0 bg-gradient-to-br from-primary via-primary/60 to-accent" />
      ) : (
        <div className={cn("absolute inset-0 bg-gradient-to-br", gradient)} />
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
            className="absolute -right-6 -top-6 h-28 w-28 rounded-full bg-primary-foreground/15 blur-2xl"
          />
          <div
            aria-hidden
            className="absolute -left-8 bottom-0 h-24 w-24 rounded-full bg-accent/30 blur-2xl"
          />
        </>
      )}

      <div className={cn("relative flex items-center gap-3", SIZE_PAD[settings.hero_size])}>
        <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-primary-foreground/15 backdrop-blur-sm ring-1 ring-primary-foreground/25 text-primary-foreground">
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
