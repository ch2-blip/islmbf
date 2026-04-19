import { useEffect, useState } from "react"
import { useAuth } from "@/contexts/auth-context"
import { supabase } from "@/lib/supabase"
import type { Notification } from "@/lib/database.types"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Link, useNavigate } from "react-router-dom"
import { Bell, MessageCircle, Heart } from "lucide-react"
import { timeAgo } from "@/lib/hijri"
import { Skeleton } from "@/components/ui/skeleton"

export function MessagesPage() {
  const { user } = useAuth()
  const nav = useNavigate()
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!user) {
      setLoading(false)
      return
    }
    load()
  }, [user])

  async function load() {
    if (!user) return
    const { data } = await supabase
      .from("notifications")
      .select("*")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })
      .limit(50)
    setNotifications(data ?? [])
    setLoading(false)
    if (data && data.some((n) => !n.is_read)) {
      await supabase.from("notifications").update({ is_read: true }).eq("user_id", user.id).eq("is_read", false)
    }
  }

  if (!user) {
    return (
      <div className="px-4 pt-12 text-center space-y-4">
        <p className="text-muted-foreground">登录后查看消息通知</p>
        <Button onClick={() => nav("/login")}>立即登录</Button>
      </div>
    )
  }

  return (
    <div className="px-4 pt-4 pb-8 space-y-4">
      <div className="flex items-center gap-2">
        <Bell className="h-5 w-5 text-primary" />
        <h1 className="text-xl font-serif-cn font-semibold">消息</h1>
      </div>

      {loading ? (
        <Skeleton className="h-48 w-full" />
      ) : notifications.length === 0 ? (
        <Card className="p-10 text-center bg-muted/30 border-dashed">
          <Bell className="h-8 w-8 mx-auto text-muted-foreground mb-2" />
          <p className="text-sm text-muted-foreground">暂无新消息</p>
        </Card>
      ) : (
        <Card className="overflow-hidden divide-y divide-border/60">
          {notifications.map((n) => {
            const Icon = n.type === "like" ? Heart : n.type === "comment" ? MessageCircle : Bell
            const content = (
              <div className="flex items-start gap-3 p-4 hover:bg-muted/50 transition-colors">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10 text-primary shrink-0">
                  <Icon className="h-4 w-4" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-medium mb-0.5">{n.title}</div>
                  {n.content && <div className="text-xs text-muted-foreground line-clamp-2">{n.content}</div>}
                  <div className="text-[10px] text-muted-foreground mt-1">{timeAgo(n.created_at)}</div>
                </div>
                {!n.is_read && <div className="h-2 w-2 rounded-full bg-accent shrink-0 mt-2" />}
              </div>
            )
            return n.link ? (
              <Link key={n.id} to={n.link}>{content}</Link>
            ) : (
              <div key={n.id}>{content}</div>
            )
          })}
        </Card>
      )}
    </div>
  )
}
