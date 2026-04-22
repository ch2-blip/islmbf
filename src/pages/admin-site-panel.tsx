import { useEffect, useRef, useState } from "react"
import { supabase } from "@/lib/supabase"
import type { SiteSettings } from "@/lib/database.types"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { toast } from "sonner"
import { Upload } from "lucide-react"

export function SiteSettingsPanel() {
  const fileRef = useRef<HTMLInputElement>(null)
  const [settings, setSettings] = useState<SiteSettings | null>(null)
  const [name, setName] = useState("")
  const [iconUrl, setIconUrl] = useState("")
  const [allowVideo, setAllowVideo] = useState(false)
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

        <Button onClick={save} disabled={saving}>
          {saving ? "保存中..." : "保存设置"}
        </Button>
      </Card>

      {settings && (
        <p className="text-xs text-muted-foreground">
          上次更新：{new Date(settings.updated_at).toLocaleString("zh-CN")}
        </p>
      )}
    </div>
  )
}
