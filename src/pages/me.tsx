import { Link, useNavigate } from "react-router-dom"
import { useAuth } from "@/contexts/auth-context"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import {
  User,
  Bookmark,
  Bell,
  Settings,
  Shield,
  LogOut,
  ChevronRight,
  FileText,
  Heart,
} from "lucide-react"
import { HijriDate } from "@/components/hijri-date"

export function MePage() {
  const { profile, user, isAdmin, isModerator, signOut } = useAuth()
  const nav = useNavigate()

  if (!user || !profile) {
    return (
      <div className="px-4 pt-12 text-center space-y-4">
        <p className="text-muted-foreground">您尚未登录</p>
        <div className="flex justify-center gap-2">
          <Button onClick={() => nav("/login")}>登录</Button>
          <Button variant="outline" onClick={() => nav("/register")}>注册</Button>
        </div>
      </div>
    )
  }

  const items = [
    { label: "个人主页", icon: User, to: `/user/${profile.username}` },
    { label: "我发布的文章", icon: FileText, to: `/me/articles` },
    { label: "我的收藏", icon: Bookmark, to: "/me/bookmarks" },
    { label: "我的点赞", icon: Heart, to: "/me/likes" },
    { label: "消息通知", icon: Bell, to: "/notifications" },
    { label: "账号设置", icon: Settings, to: "/settings" },
  ]

  if (isModerator) {
    items.push({ label: "版主 · 举报处理", icon: Shield, to: "/admin/reports" })
  }
  if (isAdmin) {
    items.push({ label: "管理员后台", icon: Shield, to: "/admin" })
  }

  return (
    <div className="px-4 pt-4 pb-8 space-y-4">
      <Card className="p-5">
        <div className="flex items-center gap-3 mb-3">
          <Avatar className="h-14 w-14 border-2 border-background ring-2 ring-primary/20">
            <AvatarImage src={profile.avatar_url} />
            <AvatarFallback className="bg-primary/10 text-primary font-semibold">
              {profile.username.slice(0, 2).toUpperCase()}
            </AvatarFallback>
          </Avatar>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-1.5">
              <h1 className="text-lg font-semibold truncate">{profile.username}</h1>
              {profile.role === "admin" && (
                <span className="text-[10px] px-1.5 py-0.5 rounded bg-primary/10 text-primary">管理员</span>
              )}
            </div>
            <p className="text-xs text-muted-foreground truncate mt-0.5">{user.email}</p>
          </div>
        </div>
        <HijriDate />
      </Card>

      <Card className="overflow-hidden divide-y divide-border/60">
        {items.map((item) => {
          const Icon = item.icon
          return (
            <Link
              key={item.to}
              to={item.to}
              className="flex items-center gap-3 p-4 hover:bg-muted/50 transition-colors"
            >
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-muted text-foreground/70">
                <Icon className="h-4 w-4" />
              </div>
              <span className="flex-1 text-sm">{item.label}</span>
              <ChevronRight className="h-4 w-4 text-muted-foreground" />
            </Link>
          )
        })}
      </Card>

      <Button
        variant="outline"
        className="w-full gap-2 text-destructive hover:text-destructive"
        onClick={async () => {
          await signOut()
          nav("/")
        }}
      >
        <LogOut className="h-4 w-4" /> 退出登录
      </Button>
    </div>
  )
}
