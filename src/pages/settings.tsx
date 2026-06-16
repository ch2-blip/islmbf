import { useEffect, useRef, useState } from "react"
import { useNavigate } from "react-router-dom"
import { useAuth } from "@/contexts/auth-context"
import { supabase } from "@/lib/supabase"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Card } from "@/components/ui/card"
import { toast } from "sonner"
import { ArrowLeft, Upload } from "lucide-react"
import { UserAvatar } from "@/components/user-avatar"

export function SettingsPage() {
  const { user, profile, refreshProfile } = useAuth()
  const nav = useNavigate()
  const fileRef = useRef<HTMLInputElement>(null)
  const [username, setUsername] = useState("")
  const [bio, setBio] = useState("")
  const [avatarUrl, setAvatarUrl] = useState("")
  const [phone, setPhone] = useState("")
  const [uploading, setUploading] = useState(false)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    if (!user) {
      nav("/login")
      return
    }
    if (profile) {
      setUsername(profile.username)
      setBio(profile.bio)
      setAvatarUrl(profile.avatar_url)
      setPhone(profile.phone ?? "")
    }
  }, [user, profile, nav])

  async function uploadAvatar(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file || !user) return
    if (file.size > 10 * 1024 * 1024) {
      toast.error("图片不能超过 10MB")
      return
    }
    setUploading(true)
    const ext = file.name.split(".").pop() || "png"
    const path = `${user.id}/${Date.now()}.${ext}`
    const { error: upErr } = await supabase.storage
      .from("avatars")
      .upload(path, file, { cacheControl: "3600", upsert: true })
    if (upErr) {
      setUploading(false)
      toast.error("上传失败：" + upErr.message)
      return
    }
    const { data: pub } = supabase.storage.from("avatars").getPublicUrl(path)
    setAvatarUrl(pub.publicUrl)
    setUploading(false)
    toast.success("头像已上传，记得点保存")
  }

  async function save() {
    if (!user) return
    if (phone && !/^\+?\d[\d\s-]{5,19}$/.test(phone.trim())) {
      toast.error("手机号格式不正确")
      return
    }
    setSaving(true)
    const { error } = await supabase
      .from("profiles")
      .update({ username, bio, avatar_url: avatarUrl, phone: phone.trim() })
      .eq("id", user.id)
    setSaving(false)
    if (error) {
      toast.error("保存失败：" + error.message)
      return
    }
    await refreshProfile()
    toast.success("已保存")
  }

  return (
    <div className="px-4 pt-4 pb-8 space-y-4">
      <button
        onClick={() => nav(-1)}
        className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="h-4 w-4" /> 返回
      </button>

      <h1 className="text-xl font-serif-cn font-semibold">账号设置</h1>

      <Card className="p-5 space-y-5">
        <div className="space-y-2">
          <Label>头像</Label>
          <div className="flex items-center gap-4">
            <UserAvatar
              profile={{
                username,
                avatar_url: avatarUrl,
                avatar_shape: profile?.avatar_shape ?? "circle",
                halo_style: profile?.halo_style ?? "none",
              }}
              size="lg"
            />
            <div className="flex-1">
              <input
                ref={fileRef}
                type="file"
                accept="image/*"
                onChange={uploadAvatar}
                className="hidden"
              />
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => fileRef.current?.click()}
                disabled={uploading}
                className="gap-1.5"
              >
                <Upload className="h-4 w-4" />
                {uploading ? "上传中..." : "上传头像"}
              </Button>
              <p className="text-xs text-muted-foreground mt-1.5">支持 JPG / PNG，最大 10MB</p>
            </div>
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="username">昵称</Label>
          <Input id="username" value={username} onChange={(e) => setUsername(e.target.value)} />
        </div>

        <div className="space-y-2">
          <Label htmlFor="phone">绑定手机号（可选）</Label>
          <Input
            id="phone"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            placeholder="如 +86 138 0000 0000"
            inputMode="tel"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="bio">个人简介</Label>
          <Textarea id="bio" value={bio} onChange={(e) => setBio(e.target.value)} rows={3} maxLength={200} />
        </div>
      </Card>

      <Button className="w-full" onClick={save} disabled={saving}>
        {saving ? "保存中..." : "保存"}
      </Button>
    </div>
  )
}
