import { useSiteSettings } from "@/contexts/site-settings-context"
import { EightPointStar, GeometricPattern } from "@/components/geometric-pattern"
import type { HeroSize, HeroVariant } from "@/lib/database.types"

const VARIANT_GRADIENT: Record<HeroVariant, string> = {
  auto: "bg-gradient-to-br from-primary via-[color-mix(in_oklab,var(--primary)_55%,var(--accent))] to-accent",
  jade: "bg-gradient-to-br from-[oklch(0.5_0.1_165)] via-[oklch(0.45_0.09_170)] to-[oklch(0.6_0.12_160)]",
  amber: "bg-gradient-to-br from-[oklch(0.55_0.14_60)] via-[oklch(0.6_0.15_55)] to-[oklch(0.72_0.14_70)]",
  teal: "bg-gradient-to-br from-[oklch(0.5_0.1_200)] via-[oklch(0.55_0.11_210)] to-[oklch(0.65_0.1_190)]",
  sunset: "bg-gradient-to-br from-[oklch(0.5_0.14_28)] via-[oklch(0.6_0.15_50)] to-[oklch(0.72_0.14_70)]",
  mono: "bg-gradient-to-br from-[oklch(0.28_0.01_90)] via-[oklch(0.32_0.01_90)] to-[oklch(0.42_0.01_90)]",
}

const SIZE: Record<HeroSize, { wrap: string; icon: string; title: string; eyebrow: string; sub: string; gap: string }> = {
  compact: {
    wrap: "px-4 py-3.5",
    icon: "h-10 w-10",
    title: "text-base",
    eyebrow: "text-[10px]",
    sub: "text-[11px]",
    gap: "gap-3",
  },
  standard: {
    wrap: "px-5 py-5",
    icon: "h-12 w-12",
    title: "text-lg",
    eyebrow: "text-[11px]",
    sub: "text-[11px]",
    gap: "gap-3",
  },
  tall: {
    wrap: "px-6 py-7",
    icon: "h-14 w-14",
    title: "text-xl",
    eyebrow: "text-[12px]",
    sub: "text-[12px]",
    gap: "gap-4",
  },
}

export function HomeHero() {
  const { settings } = useSiteSettings()
  if (!settings.hero_enabled) return null

  const size = SIZE[settings.hero_size] ?? SIZE.standard
  const variant = VARIANT_GRADIENT[settings.hero_variant] ?? VARIANT_GRADIENT.auto

  return (
    <section className="relative mx-4 mt-4 overflow-hidden rounded-2xl shadow-sm ring-1 ring-primary/15">
      <div className={`absolute inset-0 ${variant}`} />
      {settings.hero_pattern === "geometric" && (
        <GeometricPattern className="absolute inset-0 h-full w-full text-primary-foreground/25" />
      )}
      {settings.hero_pattern === "subtle" && (
        <div
          aria-hidden
          className="absolute inset-0 opacity-[0.08]"
          style={{
            backgroundImage:
              "radial-gradient(circle at 20% 20%, currentColor 1px, transparent 1px), radial-gradient(circle at 80% 60%, currentColor 1px, transparent 1px)",
            backgroundSize: "24px 24px, 32px 32px",
            color: "var(--primary-foreground)",
          }}
        />
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
      <div className={`relative flex items-center ${size.gap} ${size.wrap}`}>
        <span
          className={`flex shrink-0 items-center justify-center rounded-xl bg-primary-foreground/15 backdrop-blur-sm ring-1 ring-primary-foreground/25 text-primary-foreground ${size.icon}`}
        >
          <EightPointStar size={26} />
        </span>
        <div className="min-w-0 flex-1 text-primary-foreground">
          {settings.hero_eyebrow && (
            <div className={`uppercase tracking-[0.22em] opacity-80 ${size.eyebrow}`}>
              {settings.hero_eyebrow}
            </div>
          )}
          {settings.hero_title && (
            <div className={`font-serif-cn font-semibold leading-tight mt-0.5 ${size.title}`}>
              {settings.hero_title}
            </div>
          )}
          {settings.hero_subtitle && (
            <div className={`opacity-85 mt-0.5 ${size.sub}`}>{settings.hero_subtitle}</div>
          )}
        </div>
      </div>
    </section>
  )
}
