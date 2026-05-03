import { useEffect, useRef, useState } from "react"
import { supabase } from "@/lib/supabase"
import type { SiteSettings, ThemePresetKey } from "@/lib/database.types"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { toast } from "sonner"
import { Check, Upload } from "lucide-react"
import {
  THEME_PRESETS,
  THEME_PRESET_ORDER,
  applyThemePreset,
} from "@/lib/theme-presets"

export function SiteSettingsPanel() {
  const fileRef = useRef<HTMLInputElement>(null)
  const [settings, setSettings] = useState<SiteSettings | null>(null)
  const [name, setName] = useState("")
  const [iconUrl, setIconUrl] = useState("")
  const [allowVideo, setAllowVideo] = useState(false)
  const [themePreset, setThemePreset] = useState<ThemePresetKey>("warm-sand")
  const [uploading, setUploading] = useState(false)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    load()
  }, [])

  async function load() {
    const { data } = await supabase.from("site_settings").select("*").eq("id", 1).maybeSingle()
    if (data) {
      setSettings(data)
      setName(data.site_name)
      setIconUrl(data.site_icon_url)
      setAllowVideo(data.allow_video_posts)
      if (data.theme_preset && data.theme_preset in THEME_PRESETS) {
        setThemePreset(data.theme_preset as ThemePresetKey)
      }
    }
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
    <div className="space-y-3">
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

        <div className="flex items-center justify-between pt-2 border-t border-border/60">
          <div>
            <Label>允许用户发布视频</Label>
            <p className="text-xs text-muted-foreground mt-0.5">关闭后普通用户无法发视频，仅单独授权的用户可发</p>
          </div>
          <Switch checked={allowVideo} onCheckedChange={setAllowVideo} />
        </div>

        <Button onClick={save} disabled={saving} className="w-full">
          {saving ? "保存中..." : "保存设置"}
        </Button>
      </Card>

      <Card className="p-4 space-y-3">
        <div>
          <Label className="text-base">主题配色</Label>
          <p className="text-xs text-muted-foreground mt-0.5">
            选择站点整体配色。点击即可实时预览，点上方"保存设置"后对所有访客生效
          </p>
        </div>
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

      {settings && (
        <p className="text-xs text-muted-foreground">
          上次更新：{new Date(settings.updated_at).toLocaleString("zh-CN")}
        </p>
      )}
    </div>
  )
}
