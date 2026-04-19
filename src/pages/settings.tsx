import { useEffect, useState } from "react"
import { useNavigate } from "react-router-dom"
import { useAuth } from "@/contexts/auth-context"
import { supabase } from "@/lib/supabase"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Card } from "@/components/ui/card"
import { toast } from "sonner"
import { ArrowLeft } from "lucide-react"

const CITIES = ["Beijing", "Shanghai", "Guangzhou", "Urumqi", "Yinchuan", "Xining", "Lanzhou", "Kunming"]

export function SettingsPage() {
  const { user, profile, refreshProfile } = useAuth()
  const nav = useNavigate()
  const [username, setUsername] = useState("")
  const [bio, setBio] = useState("")
  const [avatarUrl, setAvatarUrl] = useState("")
  const [city, setCity] = useState("Beijing")
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
    }
    setCity(localStorage.getItem("prayer-city") ?? "Beijing")
  }, [user, profile, nav])

  async function save() {
    if (!user) return
    setSaving(true)
    const { error } = await supabase
      .from("profiles")
      .update({ username, bio, avatar_url: avatarUrl })
      .eq("id", user.id)
    localStorage.setItem("prayer-city", city)
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

      <Card className="p-5 space-y-4">
        <div className="space-y-2">
          <Label htmlFor="username">昵称</Label>
          <Input id="username" value={username} onChange={(e) => setUsername(e.target.value)} />
        </div>
        <div className="space-y-2">
          <Label htmlFor="avatar">头像链接</Label>
          <Input
            id="avatar"
            value={avatarUrl}
            onChange={(e) => setAvatarUrl(e.target.value)}
            placeholder="https://..."
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="bio">个人简介</Label>
          <Textarea id="bio" value={bio} onChange={(e) => setBio(e.target.value)} rows={3} maxLength={200} />
        </div>
      </Card>

      <Card className="p-5 space-y-4">
        <h2 className="font-serif-cn font-semibold">礼拜时间 · 所在城市</h2>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
          {CITIES.map((c) => (
            <Button
              key={c}
              type="button"
              variant={city === c ? "default" : "outline"}
              size="sm"
              onClick={() => setCity(c)}
            >
              {c}
            </Button>
          ))}
        </div>
      </Card>

      <Button className="w-full" onClick={save} disabled={saving}>
        {saving ? "保存中..." : "保存"}
      </Button>
    </div>
  )
}
