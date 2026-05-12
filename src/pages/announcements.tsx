import { useEffect, useState } from "react"
import { useNavigate } from "react-router-dom"
import { supabase } from "@/lib/supabase"
import type { Announcement } from "@/lib/database.types"
import { Card } from "@/components/ui/card"
import { ArrowLeft, Megaphone } from "lucide-react"
import { timeAgo } from "@/lib/hijri"

export function AnnouncementsPage() {
  const nav = useNavigate()
  const [items, setItems] = useState<Announcement[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    supabase
      .from("announcements")
      .select("*")
      .eq("is_active", true)
      .order("created_at", { ascending: false })
      .then(({ data }) => {
        setItems(data ?? [])
        setLoading(false)
      })
  }, [])

  return (
    <div className="px-4 pt-4 pb-8 space-y-4">
      <button
        onClick={() => nav(-1)}
        className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="h-4 w-4" /> 返回
      </button>
      <div className="flex items-center gap-3">
        <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-accent/20 text-accent-foreground ring-1 ring-accent/30">
          <Megaphone className="h-5 w-5" />
        </span>
        <div>
          <h1 className="text-2xl sm:text-3xl font-serif-cn font-bold tracking-tight leading-tight">社区公告</h1>
          <p className="text-xs text-muted-foreground mt-0.5">来自管理团队的重要通知</p>
        </div>
      </div>
      {loading ? null : items.length === 0 ? (
        <Card className="p-10 text-center bg-muted/30">
          <p className="text-sm text-muted-foreground">暂无公告</p>
        </Card>
      ) : (
        items.map((a) => (
          <Card
            key={a.id}
            className="relative overflow-hidden border-accent/30 bg-gradient-to-br from-accent/10 via-card to-card shadow-sm"
          >
            <span
              aria-hidden
              className="absolute left-0 top-0 h-full w-1.5 bg-gradient-to-b from-accent via-primary/70 to-primary"
            />
            <div className="p-5 sm:p-6 pl-6 sm:pl-7 space-y-3">
              <div className="flex items-center gap-2 text-[11px] uppercase tracking-[0.18em] text-accent-foreground/80 font-semibold">
                <Megaphone className="h-3.5 w-3.5" />
                公告
                <span className="text-border">·</span>
                <span className="normal-case tracking-normal text-muted-foreground font-normal">
                  {timeAgo(a.created_at)}
                </span>
              </div>
              <h2 className="font-serif-cn font-bold text-xl sm:text-2xl leading-snug text-foreground">
                {a.title}
              </h2>
              <div className="h-px bg-gradient-to-r from-accent/40 via-border to-transparent" />
              <p className="text-[15px] sm:text-base whitespace-pre-wrap leading-8 text-foreground font-serif-cn">
                {a.content}
              </p>
            </div>
          </Card>
        ))
      )}
    </div>
  )
}
