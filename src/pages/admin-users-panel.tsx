import { useEffect, useState } from "react"
import { supabase } from "@/lib/supabase"
import type { Profile, UserPermissions, AvatarShape, HaloStyle } from "@/lib/database.types"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Switch } from "@/components/ui/switch"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { ChevronDown, ChevronUp } from "lucide-react"
import { toast } from "sonner"
import { UserAvatar } from "@/components/user-avatar"
import { cn } from "@/lib/utils"

const SHAPES: { value: AvatarShape; label: string }[] = [
  { value: "circle", label: "圆形" },
  { value: "square", label: "方形" },
  { value: "rounded", label: "圆角" },
]

const HALOS: { value: HaloStyle; label: string; sample: string }[] = [
  { value: "none", label: "关闭", sample: "" },
  { value: "gold", label: "金色光芒", sample: "bg-amber-300" },
  { value: "emerald", label: "翠绿光芒", sample: "bg-emerald-400" },
  { value: "rose", label: "玫瑰光芒", sample: "bg-rose-400" },
  { value: "sky", label: "天蓝光芒", sample: "bg-sky-400" },
]

const PERMISSION_KEYS: { key: keyof UserPermissions; label: string }[] = [
  { key: "can_manage_reports", label: "处理举报" },
  { key: "can_manage_content", label: "管理内容" },
  { key: "can_manage_users", label: "管理用户" },
  { key: "can_manage_announcements", label: "发布公告" },
  { key: "can_manage_sensitive", label: "管理敏感词" },
  { key: "can_manage_taxonomy", label: "管理板块分类" },
]

export function UsersPanelFull() {
  const [users, setUsers] = useState<Profile[]>([])
  const [perms, setPerms] = useState<Record<string, UserPermissions>>({})
  const [q, setQ] = useState("")
  const [expanded, setExpanded] = useState<string | null>(null)

  async function load() {
    const query = supabase
      .from("profiles")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(100)
    const { data } = q ? await query.ilike("username", `%${q}%`) : await query
    const list = data ?? []
    setUsers(list)
    const ids = list.filter((u) => u.role === "moderator" || u.role === "admin").map((u) => u.id)
    if (ids.length > 0) {
      const { data: permRows } = await supabase
        .from("user_permissions")
        .select("*")
        .in("user_id", ids)
      const map: Record<string, UserPermissions> = {}
      for (const row of permRows ?? []) map[row.user_id] = row as UserPermissions
      setPerms(map)
    } else {
      setPerms({})
    }
  }

  useEffect(() => {
    load()
  }, [q])

  async function setRole(id: string, role: Profile["role"]) {
    await supabase.from("profiles").update({ role }).eq("id", id)
    if (role === "moderator") {
      await supabase
        .from("user_permissions")
        .upsert({ user_id: id }, { onConflict: "user_id" })
    }
    toast.success("已更新")
    load()
  }

  async function toggleBan(id: string, current: boolean) {
    await supabase.from("profiles").update({ is_banned: !current }).eq("id", id)
    toast.success(!current ? "已封禁" : "已解封")
    load()
  }

  async function toggleScholar(id: string, current: boolean) {
    await supabase.from("profiles").update({ is_verified_scholar: !current }).eq("id", id)
    load()
  }

  async function toggleVideo(id: string, current: boolean) {
    await supabase.from("profiles").update({ can_post_video: !current }).eq("id", id)
    toast.success(!current ? "已开通视频权限" : "已关闭视频权限")
    load()
  }

  async function updateProfile(id: string, patch: Partial<Profile>) {
    await supabase.from("profiles").update(patch).eq("id", id)
    load()
  }

  async function updatePermission(userId: string, key: keyof UserPermissions, value: boolean) {
    const existing = perms[userId]
    if (existing) {
      await supabase.from("user_permissions").update({ [key]: value }).eq("user_id", userId)
    } else {
      await supabase
        .from("user_permissions")
        .insert({ user_id: userId, [key]: value })
    }
    load()
  }

  return (
    <div className="space-y-3">
      <Input placeholder="搜索用户名..." value={q} onChange={(e) => setQ(e.target.value)} />
      <Card className="divide-y divide-border/60">
        {users.map((u) => {
          const isOpen = expanded === u.id
          const up = perms[u.id]
          const isPrivileged = u.role === "moderator" || u.role === "admin"
          return (
            <div key={u.id} className="p-4 space-y-2">
              <div className="flex items-start gap-3">
                <UserAvatar profile={u} size="md" />
                <div className="flex-1 min-w-0 space-y-1.5">
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <span className="font-medium text-sm">{u.username}</span>
                    <Badge variant="outline" className="text-[10px]">{u.role}</Badge>
                    {u.is_banned && <Badge variant="destructive" className="text-[10px]">已封禁</Badge>}
                    {u.can_post_video && <Badge className="text-[10px] bg-accent text-accent-foreground">可发视频</Badge>}
                    {u.is_verified_scholar && <Badge className="text-[10px] bg-accent text-accent-foreground">学者</Badge>}
                  </div>
                  <div className="flex gap-1 flex-wrap">
                    <Select value={u.role} onValueChange={(v) => setRole(u.id, v as Profile["role"])}>
                      <SelectTrigger className="h-7 w-24 text-xs"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="user">用户</SelectItem>
                        <SelectItem value="scholar">学者</SelectItem>
                        <SelectItem value="moderator">版主</SelectItem>
                        <SelectItem value="admin">管理员</SelectItem>
                      </SelectContent>
                    </Select>
                    <Button size="sm" variant="outline" className="h-7 text-xs" onClick={() => toggleScholar(u.id, u.is_verified_scholar)}>
                      {u.is_verified_scholar ? "取消学者" : "认证学者"}
                    </Button>
                    <Button size="sm" variant="outline" className="h-7 text-xs" onClick={() => toggleBan(u.id, u.is_banned)}>
                      {u.is_banned ? "解封" : "封禁"}
                    </Button>
                    <Button size="sm" variant="outline" className="h-7 text-xs" onClick={() => toggleVideo(u.id, u.can_post_video)}>
                      {u.can_post_video ? "关闭视频" : "开通视频"}
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      className="h-7 text-xs gap-1"
                      onClick={() => setExpanded(isOpen ? null : u.id)}
                    >
                      更多
                      {isOpen ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
                    </Button>
                  </div>
                </div>
              </div>

              {isOpen && (
                <div className="ml-0 sm:ml-13 space-y-3 pt-2 border-t border-border/60">
                  <div className="space-y-2">
                    <Label className="text-xs">徽章文字</Label>
                    <Input
                      value={u.badge_text}
                      onChange={(e) =>
                        setUsers((prev) => prev.map((x) => (x.id === u.id ? { ...x, badge_text: e.target.value } : x)))
                      }
                      onBlur={(e) => updateProfile(u.id, { badge_text: e.target.value })}
                      placeholder="留空则显示角色名"
                      className="h-8 text-xs"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label className="text-xs">头像形状</Label>
                    <div className="flex gap-1.5 flex-wrap">
                      {SHAPES.map((s) => (
                        <Button
                          key={s.value}
                          size="sm"
                          variant={u.avatar_shape === s.value ? "default" : "outline"}
                          className="h-7 text-xs"
                          onClick={() => updateProfile(u.id, { avatar_shape: s.value })}
                        >
                          {s.label}
                        </Button>
                      ))}
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label className="text-xs">头像光芒</Label>
                    <div className="flex gap-1.5 flex-wrap">
                      {HALOS.map((h) => (
                        <Button
                          key={h.value}
                          size="sm"
                          variant={u.halo_style === h.value ? "default" : "outline"}
                          className="h-7 text-xs gap-1.5"
                          onClick={() => updateProfile(u.id, { halo_style: h.value })}
                        >
                          {h.sample && <span className={cn("inline-block h-2 w-2 rounded-full", h.sample)} />}
                          {h.label}
                        </Button>
                      ))}
                    </div>
                  </div>

                  {isPrivileged && (
                    <div className="space-y-2 pt-2 border-t border-border/60">
                      <Label className="text-xs">二级管理员权限</Label>
                      <p className="text-[11px] text-muted-foreground">为版主授予各项管理权限。管理员（admin）拥有全部权限。</p>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                        {PERMISSION_KEYS.map((p) => (
                          <div
                            key={p.key}
                            className="flex items-center justify-between rounded-md border border-border/60 px-3 py-2"
                          >
                            <span className="text-xs">{p.label}</span>
                            <Switch
                              checked={u.role === "admin" || !!(up && up[p.key])}
                              disabled={u.role === "admin"}
                              onCheckedChange={(v) => updatePermission(u.id, p.key, v)}
                            />
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          )
        })}
      </Card>
    </div>
  )
}
