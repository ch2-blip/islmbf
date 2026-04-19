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
      <div className="flex items-center gap-2">
        <Megaphone className="h-5 w-5 text-accent-foreground" />
        <h1 className="text-xl font-serif-cn font-semibold">社区公告</h1>
      </div>
      {loading ? null : items.length === 0 ? (
        <Card className="p-10 text-center bg-muted/30">
          <p className="text-sm text-muted-foreground">暂无公告</p>
        </Card>
      ) : (
        items.map((a) => (
          <Card key={a.id} className="p-5 border-accent/20">
            <h2 className="font-serif-cn font-semibold text-lg">{a.title}</h2>
            <p className="text-xs text-muted-foreground mt-1">{timeAgo(a.created_at)}</p>
            <p className="mt-3 text-sm whitespace-pre-wrap leading-relaxed">{a.content}</p>
          </Card>
        ))
      )}
    </div>
  )
}
