import { useEffect, useRef, useState } from "react"
import { supabase } from "@/lib/supabase"
import type {
  HeroPattern,
  HeroSize,
  HeroVariant,
  SiteSettings,
  ThemePresetKey,
} from "@/lib/database.types"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Textarea } from "@/components/ui/textarea"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { toast } from "sonner"
import { Check, Link2, Palette, ShieldCheck, Sparkles, Upload } from "lucide-react"
import {
  THEME_PRESETS,
  THEME_PRESET_ORDER,
  applyThemePreset,
} from "@/lib/theme-presets"
import { EightPointStar, GeometricPattern } from "@/components/geometric-pattern"

const HERO_VARIANTS: { key: HeroVariant; label: string; className: string }[] = [
  {
    key: "auto",
    label: "自动（跟随主题）",
    className:
      "bg-gradient-to-br from-primary via-[color-mix(in_oklab,var(--primary)_55%,var(--accent))] to-accent",
  },
  {
    key: "jade",
    label: "翡翠",
    className:
      "bg-gradient-to-br from-[oklch(0.42_0.09_165)] via-[oklch(0.52_0.1_170)] to-[oklch(0.7_0.12_75)]",
  },
  {
    key: "amber",
    label: "琥珀",
    className:
      "bg-gradient-to-br from-[oklch(0.45_0.08_55)] via-[oklch(0.55_0.1_60)] to-[oklch(0.78_0.14_75)]",
  },
  {
    key: "teal",
    label: "湖青",
    className:
      "bg-gradient-to-br from-[oklch(0.48_0.1_200)] via-[oklch(0.58_0.09_205)] to-[oklch(0.88_0.11_95)]",
  },
  {
    key: "ember",
    label: "夕照",
    className:
      "bg-gradient-to-br from-[oklch(0.38_0.1_20)] via-[oklch(0.5_0.12_30)] to-[oklch(0.78_0.14_50)]",
  },
  {
    key: "ink",
    label: "墨蓝",
    className:
      "bg-gradient-to-br from-[oklch(0.28_0.06_250)] via-[oklch(0.38_0.07_245)] to-[oklch(0.72_0.16_45)]",
  },
  {
    key: "mono",
    label: "素雅",
    className:
      "bg-gradient-to-br from-[oklch(0.28_0.02_60)] via-[oklch(0.38_0.02_60)] to-[oklch(0.5_0.02_60)]",
  },
]

export function SiteSettingsPanel() {
  const fileRef = useRef<HTMLInputElement>(null)
  const [settings, setSettings] = useState<SiteSettings | null>(null)
  const [saving, setSaving] = useState(false)
  const [uploading, setUploading] = useState(false)

  // form state
  const [name, setName] = useState("")
  const [iconUrl, setIconUrl] = useState("")
  const [allowVideo, setAllowVideo] = useState(false)
  const [themePreset, setThemePreset] = useState<ThemePresetKey>("warm-sand")
  const [heroEnabled, setHeroEnabled] = useState(true)
  const [heroEyebrow, setHeroEyebrow] = useState("")
  const [heroTitle, setHeroTitle] = useState("")
  const [heroSubtitle, setHeroSubtitle] = useState("")
  const [heroSize, setHeroSize] = useState<HeroSize>("standard")
  const [heroVariant, setHeroVariant] = useState<HeroVariant>("auto")
  const [heroGlow, setHeroGlow] = useState(true)
  const [heroPattern, setHeroPattern] = useState<HeroPattern>("geometric")
  const [footerText, setFooterText] = useState("")
  const [registrationOpen, setRegistrationOpen] = useState(true)
  const [icpText, setIcpText] = useState("")

  useEffect(() => {
    load()
  }, [])

  async function load() {
    const { data } = await supabase.from("site_settings").select("*").eq("id", 1).maybeSingle()
    if (!data) return
    setSettings(data)
    setName(data.site_name ?? "")
    setIconUrl(data.site_icon_url ?? "")
    setAllowVideo(!!data.allow_video_posts)
    if (data.theme_preset && data.theme_preset in THEME_PRESETS) {
      setThemePreset(data.theme_preset as ThemePresetKey)
    }
    setHeroEnabled(data.hero_enabled ?? true)
    setHeroEyebrow(data.hero_eyebrow ?? "")
    setHeroTitle(data.hero_title ?? "")
    setHeroSubtitle(data.hero_subtitle ?? "")
    setHeroSize((data.hero_size as HeroSize) ?? "standard")
    setHeroVariant((data.hero_variant as HeroVariant) ?? "auto")
    setHeroGlow(data.hero_glow ?? true)
    setHeroPattern((data.hero_pattern as HeroPattern) ?? "geometric")
    setFooterText(data.footer_text ?? "")
    setRegistrationOpen(data.registration_open ?? true)
    setIcpText(data.icp_text ?? "")
  }

  function pickTheme(key: ThemePresetKey) {
    setThemePreset(key)
    applyThemePreset(key)
  }

  async function uploadIcon(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    if (file.size > 2 * 1024 * 1024) {
      toast.error("图标不能超过 2MB")
      return
    }
    setUploading(true)
    const ext = file.name.split(".").pop() || "png"
    const path = `icon-${Date.now()}.${ext}`
    const { error: upErr } = await supabase.storage
      .from("site-assets")
      .upload(path, file, { cacheControl: "3600", upsert: true })
    if (upErr) {
      setUploading(false)
      toast.error("上传失败：" + upErr.message)
      return
    }
    const { data: pub } = supabase.storage.from("site-assets").getPublicUrl(path)
    setIconUrl(pub.publicUrl)
    setUploading(false)
    toast.success("图标已上传，记得点保存")
  }

  async function save() {
    setSaving(true)
    const { error } = await supabase
      .from("site_settings")
      .update({
        site_name: name,
        site_icon_url: iconUrl,
        allow_video_posts: allowVideo,
        theme_preset: themePreset,
        hero_enabled: heroEnabled,
        hero_eyebrow: heroEyebrow,
        hero_title: heroTitle,
        hero_subtitle: heroSubtitle,
        hero_size: heroSize,
        hero_variant: heroVariant,
        hero_glow: heroGlow,
        hero_pattern: heroPattern,
        footer_text: footerText,
        registration_open: registrationOpen,
        icp_text: icpText,
        updated_at: new Date().toISOString(),
      })
      .eq("id", 1)
    setSaving(false)
    if (error) {
      toast.error("保存失败：" + error.message)
      return
    }
    window.dispatchEvent(new Event("site-settings-updated"))
    toast.success("已保存")
    load()
  }

  return (
    <div className="space-y-4 pb-6">
      <Card className="p-4 space-y-4">
        <div className="space-y-2">
          <Label>网站名称</Label>
          <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="静园" />
        </div>

        <div className="space-y-2">
          <Label>网站图标</Label>
          <div className="flex items-center gap-3">
            {iconUrl ? (
              <img src={iconUrl} alt="" className="h-12 w-12 rounded-lg border object-cover" />
            ) : (
              <div className="h-12 w-12 rounded-lg border bg-muted" />
            )}
            <input
              ref={fileRef}
              type="file"
              accept="image/*"
              onChange={uploadIcon}
              className="hidden"
            />
            <Button
              size="sm"
              variant="outline"
              onClick={() => fileRef.current?.click()}
              disabled={uploading}
              className="gap-1.5"
            >
              <Upload className="h-4 w-4" />
              {uploading ? "上传中..." : "上传图标"}
            </Button>
          </div>
          <Input
            value={iconUrl}
            onChange={(e) => setIconUrl(e.target.value)}
            placeholder="或直接粘贴链接"
          />
        </div>
      </Card>

      <Card className="p-4 space-y-3">
        <div className="flex items-center gap-2">
          <Palette className="h-4 w-4 text-primary" />
          <Label className="text-base">主题配色</Label>
        </div>
        <p className="text-xs text-muted-foreground">
          选择站点整体配色。点击即可实时预览，点底部"保存全部设置"后对所有访客生效
        </p>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
          {THEME_PRESET_ORDER.map((key) => {
            const p = THEME_PRESETS[key]
            const active = themePreset === key
            return (
              <button
                key={key}
                type="button"
                onClick={() => pickTheme(key)}
                className={`relative text-left rounded-lg border p-2.5 transition-all ${
                  active
                    ? "border-primary ring-2 ring-primary/30 shadow-sm"
                    : "border-border/70 hover:border-primary/40"
                }`}
              >
                <div
                  className="flex h-16 w-full overflow-hidden rounded-md ring-1 ring-border/50"
                  style={{ background: p.swatch.bg }}
                >
                  <div className="flex-1" style={{ background: p.swatch.card }} />
                  <div className="w-5" style={{ background: p.swatch.primary }} />
                  <div className="w-5" style={{ background: p.swatch.accent }} />
                </div>
                <div className="mt-2 flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <div className="text-sm font-serif-cn font-medium truncate">
                      {p.label}
                    </div>
                    <div className="text-[10px] text-muted-foreground line-clamp-2 leading-snug">
                      {p.description}
                    </div>
                  </div>
                  {active && (
                    <span className="shrink-0 flex h-5 w-5 items-center justify-center rounded-full bg-primary text-primary-foreground">
                      <Check className="h-3 w-3" />
                    </span>
                  )}
                </div>
              </button>
            )
          })}
        </div>
      </Card>

      <Card className="p-4 space-y-4">
        <div className="flex items-center gap-2">
          <Sparkles className="h-4 w-4 text-primary" />
          <Label className="text-base">首页横幅</Label>
        </div>

        <div className="flex items-center justify-between gap-3">
          <div>
            <Label>显示横幅</Label>
            <p className="text-xs text-muted-foreground mt-0.5">关闭后首页将不再显示顶部问候卡片</p>
          </div>
          <Switch checked={heroEnabled} onCheckedChange={setHeroEnabled} />
        </div>

        <div className="space-y-1.5">
          <Label>眉标（小字，一般为问候短句）</Label>
          <Input value={heroEyebrow} onChange={(e) => setHeroEyebrow(e.target.value)} />
        </div>
        <div className="space-y-1.5">
          <Label>主标题</Label>
          <Input value={heroTitle} onChange={(e) => setHeroTitle(e.target.value)} />
        </div>
        <div className="space-y-1.5">
          <Label>副标题</Label>
          <Input value={heroSubtitle} onChange={(e) => setHeroSubtitle(e.target.value)} />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1.5">
            <Label>尺寸</Label>
            <Select value={heroSize} onValueChange={(v) => setHeroSize(v as HeroSize)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="compact">紧凑</SelectItem>
                <SelectItem value="standard">标准</SelectItem>
                <SelectItem value="grand">大气</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label>纹样</Label>
            <Select value={heroPattern} onValueChange={(v) => setHeroPattern(v as HeroPattern)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="geometric">几何星纹</SelectItem>
                <SelectItem value="subtle">低调圆点</SelectItem>
                <SelectItem value="stars">八角星</SelectItem>
                <SelectItem value="none">无</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="space-y-2">
          <Label>配色变体</Label>
          <div className="grid grid-cols-3 gap-2">
            {HERO_VARIANTS.map((v) => {
              const active = heroVariant === v.key
              return (
                <button
                  key={v.key}
                  type="button"
                  onClick={() => setHeroVariant(v.key)}
                  className={`relative overflow-hidden h-20 rounded-md ring-1 transition-all ${
                    active ? "ring-2 ring-primary" : "ring-border/70 hover:ring-primary/50"
                  }`}
                >
                  <div className={`absolute inset-0 ${v.className}`} />
                  <GeometricPattern className="absolute inset-0 h-full w-full text-primary-foreground/20" />
                  <div className="relative flex h-full items-end justify-start p-2">
                    <span className="text-[11px] font-medium text-primary-foreground bg-foreground/25 backdrop-blur-sm rounded px-1.5 py-0.5">
                      {v.label}
                    </span>
                  </div>
                  {active && (
                    <span className="absolute top-1.5 right-1.5 flex h-5 w-5 items-center justify-center rounded-full bg-primary text-primary-foreground">
                      <Check className="h-3 w-3" />
                    </span>
                  )}
                </button>
              )
            })}
          </div>
        </div>

        <div className="flex items-center justify-between gap-3">
          <div>
            <Label>边角光晕</Label>
            <p className="text-xs text-muted-foreground mt-0.5">在横幅两侧添加柔和的光晕装饰</p>
          </div>
          <Switch checked={heroGlow} onCheckedChange={setHeroGlow} />
        </div>

        <div className="rounded-md border border-border/50 p-3 bg-muted/20">
          <div className="text-[11px] text-muted-foreground mb-2">实时预览</div>
          <HeroPreview
            eyebrow={heroEyebrow}
            title={heroTitle}
            subtitle={heroSubtitle}
            size={heroSize}
            variant={heroVariant}
            glow={heroGlow}
            pattern={heroPattern}
          />
        </div>
      </Card>

      <Card className="p-4 space-y-4">
        <div className="flex items-center gap-2">
          <ShieldCheck className="h-4 w-4 text-primary" />
          <Label className="text-base">站点策略</Label>
        </div>

        <div className="flex items-center justify-between gap-3">
          <div>
            <Label>开放新用户注册</Label>
            <p className="text-xs text-muted-foreground mt-0.5">关闭后，注册页将显示"注册已关闭"</p>
          </div>
          <Switch checked={registrationOpen} onCheckedChange={setRegistrationOpen} />
        </div>

        <div className="flex items-center justify-between gap-3">
          <div>
            <Label>允许用户发布视频</Label>
            <p className="text-xs text-muted-foreground mt-0.5">
              关闭后普通用户无法发视频，仅单独授权的用户可发
            </p>
          </div>
          <Switch checked={allowVideo} onCheckedChange={setAllowVideo} />
        </div>
      </Card>

      <Card className="p-4 space-y-4">
        <div className="flex items-center gap-2">
          <Link2 className="h-4 w-4 text-primary" />
          <Label className="text-base">页脚与备案</Label>
        </div>

        <div className="space-y-1.5">
          <Label>页脚文字</Label>
          <Textarea
            value={footerText}
            onChange={(e) => setFooterText(e.target.value)}
            placeholder={"例如：静园 · 以清语会友，以经训润心。支持换行。"}
            rows={3}
          />
        </div>

        <div className="space-y-1.5">
          <Label>ICP / 备案号</Label>
          <Input
            value={icpText}
            onChange={(e) => setIcpText(e.target.value)}
            placeholder="京 ICP 备 0000000 号"
          />
        </div>
      </Card>

      {settings && (
        <p className="text-xs text-muted-foreground px-1">
          上次更新：{new Date(settings.updated_at).toLocaleString("zh-CN")}
        </p>
      )}

      <div className="pt-2">
        <Button onClick={save} disabled={saving} size="lg" className="w-full">
          {saving ? "保存中..." : "保存全部设置"}
        </Button>
        <p className="mt-2 text-center text-[11px] text-muted-foreground">
          修改主题会实时预览，点击上方按钮后才对所有访客生效
        </p>
      </div>
    </div>
  )
}

function HeroPreview({
  eyebrow,
  title,
  subtitle,
  size,
  variant,
  glow,
  pattern,
}: {
  eyebrow: string
  title: string
  subtitle: string
  size: HeroSize
  variant: HeroVariant
  glow: boolean
  pattern: HeroPattern
}) {
  const variantClass =
    HERO_VARIANTS.find((v) => v.key === variant)?.className ??
    HERO_VARIANTS[0].className
  const pad =
    size === "compact" ? "px-4 py-3" : size === "grand" ? "px-5 py-5" : "px-4 py-4"
  return (
    <section className="relative overflow-hidden rounded-xl ring-1 ring-border/40">
      <div className={`absolute inset-0 ${variantClass}`} />
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
          <EightPointStar size={36} className="absolute -right-3 top-1" />
          <EightPointStar size={22} className="absolute right-14 bottom-1" />
        </div>
      )}
      {glow && (
        <>
          <div className="absolute -right-6 -top-6 h-20 w-20 rounded-full bg-primary-foreground/20 blur-2xl" />
          <div className="absolute -left-6 bottom-0 h-16 w-16 rounded-full bg-accent/30 blur-2xl" />
        </>
      )}
      <div className={`relative flex items-center gap-3 ${pad}`}>
        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary-foreground/15 backdrop-blur-sm ring-1 ring-primary-foreground/25 text-primary-foreground">
          <EightPointStar size={22} />
        </span>
        <div className="min-w-0 flex-1 text-primary-foreground">
          {eyebrow && (
            <div className="text-[10px] uppercase tracking-[0.22em] opacity-80 truncate">
              {eyebrow}
            </div>
          )}
          <div
            className={`font-serif-cn font-semibold leading-tight truncate ${
              size === "grand" ? "text-lg" : "text-base"
            }`}
          >
            {title || "主标题"}
          </div>
          {subtitle && (
            <div className="text-[10px] opacity-85 truncate">{subtitle}</div>
          )}
        </div>
      </div>
    </section>
  )
}
