import { useEffect, useRef, useState } from "react"
import { supabase } from "@/lib/supabase"
import type { SiteSettings, HeroSize, HeroVariant, HeroPattern, ThemePresetKey } from "@/lib/database.types"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { toast } from "sonner"
import { Upload, Check, Palette, Sparkles, FileSignature, ShieldCheck, Link as LinkIcon } from "lucide-react"
import { THEME_PRESETS, THEME_PRESET_ORDER, applyThemePreset } from "@/lib/theme-presets"

const DEFAULTS: Omit<SiteSettings, "id" | "updated_at"> = {
  site_name: "静园",
  site_icon_url: "",
  allow_video_posts: false,
  theme_preset: "jade-garden",
  hero_enabled: true,
  hero_eyebrow: "AS-SALĀMU ‘ALAYKUM",
  hero_title: "愿平安与宁静与你同在",
  hero_subtitle: "在静园，以经训润心，以清语会友",
  hero_size: "standard",
  hero_variant: "auto",
  hero_glow: true,
  hero_pattern: "geometric",
  footer_text: "",
  registration_open: true,
  icp_text: "",
}

const VARIANT_PREVIEW: Record<HeroVariant, { label: string; className: string }> = {
  auto: { label: "自动（跟随主题）", className: "bg-gradient-to-br from-primary via-[color-mix(in_oklab,var(--primary)_55%,var(--accent))] to-accent" },
  jade: { label: "翡翠", className: "bg-gradient-to-br from-[oklch(0.5_0.1_165)] via-[oklch(0.45_0.09_170)] to-[oklch(0.6_0.12_160)]" },
  amber: { label: "琥珀", className: "bg-gradient-to-br from-[oklch(0.55_0.14_60)] via-[oklch(0.6_0.15_55)] to-[oklch(0.72_0.14_70)]" },
  teal: { label: "湖青", className: "bg-gradient-to-br from-[oklch(0.5_0.1_200)] via-[oklch(0.55_0.11_210)] to-[oklch(0.65_0.1_190)]" },
  sunset: { label: "夕照", className: "bg-gradient-to-br from-[oklch(0.5_0.14_28)] via-[oklch(0.6_0.15_50)] to-[oklch(0.72_0.14_70)]" },
  mono: { label: "素雅", className: "bg-gradient-to-br from-[oklch(0.28_0.01_90)] via-[oklch(0.32_0.01_90)] to-[oklch(0.42_0.01_90)]" },
}

export function SiteSettingsPanel() {
  const fileRef = useRef<HTMLInputElement>(null)
  const [initialTheme, setInitialTheme] = useState<ThemePresetKey>("jade-garden")
  const [form, setForm] = useState<Omit<SiteSettings, "id" | "updated_at">>(DEFAULTS)
  const [uploading, setUploading] = useState(false)
  const [saving, setSaving] = useState(false)

  const update = <K extends keyof typeof form>(key: K, value: (typeof form)[K]) =>
    setForm((f) => ({ ...f, [key]: value }))

  useEffect(() => {
    load()
  }, [])

  async function load() {
    const { data } = await supabase.from("site_settings").select("*").eq("id", 1).maybeSingle()
    if (data) {
      const merged = { ...DEFAULTS, ...(data as Partial<SiteSettings>) }
      setForm({
        site_name: merged.site_name,
        site_icon_url: merged.site_icon_url,
        allow_video_posts: merged.allow_video_posts,
        theme_preset: merged.theme_preset,
        hero_enabled: merged.hero_enabled,
        hero_eyebrow: merged.hero_eyebrow,
        hero_title: merged.hero_title,
        hero_subtitle: merged.hero_subtitle,
        hero_size: merged.hero_size,
        hero_variant: merged.hero_variant,
        hero_glow: merged.hero_glow,
        hero_pattern: merged.hero_pattern,
        footer_text: merged.footer_text,
        registration_open: merged.registration_open,
        icp_text: merged.icp_text,
      })
      setInitialTheme(merged.theme_preset)
    }
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
    update("site_icon_url", pub.publicUrl)
    setUploading(false)
    toast.success("图标已上传，记得点保存")
  }

  function pickTheme(k: ThemePresetKey) {
    update("theme_preset", k)
    applyThemePreset(k)
  }

  async function save() {
    setSaving(true)
    const { error } = await supabase
      .from("site_settings")
      .update({
        ...form,
        updated_at: new Date().toISOString(),
      })
      .eq("id", 1)
    setSaving(false)
    if (error) {
      toast.error("保存失败：" + error.message)
      applyThemePreset(initialTheme)
      return
    }
    setInitialTheme(form.theme_preset)
    window.dispatchEvent(new Event("site-settings-updated"))
    toast.success("已保存")
  }

  return (
    <div className="space-y-4 pb-24">
      {/* 基础信息 */}
      <Card className="p-4 space-y-4">
        <div className="flex items-center gap-2">
          <FileSignature className="h-4 w-4 text-primary" />
          <h3 className="font-serif-cn font-semibold">基础信息</h3>
        </div>
        <div className="space-y-2">
          <Label>网站名称</Label>
          <Input
            value={form.site_name}
            onChange={(e) => update("site_name", e.target.value)}
            placeholder="静园"
          />
        </div>
        <div className="space-y-2">
          <Label>网站图标</Label>
          <div className="flex items-center gap-3">
            {form.site_icon_url ? (
              <img src={form.site_icon_url} alt="" className="h-12 w-12 rounded-lg border object-cover" />
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
            value={form.site_icon_url}
            onChange={(e) => update("site_icon_url", e.target.value)}
            placeholder="或直接粘贴链接"
          />
        </div>
      </Card>

      {/* 主题配色 */}
      <Card className="p-4 space-y-4">
        <div className="flex items-center gap-2">
          <Palette className="h-4 w-4 text-primary" />
          <h3 className="font-serif-cn font-semibold">主题配色</h3>
          <span className="text-[11px] text-muted-foreground ml-auto">点击即可实时预览</span>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
          {THEME_PRESET_ORDER.map((k) => {
            const p = THEME_PRESETS[k]
            const active = form.theme_preset === k
            return (
              <button
                key={k}
                type="button"
                onClick={() => pickTheme(k)}
                className={
                  "group relative rounded-xl border-2 text-left overflow-hidden transition-all " +
                  (active ? "border-primary shadow-md" : "border-border/60 hover:border-primary/40")
                }
              >
                <div
                  className="h-10 w-full"
                  style={{
                    background: `linear-gradient(135deg, ${p.swatch.primary} 0%, ${p.swatch.accent} 100%)`,
                  }}
                />
                <div className="flex items-center gap-1.5 p-2 bg-card">
                  <span
                    className="h-3 w-3 rounded-full ring-1 ring-border/60"
                    style={{ background: p.swatch.bg }}
                  />
                  <span
                    className="h-3 w-3 rounded-full ring-1 ring-border/60"
                    style={{ background: p.swatch.card }}
                  />
                  <span
                    className="h-3 w-3 rounded-full ring-1 ring-border/60"
                    style={{ background: p.swatch.primary }}
                  />
                  <span
                    className="h-3 w-3 rounded-full ring-1 ring-border/60"
                    style={{ background: p.swatch.accent }}
                  />
                </div>
                <div className="p-2 pt-0 bg-card">
                  <div className="text-xs font-semibold font-serif-cn">{p.label}</div>
                  <div className="text-[10px] text-muted-foreground line-clamp-2 mt-0.5">
                    {p.description}
                  </div>
                </div>
                {active && (
                  <div className="absolute top-1.5 right-1.5 h-5 w-5 rounded-full bg-primary text-primary-foreground flex items-center justify-center shadow">
                    <Check className="h-3 w-3" />
                  </div>
                )}
              </button>
            )
          })}
        </div>
      </Card>

      {/* 首页横幅 */}
      <Card className="p-4 space-y-4">
        <div className="flex items-center gap-2">
          <Sparkles className="h-4 w-4 text-primary" />
          <h3 className="font-serif-cn font-semibold">首页横幅</h3>
        </div>

        <div className="flex items-center justify-between">
          <div>
            <Label>显示横幅</Label>
            <p className="text-xs text-muted-foreground mt-0.5">关闭后首页将不再显示顶部问候卡片</p>
          </div>
          <Switch
            checked={form.hero_enabled}
            onCheckedChange={(v) => update("hero_enabled", v)}
          />
        </div>

        <div className="grid gap-3">
          <div className="space-y-1.5">
            <Label>眉标（小字，一般为问候短句）</Label>
            <Input
              value={form.hero_eyebrow}
              onChange={(e) => update("hero_eyebrow", e.target.value)}
              placeholder="AS-SALĀMU ‘ALAYKUM"
            />
          </div>
          <div className="space-y-1.5">
            <Label>主标题</Label>
            <Input
              value={form.hero_title}
              onChange={(e) => update("hero_title", e.target.value)}
              placeholder="愿平安与宁静与你同在"
            />
          </div>
          <div className="space-y-1.5">
            <Label>副标题</Label>
            <Input
              value={form.hero_subtitle}
              onChange={(e) => update("hero_subtitle", e.target.value)}
              placeholder="在静园，以经训润心，以清语会友"
            />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1.5">
            <Label>尺寸</Label>
            <Select
              value={form.hero_size}
              onValueChange={(v) => update("hero_size", v as HeroSize)}
            >
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="compact">紧凑</SelectItem>
                <SelectItem value="standard">标准</SelectItem>
                <SelectItem value="tall">高挑</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label>纹样</Label>
            <Select
              value={form.hero_pattern}
              onValueChange={(v) => update("hero_pattern", v as HeroPattern)}
            >
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="geometric">几何</SelectItem>
                <SelectItem value="subtle">低调圆点</SelectItem>
                <SelectItem value="none">无</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="space-y-2">
          <Label>配色变体</Label>
          <div className="grid grid-cols-3 gap-2">
            {(Object.keys(VARIANT_PREVIEW) as HeroVariant[]).map((v) => {
              const active = form.hero_variant === v
              return (
                <button
                  key={v}
                  type="button"
                  onClick={() => update("hero_variant", v)}
                  className={
                    "relative h-16 rounded-lg overflow-hidden border-2 transition-all " +
                    (active ? "border-primary shadow" : "border-border/60 hover:border-primary/40")
                  }
                >
                  <div className={"absolute inset-0 " + VARIANT_PREVIEW[v].className} />
                  <div className="absolute bottom-1 left-1.5 right-1.5 text-[10px] font-medium text-white drop-shadow">
                    {VARIANT_PREVIEW[v].label}
                  </div>
                  {active && (
                    <div className="absolute top-1 right-1 h-4 w-4 rounded-full bg-primary text-primary-foreground flex items-center justify-center shadow">
                      <Check className="h-2.5 w-2.5" />
                    </div>
                  )}
                </button>
              )
            })}
          </div>
        </div>

        <div className="flex items-center justify-between pt-1">
          <div>
            <Label>边角光晕</Label>
            <p className="text-xs text-muted-foreground mt-0.5">在横幅两侧添加柔和的光晕装饰</p>
          </div>
          <Switch
            checked={form.hero_glow}
            onCheckedChange={(v) => update("hero_glow", v)}
          />
        </div>
      </Card>

      {/* 站点策略 */}
      <Card className="p-4 space-y-4">
        <div className="flex items-center gap-2">
          <ShieldCheck className="h-4 w-4 text-primary" />
          <h3 className="font-serif-cn font-semibold">站点策略</h3>
        </div>

        <div className="flex items-center justify-between">
          <div>
            <Label>开放新用户注册</Label>
            <p className="text-xs text-muted-foreground mt-0.5">关闭后，注册页将显示"注册已关闭"</p>
          </div>
          <Switch
            checked={form.registration_open}
            onCheckedChange={(v) => update("registration_open", v)}
          />
        </div>

        <div className="flex items-center justify-between pt-1 border-t border-border/60">
          <div>
            <Label>允许用户发布视频</Label>
            <p className="text-xs text-muted-foreground mt-0.5">关闭后普通用户无法发视频，仅单独授权的用户可发</p>
          </div>
          <Switch
            checked={form.allow_video_posts}
            onCheckedChange={(v) => update("allow_video_posts", v)}
          />
        </div>
      </Card>

      {/* 页脚与备案 */}
      <Card className="p-4 space-y-4">
        <div className="flex items-center gap-2">
          <LinkIcon className="h-4 w-4 text-primary" />
          <h3 className="font-serif-cn font-semibold">页脚与备案</h3>
        </div>
        <div className="space-y-1.5">
          <Label>页脚文字</Label>
          <Textarea
            rows={3}
            value={form.footer_text}
            onChange={(e) => update("footer_text", e.target.value)}
            placeholder="例如：静园 · 以清语会友，以经训润心。支持换行。"
          />
        </div>
        <div className="space-y-1.5">
          <Label>ICP / 备案号</Label>
          <Input
            value={form.icp_text}
            onChange={(e) => update("icp_text", e.target.value)}
            placeholder="京 ICP 备 0000000 号"
          />
        </div>
      </Card>

      {/* 保存 */}
      <div className="fixed bottom-0 left-0 right-0 z-20 border-t border-border/60 bg-background/90 backdrop-blur-md">
        <div className="mx-auto w-full max-w-3xl px-4 py-3">
          <Button onClick={save} disabled={saving} className="w-full">
            {saving ? "保存中..." : "保存全部设置"}
          </Button>
        </div>
      </div>
    </div>
  )
}
